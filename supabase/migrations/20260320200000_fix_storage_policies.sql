-- Create community-posts storage bucket (for post image uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('community-posts', 'community-posts', true)
ON CONFLICT (id) DO NOTHING;

-- Allow any authenticated user to view community post images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view community post images'
  ) THEN
    CREATE POLICY "Anyone can view community post images" ON storage.objects
      FOR SELECT USING (bucket_id = 'community-posts');
  END IF;
END $$;

-- Allow any authenticated user to upload community post images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload post images'
  ) THEN
    CREATE POLICY "Authenticated users can upload post images" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'community-posts' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Allow users to delete their own community post images
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own post images'
  ) THEN
    CREATE POLICY "Users can delete own post images" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'community-posts' AND auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Fix course-videos bucket: drop admin-only upload policies and replace with authenticated-user policies
-- (Course creation is controlled at the app layer; storage itself allows any authenticated user)
DROP POLICY IF EXISTS "Admins can upload course videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update course videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course videos" ON storage.objects;

CREATE POLICY "Authenticated users can upload course videos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'course-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update course videos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'course-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete course videos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'course-videos' AND auth.uid() IS NOT NULL);
