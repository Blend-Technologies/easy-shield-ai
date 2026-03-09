
-- Add video_url column to course_items
ALTER TABLE public.course_items ADD COLUMN video_url text;

-- Create storage bucket for course videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-videos', 'course-videos', true);

-- Allow admins to upload to course-videos bucket
CREATE POLICY "Admins can upload course videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-videos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update course videos
CREATE POLICY "Admins can update course videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-videos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete course videos
CREATE POLICY "Admins can delete course videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-videos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Allow anyone to view course videos
CREATE POLICY "Anyone can view course videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'course-videos');
