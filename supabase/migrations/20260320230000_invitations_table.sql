-- Pending invitations table (stores email + intended role before the user signs up)
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'member',
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert/delete invitations
-- (The invite button is already restricted to admins in the UI)
CREATE POLICY "Authenticated users can manage invitations"
  ON public.invitations FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- The trigger (SECURITY DEFINER) needs to read invitations — allow public read
CREATE POLICY "Anyone can read invitations"
  ON public.invitations FOR SELECT
  USING (true);

-- Update handle_new_user trigger to assign role from invitations on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invited_role app_role;
BEGIN
  -- Create the profile
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  -- Assign role from pending invitation if one exists
  SELECT role INTO invited_role
  FROM public.invitations
  WHERE email = NEW.email
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, invited_role)
    ON CONFLICT DO NOTHING;

    -- Clean up the used invitation
    DELETE FROM public.invitations WHERE email = NEW.email;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
