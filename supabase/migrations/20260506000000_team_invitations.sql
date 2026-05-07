CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, email),
  CONSTRAINT team_invitations_status_check CHECK (status IN ('pending', 'accepted', 'expired'))
);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Team members can view invitations for their teams
CREATE POLICY "team_members_can_view_invitations" ON team_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_invitations.team_id
        AND team_members.user_id = auth.uid()
    )
  );

-- Allow service role full access (edge functions use service role key)
