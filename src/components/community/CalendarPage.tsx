import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ClipboardList,
  RefreshCw,
  Settings,
  Search,
  Plus,
  ChevronsUpDown,
  X,
  Trash2,
  Pencil,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type ViewMode = "Day" | "Week" | "Month" | "Agenda";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatHour(h: number) {
  if (h === 0) return "12 am";
  if (h < 12) return `${h} am`;
  if (h === 12) return "12 pm";
  return `${h - 12} pm`;
}

function getWeekNumber(d: Date) {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime() + (start.getTimezoneOffset() - d.getTimezoneOffset()) * 60000;
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

function toLocalDatetimeString(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CalendarPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [quickEvent, setQuickEvent] = useState<{ day: number; hour: number } | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [allDayCollapsed, setAllDayCollapsed] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<(CommunityEvent & { start: Date; end: Date }) | null>(null);
  const [editEvent, setEditEvent] = useState<CommunityEvent | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", event_date: "", end_date: "", meeting_link: "", meeting_platform: "zoom", organizer_name: "", max_attendees: 0 });
  const gridRef = useRef<HTMLDivElement>(null);
  const { events, createEvent, deleteEvent, refetch } = useCommunityEvents();
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (gridRef.current) {
      const currentHour = new Date().getHours();
      gridRef.current.scrollTop = Math.max(0, (currentHour - 2) * 60);
    }
  }, []);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const today = new Date();

  const periodLabel = useMemo(() => {
    const m = weekStart.toLocaleDateString("en-US", { month: "long" });
    const y = weekStart.getFullYear();
    const wn = getWeekNumber(weekStart);
    return `${m} ${y} W${wn}`;
  }, [weekStart]);

  const navigate = (dir: number) => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d;
    });
  };

  const calendarEvents = useMemo(() => {
    return events
      .filter((e) => !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .map((e) => ({ ...e, start: new Date(e.event_date), end: new Date(e.end_date) }))
      .filter((e) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        return e.start < weekEnd && e.end > weekStart;
      });
  }, [events, weekStart, searchQuery]);

  const getEventsForDay = (dayDate: Date) => calendarEvents.filter((e) => isSameDay(e.start, dayDate));

  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTimeFormatted = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false }).slice(0, 5);

  const handleQuickCreate = async () => {
    if (!quickTitle.trim() || !quickEvent) return;
    if (!isAdmin) {
      toast({ title: "Only admins can create events", variant: "destructive" });
      return;
    }
    const day = weekDays[quickEvent.day];
    const startDate = new Date(day);
    startDate.setHours(quickEvent.hour, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(quickEvent.hour + 1);

    await createEvent({
      title: quickTitle,
      description: "",
      event_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      meeting_link: "",
      meeting_platform: "zoom",
      organizer_name: "Host",
      max_attendees: 0,
    });
    setQuickEvent(null);
    setQuickTitle("");
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(eventId);
    setSelectedEvent(null);
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
    // Use supabase directly for update
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

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] bg-background relative">
      {/* Header */}
      <div className="border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-foreground text-base ml-1">{periodLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 text-sm rounded-lg">
                  {viewMode} <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(["Day", "Week", "Month", "Agenda"] as ViewMode[]).map((v) => (
                  <DropdownMenuItem key={v} onClick={() => setViewMode(v)}>{v}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-pink-500" /> AI Notes
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <ClipboardList className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">1</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setNow(new Date())}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Day column headers */}
        <div className="flex border-t border-border">
          <div className="w-16 flex-shrink-0 flex items-center justify-center py-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
              <Plus className="w-3 h-3" /> PST
            </span>
          </div>
          {weekDays.map((day, i) => {
            const isToday = isSameDay(day, today);
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div key={i} className={`flex-1 text-center py-2 border-l border-border ${isWeekend ? "text-muted-foreground/60" : ""}`}>
                <span className="text-xs font-medium">{DAY_NAMES[day.getDay()]}</span>{" "}
                {isToday ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">{day.getDate()}</span>
                ) : (
                  <span className={`text-xs ${isWeekend ? "text-muted-foreground/60" : "text-foreground"}`}>{day.getDate()}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* All day row */}
      {!allDayCollapsed ? (
        <div className="flex border-b border-border flex-shrink-0" style={{ height: 28 }}>
          <div className="w-16 flex-shrink-0 flex items-center justify-center">
            <button onClick={() => setAllDayCollapsed(true)} className="text-[11px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground">
              <ChevronsUpDown className="w-3 h-3" /> All day
            </button>
          </div>
          {weekDays.map((_, i) => <div key={i} className="flex-1 border-l border-border" />)}
        </div>
      ) : (
        <button onClick={() => setAllDayCollapsed(false)} className="text-[10px] text-muted-foreground px-4 py-0.5 border-b border-border text-left hover:text-foreground">
          ▸ Show all day
        </button>
      )}

      {/* Time grid */}
      <div ref={gridRef} className="flex-1 overflow-y-auto relative">
        <div className="flex relative" style={{ height: HOURS.length * 60 }}>
          {/* Time labels */}
          <div className="w-16 flex-shrink-0 relative">
            {HOURS.map((h) => (
              <div key={h} className="absolute right-2 text-[11px] text-muted-foreground" style={{ top: h * 60 - 7 }}>
                {h > 0 ? formatHour(h) : ""}
              </div>
            ))}
            {weekDays.some((d) => isSameDay(d, today)) && (
              <div className="absolute right-0 z-20 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ top: currentTimeMinutes - 8 }}>
                {currentTimeFormatted}
              </div>
            )}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const isToday = isSameDay(day, today);
            const dayEvents = getEventsForDay(day);

            return (
              <div key={dayIdx} className="flex-1 relative border-l border-border">
                {HOURS.map((h) => (
                  <div key={h} className="absolute w-full border-t border-border/50" style={{ top: h * 60 }} />
                ))}

                {/* Clickable slots (admin only for create) */}
                {HOURS.map((h) => (
                  <Popover
                    key={h}
                    open={quickEvent?.day === dayIdx && quickEvent?.hour === h}
                    onOpenChange={(open) => { if (!open) setQuickEvent(null); }}
                  >
                    <PopoverTrigger asChild>
                      <div
                        className="absolute w-full cursor-pointer hover:bg-accent/30 transition-colors"
                        style={{ top: h * 60, height: 60 }}
                        onClick={() => { setQuickEvent({ day: dayIdx, hour: h }); setQuickTitle(""); }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" side="right">
                      <p className="text-sm font-medium mb-2">
                        {day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {formatHour(h)}
                      </p>
                      {isAdmin ? (
                        <>
                          <Input placeholder="Event title" value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} className="mb-2" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleQuickCreate(); }} />
                          <Button size="sm" className="w-full" onClick={handleQuickCreate}>Create</Button>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Only admins can create events.</p>
                      )}
                    </PopoverContent>
                  </Popover>
                ))}

                {/* Current time indicator */}
                {isToday && (
                  <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: currentTimeMinutes }}>
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-[5px]" />
                      <div className="flex-1 h-[2px] bg-destructive" />
                    </div>
                  </div>
                )}

                {/* Event blocks */}
                {dayEvents.map((ev) => {
                  const startMin = ev.start.getHours() * 60 + ev.start.getMinutes();
                  const endMin = ev.end.getHours() * 60 + ev.end.getMinutes();
                  const duration = Math.max(endMin - startMin, 30);
                  return (
                    <Popover key={ev.id} open={selectedEvent?.id === ev.id} onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}>
                      <PopoverTrigger asChild>
                        <div
                          className="absolute left-1 right-1 rounded-md bg-primary text-primary-foreground px-2 py-1 overflow-hidden z-10 cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ top: startMin, height: duration }}
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                        >
                          <p className="text-xs font-semibold truncate">{ev.title}</p>
                          <p className="text-[10px] opacity-80">
                            {ev.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} –{" "}
                            {ev.end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-4" side="right">
                        <h4 className="font-semibold text-foreground mb-1">{ev.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {ev.start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
                          {ev.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} –{" "}
                          {ev.end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </p>
                        {ev.description && <p className="text-sm text-muted-foreground mb-2">{ev.description}</p>}
                        <p className="text-xs text-muted-foreground">Organizer: {ev.organizer_name}</p>
                        <p className="text-xs text-muted-foreground mb-2">RSVPs: {ev.rsvp_count}{ev.max_attendees ? ` / ${ev.max_attendees}` : ""}</p>
                        {ev.meeting_link && (
                          <a href={ev.meeting_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 mb-3 hover:underline">
                            <ExternalLink className="w-3 h-3" /> Join {ev.meeting_platform || "meeting"}
                          </a>
                        )}
                        {isAdmin && (
                          <div className="flex gap-2 pt-2 border-t border-border">
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom search bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-2 bg-background border border-border rounded-full shadow-lg px-4 py-2 w-[480px]">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            placeholder="Search events, teammates, commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

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
                <label className="text-xs text-muted-foreground">Start</label>
                <Input type="datetime-local" value={editForm.event_date} onChange={(e) => setEditForm((f) => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">End</label>
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
            <Button className="w-full" onClick={handleEditSave}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
