import { useState, useMemo } from "react";
import { Asterisk, MoreHorizontal, ChevronDown, Clock, Video, User, Users, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useCommunityEvents, type CommunityEvent } from "@/hooks/useCommunityEvents";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import CreateEventModal from "./CreateEventModal";

function formatEventDate(dateStr: string, endStr: string) {
  const date = new Date(dateStr);
  const endDate = new Date(endStr);
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const startTime = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const endTime = endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  return `${dayName}, ${month} ${day}, ${startTime} – ${endTime}`;
}

function getStartsIn(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff < 0) return "Already passed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Starts today";
  if (days === 1) return "Starts tomorrow";
  return `Starts in ${days} days`;
}

const platformLabel: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  teams: "Microsoft Teams",
  other: "Online",
};

const BlueBanner = ({ children, height = "h-56", imageUrl }: { children?: React.ReactNode; height?: string; imageUrl?: string | null }) => (
  <div className={`relative ${height} w-full rounded-xl overflow-hidden bg-gray-900`}>
    {imageUrl ? (
      <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
    ) : (
      <div className="absolute inset-0">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-events" width="28" height="28" patternUnits="userSpaceOnUse">
              <rect width="28" height="28" fill="none" />
              <rect x="1" y="1" width="26" height="26" rx="3" fill="none" stroke="rgba(59,130,246,0.25)" strokeWidth="1" />
            </pattern>
            <linearGradient id="fade-events" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(17,24,39)" stopOpacity="1" />
              <stop offset="40%" stopColor="rgb(17,24,39)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(17,24,39)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-events)" />
          <rect width="100%" height="100%" fill="url(#fade-events)" />
        </svg>
      </div>
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    {/* Logo icon */}
    <div className="absolute top-4 left-4">
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
        <Asterisk className="w-4 h-4 text-white" />
      </div>
    </div>
    {children}
  </div>
);

const EventCard = ({
  event,
  isNext,
  onRsvp,
  isAdmin,
  onDelete,
}: {
  event: CommunityEvent;
  isNext: boolean;
  onRsvp: () => void;
  isAdmin: boolean;
  onDelete: () => void;
}) => {
  const isPast = new Date(event.event_date).getTime() < Date.now();

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      {isNext && (
        <BlueBanner height="h-48" imageUrl={event.image_url}>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white font-bold text-xl leading-tight">{event.title}</p>
          </div>
        </BlueBanner>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground">{event.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{formatEventDate(event.event_date, event.end_date)}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isPast && (
              <Button
                size="sm"
                onClick={onRsvp}
                className={
                  event.user_has_rsvpd
                    ? "bg-muted text-muted-foreground hover:bg-muted/80 rounded-full px-4"
                    : "bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4"
                }
              >
                {event.user_has_rsvpd ? (
                  <>Registered <Check className="w-3.5 h-3.5 ml-1" /></>
                ) : (
                  "RSVP"
                )}
              </Button>
            )}
            {isAdmin && (
              <Button size="icon" variant="ghost" onClick={onDelete} className="text-muted-foreground hover:text-destructive h-8 w-8">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        {event.description && (
          <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
        )}
        {event.meeting_link && (
          <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
            Join on {platformLabel[event.meeting_platform] || event.meeting_platform}
          </a>
        )}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary" className="gap-1.5 rounded-full bg-muted text-muted-foreground text-xs font-normal px-2.5 py-1">
            <Clock className="w-3 h-3" />
            {isPast ? "Already passed" : getStartsIn(event.event_date)}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 rounded-full bg-muted text-muted-foreground text-xs font-normal px-2.5 py-1">
            <Video className="w-3 h-3" />
            {platformLabel[event.meeting_platform] || "Online"}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 rounded-full bg-muted text-muted-foreground text-xs font-normal px-2.5 py-1">
            <User className="w-3 h-3" />
            {event.organizer_name}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 rounded-full bg-muted text-muted-foreground text-xs font-normal px-2.5 py-1">
            <Users className="w-3 h-3" />
            {event.rsvp_count} Attendees
          </Badge>
        </div>
      </div>
    </div>
  );
};

type FilterType = "upcoming" | "past" | "all";

const EventsPage = () => {
  const [filter, setFilter] = useState<FilterType>("upcoming");
  const [createOpen, setCreateOpen] = useState(false);
  const { events, loading, toggleRsvp, createEvent, deleteEvent, uploadEventImage } = useCommunityEvents();
  const { isAdmin } = useIsAdmin();

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    switch (filter) {
      case "upcoming":
        return events.filter((e) => new Date(e.event_date).getTime() >= now);
      case "past":
        return events.filter((e) => new Date(e.event_date).getTime() < now);
      default:
        return [...events];
    }
  }, [filter, events]);

  const nextEvent = filter === "upcoming" ? filteredEvents[0] : null;
  const remainingEvents = nextEvent ? filteredEvents.slice(1) : filteredEvents;

  const filterLabel: Record<FilterType, string> = {
    upcoming: "Upcoming",
    past: "Past",
    all: "All events",
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Asterisk className="w-6 h-6 text-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Events</h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 rounded-full">
              <Plus className="w-4 h-4" /> Create Event
            </Button>
          )}
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero banner */}
      <BlueBanner>
        <div className="absolute bottom-5 left-5">
          <p className="text-white font-bold text-[28px] leading-tight">Upcoming Events</p>
        </div>
      </BlueBanner>

      {/* Filter dropdown */}
      <div className="mt-5 mb-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-full gap-1.5 px-4 text-sm font-medium">
              {filterLabel[filter]}
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setFilter("upcoming")}>Upcoming</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("past")}>Past</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("all")}>All events</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {loading && <p className="text-muted-foreground text-sm py-12 text-center">Loading events…</p>}

      {!loading && filteredEvents.length === 0 && (
        <p className="text-muted-foreground text-sm py-12 text-center">No events found.</p>
      )}

      {/* Next event */}
      {nextEvent && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-3">Next event</h2>
          <EventCard
            event={nextEvent}
            isNext
            onRsvp={() => toggleRsvp(nextEvent.id)}
            isAdmin={isAdmin}
            onDelete={() => deleteEvent(nextEvent.id)}
          />
        </div>
      )}

      {/* Remaining events */}
      {remainingEvents.length > 0 && (
        <div className="space-y-4">
          {nextEvent && <h2 className="text-base font-semibold text-foreground mb-1">More upcoming events</h2>}
          {remainingEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isNext={false}
              onRsvp={() => toggleRsvp(event.id)}
              isAdmin={isAdmin}
              onDelete={() => deleteEvent(event.id)}
            />
          ))}
        </div>
      )}

      {/* Create event modal */}
      <CreateEventModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={createEvent}
        uploadImage={uploadEventImage}
      />
    </div>
  );
};

export default EventsPage;
