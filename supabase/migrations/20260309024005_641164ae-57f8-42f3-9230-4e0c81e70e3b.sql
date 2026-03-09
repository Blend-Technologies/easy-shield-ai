
-- Events table
CREATE TABLE public.community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  image_url text,
  event_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  meeting_link text DEFAULT '',
  meeting_platform text DEFAULT 'zoom',
  organizer_name text NOT NULL DEFAULT 'Host',
  max_attendees integer DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- Anyone can view events
CREATE POLICY "Anyone can view events" ON public.community_events
  FOR SELECT USING (true);

-- Admins can manage events
CREATE POLICY "Admins can insert events" ON public.community_events
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update events" ON public.community_events
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete events" ON public.community_events
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Event RSVPs table
CREATE TABLE public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Anyone can view RSVPs (for attendee counts)
CREATE POLICY "Anyone can view rsvps" ON public.event_rsvps
  FOR SELECT USING (true);

-- Authenticated users can RSVP
CREATE POLICY "Users can rsvp" ON public.event_rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can cancel their own RSVP
CREATE POLICY "Users can cancel rsvp" ON public.event_rsvps
  FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for event images
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);

CREATE POLICY "Anyone can view event images" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Admins can upload event images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'event-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete event images" ON storage.objects
  FOR DELETE USING (bucket_id = 'event-images' AND has_role(auth.uid(), 'admin'::app_role));
