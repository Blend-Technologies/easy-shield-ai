-- Members who joined a community via public invite link (name + email, no auth required)
CREATE TABLE IF NOT EXISTS community_members (
  id            uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id  uuid         NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  full_name     text         NOT NULL,
  email         text         NOT NULL,
  joined_at     timestamptz  DEFAULT now(),
  UNIQUE (community_id, email)
);

ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- Community owners can read their members
CREATE POLICY "owners can view community members"
  ON community_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = community_members.community_id
        AND courses.created_by = auth.uid()
    )
  );

-- Public insert — anyone with the invite link can register
CREATE POLICY "public can join community"
  ON community_members FOR INSERT
  WITH CHECK (true);

-- Community owners can remove members
CREATE POLICY "owners can delete community members"
  ON community_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = community_members.community_id
        AND courses.created_by = auth.uid()
    )
  );
