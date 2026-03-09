import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  event_date: string;
  end_date: string;
  meeting_link: string;
  meeting_platform: string;
  organizer_name: string;
  max_attendees: number;
  created_by: string;
  created_at: string;
  rsvp_count: number;
  user_has_rsvpd: boolean;
}

export function useCommunityEvents() {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const { data: eventsData, error } = await supabase
      .from("community_events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      toast({ title: "Error loading events", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch RSVP counts and user's RSVPs
    const eventIds = (eventsData || []).map((e: any) => e.id);
    let rsvpCounts: Record<string, number> = {};
    let userRsvps: Set<string> = new Set();

    if (eventIds.length > 0) {
      const { data: rsvps } = await supabase
        .from("event_rsvps")
        .select("event_id, user_id")
        .in("event_id", eventIds);

      if (rsvps) {
        for (const r of rsvps) {
          rsvpCounts[r.event_id] = (rsvpCounts[r.event_id] || 0) + 1;
          if (r.user_id === userId) userRsvps.add(r.event_id);
        }
      }
    }

    const mapped: CommunityEvent[] = (eventsData || []).map((e: any) => ({
      ...e,
      rsvp_count: rsvpCounts[e.id] || 0,
      user_has_rsvpd: userRsvps.has(e.id),
    }));

    setEvents(mapped);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const toggleRsvp = async (eventId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in to RSVP", variant: "destructive" });
      return;
    }

    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    if (event.user_has_rsvpd) {
      await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
    } else {
      await supabase.from("event_rsvps").insert({ event_id: eventId, user_id: user.id });
    }

    // Optimistic update
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              user_has_rsvpd: !e.user_has_rsvpd,
              rsvp_count: e.user_has_rsvpd ? e.rsvp_count - 1 : e.rsvp_count + 1,
            }
          : e,
      ),
    );
  };

  const createEvent = async (data: {
    title: string;
    description: string;
    event_date: string;
    end_date: string;
    meeting_link: string;
    meeting_platform: string;
    organizer_name: string;
    max_attendees: number;
    image_url?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("community_events").insert({
      ...data,
      created_by: user.id,
    });

    if (error) {
      toast({ title: "Error creating event", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Event created successfully" });
    fetchEvents();
  };

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase.from("community_events").delete().eq("id", eventId);
    if (error) {
      toast({ title: "Error deleting event", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Event deleted" });
    fetchEvents();
  };

  const uploadEventImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `event-images/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    return data.publicUrl;
  };

  return { events, loading, toggleRsvp, createEvent, deleteEvent, uploadEventImage, refetch: fetchEvents };
}
