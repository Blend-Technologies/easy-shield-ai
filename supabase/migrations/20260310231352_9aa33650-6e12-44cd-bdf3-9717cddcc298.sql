
-- Create security definer function to check team membership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_team_member_or_creator(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams WHERE id = _team_id AND created_by = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.team_members WHERE team_id = _team_id AND user_id = _user_id
  );
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view teams they belong to or created" ON public.teams;
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;

-- Recreate teams SELECT policy using the function
CREATE POLICY "Users can view teams they belong to or created"
ON public.teams FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.is_team_member_or_creator(auth.uid(), id));

-- Recreate team_members SELECT policy using the function
CREATE POLICY "Members can view team members"
ON public.team_members FOR SELECT TO authenticated
USING (public.is_team_member_or_creator(auth.uid(), team_id));
