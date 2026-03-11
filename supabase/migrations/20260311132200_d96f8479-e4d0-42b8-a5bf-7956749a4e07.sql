
-- Add project_id to work_items
ALTER TABLE public.work_items
  ADD COLUMN project_id uuid REFERENCES public.spark_projects(id) ON DELETE CASCADE;

-- Add project_id to sprints
ALTER TABLE public.sprints
  ADD COLUMN project_id uuid REFERENCES public.spark_projects(id) ON DELETE CASCADE;

-- Backfill existing work_items: assign to the user's first project
UPDATE public.work_items wi
SET project_id = (
  SELECT sp.id FROM public.spark_projects sp
  WHERE sp.user_id = wi.user_id
  ORDER BY sp.created_at ASC
  LIMIT 1
);

-- Backfill existing sprints
UPDATE public.sprints s
SET project_id = (
  SELECT sp.id FROM public.spark_projects sp
  WHERE sp.user_id = s.user_id
  ORDER BY sp.created_at ASC
  LIMIT 1
);

-- Team members can view work items in projects they belong to
CREATE POLICY "Team members can view project work items"
ON public.work_items
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.team_members tm ON tm.team_id = t.id
    WHERE t.project_id = work_items.project_id
      AND tm.user_id = auth.uid()
  )
);

-- Drop old SELECT policy on work_items
DROP POLICY IF EXISTS "Users can view own work items" ON public.work_items;

-- Team members can view sprints in projects they belong to
CREATE POLICY "Team members can view project sprints"
ON public.sprints
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.team_members tm ON tm.team_id = t.id
    WHERE t.project_id = sprints.project_id
      AND tm.user_id = auth.uid()
  )
);

-- Drop old SELECT policy on sprints
DROP POLICY IF EXISTS "Users can view their own sprints" ON public.sprints;

-- Team members can update work items in their projects
CREATE POLICY "Team members can update project work items"
ON public.work_items
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.team_members tm ON tm.team_id = t.id
    WHERE t.project_id = work_items.project_id
      AND tm.user_id = auth.uid()
  )
);

-- Drop old UPDATE policy
DROP POLICY IF EXISTS "Users can update own work items" ON public.work_items;
