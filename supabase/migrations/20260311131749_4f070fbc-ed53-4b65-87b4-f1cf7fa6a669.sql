
CREATE POLICY "Team members can view projects"
ON public.spark_projects
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.teams t
    JOIN public.team_members tm ON tm.team_id = t.id
    WHERE t.project_id = spark_projects.id
      AND tm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view own projects" ON public.spark_projects;
