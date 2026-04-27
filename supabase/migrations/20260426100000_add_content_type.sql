-- Distinguish communities from courses and mini-courses in the shared courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'community';

-- Existing records are all communities
UPDATE courses SET content_type = 'community' WHERE content_type = 'community';

CREATE INDEX IF NOT EXISTS courses_content_type_idx ON courses(content_type);
