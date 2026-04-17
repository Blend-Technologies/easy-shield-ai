-- Community invites: track email invitations per community
CREATE TABLE IF NOT EXISTS community_invites (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid       NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  invitee_email text      NOT NULL,
  token       uuid        DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  status      text        DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_by  uuid        REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now(),
  expires_at  timestamptz DEFAULT (now() + interval '7 days')
);

ALTER TABLE community_invites ENABLE ROW LEVEL SECURITY;

-- Community owners can insert/read/delete invites for their communities
CREATE POLICY "community_invites_owner" ON community_invites
  FOR ALL USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM courses WHERE id = community_id AND created_by = auth.uid()
    )
  );

-- Invited users can mark their own invite as accepted
CREATE POLICY "community_invites_invitee_update" ON community_invites
  FOR UPDATE USING (
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
