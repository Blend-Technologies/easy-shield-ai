
CREATE TABLE public.work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'backlog',
  assignee_initials text DEFAULT 'KN',
  due_date date,
  priority text NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own work items" ON public.work_items
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work items" ON public.work_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work items" ON public.work_items
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own work items" ON public.work_items
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
