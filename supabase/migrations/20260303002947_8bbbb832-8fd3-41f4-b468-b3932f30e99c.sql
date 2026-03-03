
-- Create sprints table
CREATE TABLE public.sprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sprints" ON public.sprints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sprints" ON public.sprints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sprints" ON public.sprints FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sprints" ON public.sprints FOR DELETE USING (auth.uid() = user_id);

-- Add sprint_id to work_items
ALTER TABLE public.work_items ADD COLUMN sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL;
