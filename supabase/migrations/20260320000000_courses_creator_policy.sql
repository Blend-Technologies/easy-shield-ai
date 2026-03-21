CREATE POLICY "Creators can manage their own courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
