-- Allow course creators to manage sections of their own courses
CREATE POLICY "Creators can manage course sections"
  ON public.course_sections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_sections.course_id
        AND courses.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = course_sections.course_id
        AND courses.created_by = auth.uid()
    )
  );

-- Allow course creators to manage items within their own course sections
CREATE POLICY "Creators can manage course items"
  ON public.course_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_sections
      JOIN public.courses ON courses.id = course_sections.course_id
      WHERE course_sections.id = course_items.section_id
        AND courses.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_sections
      JOIN public.courses ON courses.id = course_sections.course_id
      WHERE course_sections.id = course_items.section_id
        AND courses.created_by = auth.uid()
    )
  );
