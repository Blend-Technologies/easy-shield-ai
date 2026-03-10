CREATE POLICY "Team creators can update members"
ON public.team_members
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM teams WHERE teams.id = team_members.team_id AND teams.created_by = auth.uid()
));