
-- Drop the restrictive "Users can view own profile" policy since it blocks viewing other profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Drop the restrictive "Anyone can view profiles for community" and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Anyone can view profiles for community" ON public.profiles;

CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
