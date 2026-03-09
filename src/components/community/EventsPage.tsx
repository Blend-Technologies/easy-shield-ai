import { useState, useMemo } from "react";
import { Asterisk, MoreHorizontal, ChevronDown, Clock, Video, User, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface MockEvent {
  id: string;
  title: string;
  subtitle: string;
  date: Date;
  endDate: Date;
  description: string;
  host: string;
  attendees: number;
  type: string;
}

const today = new Date();

const MOCK_EVENTS: MockEvent[] = [
  {
    id: "1",
    title: "Weekly Q&A Call",
    subtitle: "Q&A Call w/ Dave",
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 8, 0),
    endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 10, 0),
    description: "Come hang out and get help directly from Dave.",
    host: "Dave Ebbelaar",
    attendees: 14,
    type: "Live Room",
  },
  {
    id: "2",
    title: "Data Pipeline Workshop",
    subtitle: "Building ETL Pipelines",
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 14, 0),
    endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5, 16, 0),
    description: "Hands-on workshop on building scalable data pipelines with Python.",
    host: "Sarah Chen",
    attendees: 23,
    type: "Live Room",
  },
  {
    id: "3",
    title: "Freelance Pricing Strategy",
    subtitle: "Pricing Your Data Services",
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 11, 0),
    endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 9, 12, 30),
    description: "Learn how to price your freelance data services competitively.",
    host: "Dave Ebbelaar",
    attendees: 31,
    type: "Live Room",
  },
  {
    id: "past-1",
    title: "SQL Masterclass",
    subtitle: "Advanced SQL Techniques",
    date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 10, 0),
    endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 12, 0),
    description: "Deep dive into window functions, CTEs, and query optimization.",
    host: "Dave Ebbelaar",
    attendees: 42,
    type: "Live Room",
  },
];

function formatEventDate(date: Date, endDate: Date) {
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const startTime = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const endTime = endDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  return `${dayName}, ${month} ${day}, ${startTime} – ${endTime}`;
}

function getStartsIn(date: Date) {
  const diff = date.getTime() - Date.now();
  if (diff < 0) return "Already passed";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Starts today";
  if (days === 1) return "Starts tomorrow";
  return `Starts in ${days} days`;
}

const BlueBanner = ({ children, height = "h-56" }: { children?: React.ReactNode; height?: string }) => (
  <div className={`relative ${height} w-full rounded-xl overflow-hidden bg-gray-900`}>
    {/* Grid pattern */}
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
  rsvpd,
  onRsvp,
}: {
  event: MockEvent;
  isNext: boolean;
  rsvpd: boolean;
  onRsvp: () => void;
}) => {
  const isPast = event.date.getTime() < Date.now();

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      {isNext && (
        <BlueBanner height="h-48">
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-white font-bold text-xl leading-tight">{event.title}</p>
          </div>
        </BlueBanner>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground">{event.subtitle}</h3>
            <p className="text-sm text-muted-foreground mt-1">{formatEventDate(event.date, event.endDate)}</p>
          </div>
          {!isPast && (
            <Button
              size="sm"
              onClick={onRsvp}
              className={
                rsvpd
                  ? "bg-muted text-muted-foreground hover:bg-muted/80 rounded-full px-4"
                  : "bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4"
              }
            >
              {rsvpd ? (
                <>
                  Registered <Check className="w-3.5 h-3.5 ml-1" />
                </>
              ) : (
                "RSVP"
              )}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="secondary" className="gap-1.5 rounded-full bg-muted text-muted-foreground text-xs font-normal px-2.5 py-1">
            <Clock className="w-3 h-3" />
            {isPast ? "Already passed" : getStartsIn(event.date)}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 rounded-full bg-muted text-muted-foreground text-xs font-normal px-2.5 py-1">
            <Video className="w-3 h-3" />
            {event.type}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 rounded-full bg-muted text-muted-foreground text-xs font-normal px-2.5 py-1">
            <User className="w-3 h-3" />
            {event.host}
          </Badge>
          <Badge variant="secondary" className="gap-1.5 rounded-full bg-muted text-muted-foreground text-xs font-normal px-2.5 py-1">
            <Users className="w-3 h-3" />
            {event.attendees + (rsvpd ? 1 : 0)} Attendees
          </Badge>
        </div>
      </div>
    </div>
  );
};

type FilterType = "upcoming" | "past" | "all";

const EventsPage = () => {
  const [filter, setFilter] = useState<FilterType>("upcoming");
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());

  const toggleRsvp = (id: string) => {
    setRsvps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    switch (filter) {
      case "upcoming":
        return MOCK_EVENTS.filter((e) => e.date.getTime() >= now);
      case "past":
        return MOCK_EVENTS.filter((e) => e.date.getTime() < now);
      default:
        return [...MOCK_EVENTS].sort((a, b) => a.date.getTime() - b.date.getTime());
    }
  }, [filter]);

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
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
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

      {filteredEvents.length === 0 && (
        <p className="text-muted-foreground text-sm py-12 text-center">No events found.</p>
      )}

      {/* Next event */}
      {nextEvent && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-3">Next event</h2>
          <EventCard
            event={nextEvent}
            isNext
            rsvpd={rsvps.has(nextEvent.id)}
            onRsvp={() => toggleRsvp(nextEvent.id)}
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
              rsvpd={rsvps.has(event.id)}
              onRsvp={() => toggleRsvp(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
