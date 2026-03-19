import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Users,
  CalendarDays,
  List,
  Globe,
  Pencil,
  Trash2,
  ExternalLink,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCommunityEvents, CommunityEvent } from "@/hooks/useCommunityEvents";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useToast } from "@/hooks/use-toast";

/* ── colour palette for event pills ── */
const EVENT_COLORS = [
  { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-400" },
  { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-400" },
  { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-400" },
  { bg: "bg-cyan-100", text: "text-cyan-800", dot: "bg-cyan-500" },
  { bg: "bg-purple-100", text: "text-purple-800", dot: "bg-purple-500" },
];

function colorForEvent(title: string) {
  let hash = 0;
  for (const c of title) hash = (hash << 5) - hash + c.charCodeAt(0);
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toLocalDatetimeString(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();
}

/* ── helpers ── */
function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  // Week starts Monday: 0=Mon … 6=Sun
  const startDay = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month fill
  for (let i = startDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }
  // Next month fill
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }
  }
  return cells;
}

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ── Notification prompt ── */
const NotificationPrompt = ({ onDismiss }: { onDismiss: () => void }) => (
  <div className="bg-[#f0ecff] border border-[#d9d0ff] rounded-xl px-6 py-5 flex items-center justify-between gap-6 mb-6">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-[#ece8ff] flex items-center justify-center flex-shrink-0">
        <Bell className="w-5 h-5 text-[#6B4EFF]" />
      </div>
      <div>
        <p className="font-semibold text-gray-900 text-sm">🔔 Enable desktop notifications</p>
        <p className="text-gray-500 text-sm mt-0.5">
          Click <strong>Allow notifications</strong> to enable browser desktop alerts for DMs, comments/replies, and announcements.
        </p>
      </div>
    </div>
    <div className="flex flex-col items-end gap-1 flex-shrink-0">
      <Button className="bg-[#6B4EFF] hover:bg-[#5a3ee6] text-white text-sm gap-2 rounded-lg">
        <Bell className="w-4 h-4" />
        Allow notifications
      </Button>
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 text-xs transition-colors">
        Dismiss
      </button>
    </div>
  </div>
);

/* ── Main component ── */
const CalendarPage = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [now, setNow] = useState(new Date());
  const [showNotifPrompt, setShowNotifPrompt] = useState(true);
  const [localTime, setLocalTime] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedEvent, setSelectedEvent] = useState<(CommunityEvent & { start: Date; end: Date }) | null>(null);
  const [editEvent, setEditEvent] = useState<CommunityEvent | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", event_date: "", end_date: "", meeting_link: "", meeting_platform: "zoom", organizer_name: "", max_attendees: 0 });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date | null>(null);

  const { events, createEvent, deleteEvent, refetch } = useCommunityEvents();
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const timeLabel = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);

  const calendarEvents = useMemo(() => {
    return events.map((e) => ({ ...e, start: new Date(e.event_date), end: new Date(e.end_date) }));
  }, [events]);

  const getEventsForDay = (date: Date) => calendarEvents.filter((e) => isSameDay(e.start, date));

  const navigateMonth = (dir: number) => {
    const d = new Date(year, month + dir);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  /* ── CRUD handlers ── */
  const openCreateForDate = (date: Date) => {
    if (!isAdmin) return;
    setCreateDate(date);
    const startDate = new Date(date);
    startDate.setHours(9, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(10, 0, 0, 0);
    setEditForm({
      title: "",
      description: "",
      event_date: toLocalDatetimeString(startDate),
      end_date: toLocalDatetimeString(endDate),
      meeting_link: "",
      meeting_platform: "zoom",
      organizer_name: "Host",
      max_attendees: 0,
    });
    setCreateDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!editForm.title.trim()) return;
    await createEvent({
      title: editForm.title,
      description: editForm.description,
      event_date: new Date(editForm.event_date).toISOString(),
      end_date: new Date(editForm.end_date).toISOString(),
      meeting_link: editForm.meeting_link,
      meeting_platform: editForm.meeting_platform,
      organizer_name: editForm.organizer_name,
      max_attendees: editForm.max_attendees,
    });
    setCreateDialogOpen(false);
  };

  const openEditModal = (ev: CommunityEvent) => {
    setEditEvent(ev);
    setEditForm({
      title: ev.title,
      description: ev.description || "",
      event_date: toLocalDatetimeString(new Date(ev.event_date)),
      end_date: toLocalDatetimeString(new Date(ev.end_date)),
      meeting_link: ev.meeting_link || "",
      meeting_platform: ev.meeting_platform || "zoom",
      organizer_name: ev.organizer_name,
      max_attendees: ev.max_attendees,
    });
    setSelectedEvent(null);
  };

  const handleEditSave = async () => {
    if (!editEvent) return;
    const { supabase } = await import("@/integrations/supabase/client");
    const { error } = await supabase.from("community_events").update({
      title: editForm.title,
      description: editForm.description,
      event_date: new Date(editForm.event_date).toISOString(),
      end_date: new Date(editForm.end_date).toISOString(),
      meeting_link: editForm.meeting_link,
      meeting_platform: editForm.meeting_platform,
      organizer_name: editForm.organizer_name,
      max_attendees: editForm.max_attendees,
    }).eq("id", editEvent.id);
    if (error) {
      toast({ title: "Error updating event", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Event updated" });
    setEditEvent(null);
    refetch();
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(eventId);
    setSelectedEvent(null);
  };

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Calendar</h1>
        <p className="text-gray-500 text-sm mb-6">Community events and meetups</p>

        {/* Notification prompt */}
        {showNotifPrompt && <NotificationPrompt onDismiss={() => setShowNotifPrompt(false)} />}

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-lg text-sm" onClick={goToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateMonth(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-center">
            <p className="font-bold text-gray-900 text-lg">{monthLabel}</p>
            <p className="text-xs text-gray-400">{timeLabel} Local time</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={localTime} onCheckedChange={setLocalTime} className="data-[state=checked]:bg-[#6B4EFF]" />
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Local time
              </span>
            </div>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                className={`p-1.5 ${viewMode === "list" ? "bg-gray-100" : "bg-white"}`}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4 text-gray-500" />
              </button>
              <button
                className={`p-1.5 ${viewMode === "grid" ? "bg-[#6B4EFF] text-white" : "bg-white text-gray-500"}`}
                onClick={() => setViewMode("grid")}
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>
            {isAdmin && (
              <Button
                size="sm"
                className="bg-[#6B4EFF] hover:bg-[#5a3ee6] text-white gap-1.5 rounded-lg"
                onClick={() => openCreateForDate(new Date())}
              >
                <Plus className="w-4 h-4" /> New Event
              </Button>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7 border-b border-gray-100 last:border-b-0">
              {row.map((cell, ci) => {
                const dayEvents = getEventsForDay(cell.date);
                const isToday = isSameDay(cell.date, today);
                return (
                  <div
                    key={ci}
                    className={`min-h-[110px] border-r border-gray-100 last:border-r-0 p-1.5 cursor-pointer hover:bg-gray-50/50 transition-colors ${
                      !cell.isCurrentMonth ? "bg-gray-50/40" : ""
                    }`}
                    onClick={() => openCreateForDate(cell.date)}
                  >
                    {/* Day number */}
                    <div className="flex justify-start mb-1">
                      {isToday ? (
                        <span className="w-7 h-7 rounded-full bg-[#6B4EFF] text-white text-xs font-bold flex items-center justify-center">
                          {cell.date.getDate()}
                        </span>
                      ) : (
                        <span className={`text-xs font-medium px-1 py-0.5 ${cell.isCurrentMonth ? "text-gray-700" : "text-gray-300"}`}>
                          {cell.date.getDate()}
                        </span>
                      )}
                    </div>

                    {/* Event pills */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev) => {
                        const colors = colorForEvent(ev.title);
                        return (
                          <Popover key={ev.id} open={selectedEvent?.id === ev.id} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
                            <PopoverTrigger asChild>
                              <div
                                className={`${colors.bg} ${colors.text} rounded-md px-1.5 py-1 cursor-pointer hover:opacity-80 transition-opacity`}
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                              >
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 flex-shrink-0" />
                                  <span className="text-[10px] font-medium truncate">{ev.title}</span>
                                </div>
                                <p className="text-[9px] opacity-70 ml-4">
                                  {formatTime(ev.start)} - {formatTime(ev.end)} PT
                                </p>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-4" side="right">
                              <h4 className="font-semibold text-gray-900 mb-1">{ev.title}</h4>
                              <p className="text-xs text-gray-500 mb-2">
                                {ev.start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
                                {formatTime(ev.start)} – {formatTime(ev.end)}
                              </p>
                              {ev.description && <p className="text-sm text-gray-500 mb-2">{ev.description}</p>}
                              <p className="text-xs text-gray-400">Organizer: {ev.organizer_name}</p>
                              <p className="text-xs text-gray-400 mb-2">RSVPs: {ev.rsvp_count}{ev.max_attendees ? ` / ${ev.max_attendees}` : ""}</p>
                              {ev.meeting_link && (
                                <a href={ev.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6B4EFF] flex items-center gap-1 mb-3 hover:underline">
                                  <ExternalLink className="w-3 h-3" /> Join {ev.meeting_platform || "meeting"}
                                </a>
                              )}
                              {isAdmin && (
                                <div className="flex gap-2 pt-2 border-t border-gray-100">
                                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEditModal(ev)}>
                                    <Pencil className="w-3 h-3" /> Edit
                                  </Button>
                                  <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => handleDeleteEvent(ev.id)}>
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </Button>
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <p className="text-[10px] text-gray-400 pl-1">+{dayEvents.length - 2} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Event title" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
            <Textarea placeholder="Description" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Start</label>
                <Input type="datetime-local" value={editForm.event_date} onChange={(e) => setEditForm((f) => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500">End</label>
                <Input type="datetime-local" value={editForm.end_date} onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <Input placeholder="Meeting link" value={editForm.meeting_link} onChange={(e) => setEditForm((f) => ({ ...f, meeting_link: e.target.value }))} />
            <Select value={editForm.meeting_platform} onValueChange={(v) => setEditForm((f) => ({ ...f, meeting_platform: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="google_meet">Google Meet</SelectItem>
                <SelectItem value="teams">Microsoft Teams</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Organizer name" value={editForm.organizer_name} onChange={(e) => setEditForm((f) => ({ ...f, organizer_name: e.target.value }))} />
            <Input type="number" placeholder="Max attendees (0 = unlimited)" value={editForm.max_attendees} onChange={(e) => setEditForm((f) => ({ ...f, max_attendees: parseInt(e.target.value) || 0 }))} />
            <Button className="w-full bg-[#6B4EFF] hover:bg-[#5a3ee6]" onClick={handleCreate}>Create Event</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editEvent} onOpenChange={(open) => { if (!open) setEditEvent(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
            <Textarea placeholder="Description" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">Start</label>
                <Input type="datetime-local" value={editForm.event_date} onChange={(e) => setEditForm((f) => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500">End</label>
                <Input type="datetime-local" value={editForm.end_date} onChange={(e) => setEditForm((f) => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <Input placeholder="Meeting link" value={editForm.meeting_link} onChange={(e) => setEditForm((f) => ({ ...f, meeting_link: e.target.value }))} />
            <Select value={editForm.meeting_platform} onValueChange={(v) => setEditForm((f) => ({ ...f, meeting_platform: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="google_meet">Google Meet</SelectItem>
                <SelectItem value="teams">Microsoft Teams</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Organizer name" value={editForm.organizer_name} onChange={(e) => setEditForm((f) => ({ ...f, organizer_name: e.target.value }))} />
            <Input type="number" placeholder="Max attendees" value={editForm.max_attendees} onChange={(e) => setEditForm((f) => ({ ...f, max_attendees: parseInt(e.target.value) || 0 }))} />
            <Button className="w-full bg-[#6B4EFF] hover:bg-[#5a3ee6]" onClick={handleEditSave}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
