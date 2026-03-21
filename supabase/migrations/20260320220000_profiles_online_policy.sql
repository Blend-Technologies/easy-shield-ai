-- Allow any authenticated user to update their own online status
-- (the existing "Users can update own profile" policy already covers this,
--  but let's make sure it exists with IF NOT EXISTS guard)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;
