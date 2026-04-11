-- ============================================================
-- MIGRATION 001: Redesign Schema
-- ============================================================

-- Step 1: Extend the role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'psychiatrist';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'trusted_adult';

-- Step 2: New enums
DO $$ BEGIN
  CREATE TYPE checkin_mode AS ENUM ('weekly', 'screening');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pillar AS ENUM ('emotional', 'resilience', 'recovery', 'support');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE consent_scope AS ENUM ('summary', 'full');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE consent_target_role AS ENUM ('psychiatrist', 'trusted_adult');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Step 3: Questions pool table
CREATE TABLE IF NOT EXISTS questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar        pillar NOT NULL,
  text          TEXT NOT NULL,
  sub_text      TEXT,
  low_label     TEXT NOT NULL DEFAULT 'Not at all',
  high_label    TEXT NOT NULL DEFAULT 'Completely',
  min_val       INTEGER DEFAULT 1,
  max_val       INTEGER DEFAULT 10,
  modes         checkin_mode[] NOT NULL DEFAULT ARRAY['weekly','screening']::checkin_mode[],
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_questions_pillar ON questions(pillar);
CREATE INDEX IF NOT EXISTS idx_questions_active ON questions(active);

-- Step 4: Add new columns to checkins table
ALTER TABLE checkins
  ADD COLUMN IF NOT EXISTS mode             checkin_mode NOT NULL DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS is_private       BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS emotional_score  NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS resilience_score NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS recovery_score   NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS support_score    NUMERIC(4,2),
  ADD COLUMN IF NOT EXISTS question_ids     UUID[],
  ADD COLUMN IF NOT EXISTS responses        JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_checkins_mode ON checkins(mode);
CREATE INDEX IF NOT EXISTS idx_checkins_private ON checkins(is_private);

-- Step 5: Question usage tracking
CREATE TABLE IF NOT EXISTS question_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  checkin_id  UUID REFERENCES checkins(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_question_usage_athlete ON question_usage(athlete_id);
CREATE INDEX IF NOT EXISTS idx_question_usage_recent  ON question_usage(athlete_id, used_at DESC);

-- Step 6: Consent logs
CREATE TABLE IF NOT EXISTS consent_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_id        UUID REFERENCES checkins(id) ON DELETE SET NULL,
  target_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_role       consent_target_role NOT NULL,
  scope             consent_scope NOT NULL,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  expires_at        TIMESTAMPTZ,
  granted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at        TIMESTAMPTZ,
  revoke_reason     TEXT
);
CREATE INDEX IF NOT EXISTS idx_consent_athlete  ON consent_logs(athlete_id);
CREATE INDEX IF NOT EXISTS idx_consent_target   ON consent_logs(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_consent_active   ON consent_logs(athlete_id, is_active);
CREATE INDEX IF NOT EXISTS idx_consent_checkin  ON consent_logs(checkin_id);

-- Step 7: Access logs
CREATE TABLE IF NOT EXISTS access_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  athlete_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_id        UUID REFERENCES checkins(id) ON DELETE SET NULL,
  consent_log_id    UUID REFERENCES consent_logs(id) ON DELETE SET NULL,
  access_type       TEXT NOT NULL,
  accessed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata          JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_access_logs_athlete ON access_logs(athlete_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_time    ON access_logs(accessed_at DESC);

-- Step 8: Organizations — screening trigger
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS screening_active         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS semester_end_date        DATE,
  ADD COLUMN IF NOT EXISTS screening_window_days    INTEGER NOT NULL DEFAULT 14;

-- Step 9: Profiles — trusted adult linkage
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS linked_athlete_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
