
-- Course sections table
CREATE TABLE public.course_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'New Section',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage course sections"
  ON public.course_sections FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view course sections"
  ON public.course_sections FOR SELECT
  TO authenticated
  USING (true);

-- Course items table
CREATE TABLE public.course_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES public.course_sections(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'New Lecture',
  type text NOT NULL DEFAULT 'lecture',
  media_type text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage course items"
  ON public.course_items FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view course items"
  ON public.course_items FOR SELECT
  TO authenticated
  USING (true);
