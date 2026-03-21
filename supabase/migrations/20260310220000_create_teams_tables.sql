
-- Teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  description text DEFAULT '',
  project_id uuid REFERENCES public.spark_projects(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create teams"
  ON public.teams FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Team creators can update teams"
  ON public.teams FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Team creators can delete teams"
  ON public.teams FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Team members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view team members"
  ON public.team_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND teams.created_by = auth.uid())
  );

CREATE POLICY "Team creators can manage members"
  ON public.team_members FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND teams.created_by = auth.uid())
  );

-- Add teams SELECT policy after team_members exists
CREATE POLICY "Users can view teams they belong to or created"
  ON public.teams FOR SELECT TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.team_members WHERE team_id = id AND user_id = auth.uid())
  );
