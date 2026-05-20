-- ── 016: Team messages ──────────────────────────────────────────────────────
-- Allows coaches to post a short wellness note visible to all athletes on their team.
-- Messages expire after 7 days. Athletes only see the most recent active message.

CREATE TABLE IF NOT EXISTS team_messages (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid        NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  coach_profile_id uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  message          text        NOT NULL CHECK (char_length(message) <= 280),
  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE INDEX IF NOT EXISTS team_messages_team_id_idx ON team_messages(team_id);
CREATE INDEX IF NOT EXISTS team_messages_expires_at_idx ON team_messages(expires_at);

ALTER TABLE team_messages ENABLE ROW LEVEL SECURITY;

-- Coaches can read and write messages for their own team
DROP POLICY IF EXISTS "Coach manages their team messages" ON team_messages;
CREATE POLICY "Coach manages their team messages"
  ON team_messages FOR ALL
  USING (
    get_my_role() = 'coach'
    AND team_id = (
      SELECT team_id FROM profiles
      WHERE auth_user_id = auth.uid() LIMIT 1
    )
  )
  WITH CHECK (
    get_my_role() = 'coach'
    AND team_id = (
      SELECT team_id FROM profiles
      WHERE auth_user_id = auth.uid() LIMIT 1
    )
  );

-- Athletes can read non-expired messages from their team
DROP POLICY IF EXISTS "Athlete reads their team messages" ON team_messages;
CREATE POLICY "Athlete reads their team messages"
  ON team_messages FOR SELECT
  USING (
    get_my_role() = 'athlete'
    AND team_id = (
      SELECT team_id FROM profiles
      WHERE auth_user_id = auth.uid() LIMIT 1
    )
    AND expires_at > now()
  );

-- Admins and support can read all team messages
DROP POLICY IF EXISTS "Admin reads all team messages" ON team_messages;
CREATE POLICY "Admin reads all team messages"
  ON team_messages FOR SELECT
  USING (
    get_my_role() IN ('admin', 'support')
  );
