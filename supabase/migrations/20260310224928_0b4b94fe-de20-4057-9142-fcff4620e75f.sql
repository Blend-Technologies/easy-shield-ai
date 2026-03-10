
-- Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  color text NOT NULL DEFAULT '#7C3AED',
  created_by uuid NOT NULL,
  project_id uuid REFERENCES public.spark_projects(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Teams RLS: users can manage teams they created
CREATE POLICY "Users can view teams they belong to or created" ON public.teams
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.team_members WHERE team_members.team_id = teams.id AND team_members.user_id = auth.uid()
  ));

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team creators can update" ON public.teams
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Team creators can delete" ON public.teams
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- Team members RLS
CREATE POLICY "Members can view team members" ON public.team_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND (teams.created_by = auth.uid() OR EXISTS (
      SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Team creators can manage members" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()
  ));

CREATE POLICY "Team creators can remove members" ON public.team_members
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()
  ) OR user_id = auth.uid());
