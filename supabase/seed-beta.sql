-- ============================================================
-- BETA SEED — Check-In by Athlete Anchor
-- New pillar-based schema: emotional, resilience, recovery, support
--
-- HOW TO RUN:
--   Paste into Supabase SQL Editor and execute.
--   Safe to re-run — uses ON CONFLICT DO NOTHING or IF NOT EXISTS.
--
-- WHAT THIS DOES:
--   1. Creates org + 2 teams
--   2. Updates the dev-portal test accounts (by email) to the org/team
--   3. Creates 13 background athlete profiles to fill teams
--   4. Creates 4 weeks of realistic check-in history
--   5. Creates alerts, follow-ups, consent, access logs, resources
-- ============================================================


-- ============================================================
-- 0. SCHEMA BOOTSTRAP
--    Works on base schema.sql with or without migration 001.
--    Adds missing columns/tables needed for beta seed data.
-- ============================================================

-- NOTE: 'psychiatrist' and 'trusted_adult' enum values must already exist in user_role.
-- If you get an enum error, run this FIRST in a separate query, then re-run this seed:
--   ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'psychiatrist';
--   ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'trusted_adult';

-- New enums (safe if already exist)
DO $$ BEGIN CREATE TYPE checkin_mode AS ENUM ('weekly','screening'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE consent_scope AS ENUM ('summary','full'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE consent_target_role AS ENUM ('psychiatrist','trusted_adult'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE pillar AS ENUM ('emotional','resilience','recovery','support'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Questions table (created in migration 001)
CREATE TABLE IF NOT EXISTS questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar     pillar NOT NULL,
  text       TEXT NOT NULL,
  sub_text   TEXT,
  low_label  TEXT NOT NULL DEFAULT 'Not at all',
  high_label TEXT NOT NULL DEFAULT 'Completely',
  min_val    INTEGER DEFAULT 1,
  max_val    INTEGER DEFAULT 10,
  modes      checkin_mode[] NOT NULL DEFAULT ARRAY['weekly','screening']::checkin_mode[],
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Question usage tracking (created in migration 001)
CREATE TABLE IF NOT EXISTS question_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  used_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  checkin_id  UUID REFERENCES checkins(id) ON DELETE SET NULL
);

-- Checkins: make old required columns nullable (new schema uses pillar scores)
ALTER TABLE checkins ALTER COLUMN mood_score    DROP NOT NULL;
ALTER TABLE checkins ALTER COLUMN stress_score  DROP NOT NULL;
ALTER TABLE checkins ALTER COLUMN sleep_score   DROP NOT NULL;
ALTER TABLE checkins ALTER COLUMN support_score DROP NOT NULL;

-- Checkins: add new pillar columns if not present
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS mode             checkin_mode NOT NULL DEFAULT 'weekly';
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS is_private       BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS emotional_score  NUMERIC(4,2);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS resilience_score NUMERIC(4,2);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS recovery_score   NUMERIC(4,2);
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS question_ids     UUID[];
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS responses        JSONB NOT NULL DEFAULT '{}';

-- Organizations: add screening columns if not present
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS screening_active      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS semester_end_date     DATE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS screening_window_days INTEGER NOT NULL DEFAULT 14;

-- Profiles: add new columns if not present
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linked_athlete_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Consent logs table (new in migration 001)
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

-- Access logs table (new in migration 001) — athlete_id nullable to support aggregate views
CREATE TABLE IF NOT EXISTS access_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  athlete_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  checkin_id        UUID REFERENCES checkins(id) ON DELETE SET NULL,
  consent_log_id    UUID REFERENCES consent_logs(id) ON DELETE SET NULL,
  access_type       TEXT NOT NULL,
  accessed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata          JSONB DEFAULT '{}'
);

-- If access_logs already existed with NOT NULL on athlete_id, make it nullable
ALTER TABLE access_logs ALTER COLUMN athlete_id DROP NOT NULL;


-- ============================================================
-- 1. ORGANIZATION
-- ============================================================
INSERT INTO organizations (id, name, type, reminder_day)
VALUES ('00000000-0000-0000-0000-000000000001', 'State University Athletics', 'university', 1)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 2. TEAMS
-- ============================================================
INSERT INTO teams (id, organization_id, name, sport) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Men''s Basketball', 'Basketball'),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'Women''s Soccer',   'Soccer')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 3. UPDATE DEV PORTAL TEST ACCOUNTS (match by email)
-- These profiles were created by /api/dev/set-role
-- ============================================================

-- Test Athlete → Men's Basketball
UPDATE profiles
SET organization_id = '00000000-0000-0000-0000-000000000001',
    team_id         = '00000000-0000-0000-0001-000000000001',
    full_name       = 'Alex Athlete',
    onboarded       = true
WHERE email = 'checkin.athlete.test@mailinator.com';

-- Test Coach → Men's Basketball coach
UPDATE profiles
SET organization_id = '00000000-0000-0000-0000-000000000001',
    team_id         = '00000000-0000-0000-0001-000000000001',
    full_name       = 'Chris Coach',
    role            = 'coach',
    onboarded       = true
WHERE email = 'checkin.coach.test@mailinator.com';

-- Test Psychiatrist → org (no team)
UPDATE profiles
SET organization_id = '00000000-0000-0000-0000-000000000001',
    full_name       = 'Dr. Parker',
    role            = 'psychiatrist',
    onboarded       = true
WHERE email = 'checkin.psych.test@mailinator.com';

-- Test Trusted Adult → org (no team)
UPDATE profiles
SET organization_id = '00000000-0000-0000-0000-000000000001',
    full_name       = 'Taylor Trusted',
    role            = 'trusted_adult',
    onboarded       = true
WHERE email = 'checkin.trusted.test@mailinator.com';

-- Test Admin → org (no team)
UPDATE profiles
SET organization_id = '00000000-0000-0000-0000-000000000001',
    full_name       = 'Jamie Director',
    role            = 'admin',
    onboarded       = true
WHERE email = 'checkin.admin.test@mailinator.com';


-- ============================================================
-- 4. ADMIN + SUPPORT STAFF (background, no login needed)
-- ============================================================
INSERT INTO profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded) VALUES
  ('00000000-0000-0000-0002-000000000001', '00000000-beef-0000-0000-000000000001', 'Jamie Director',     'admin@stateuniv.edu',     'admin',   '00000000-0000-0000-0000-000000000001', NULL, true),
  ('00000000-0000-0000-0002-000000000002', '00000000-beef-0000-0000-000000000002', 'Dr. Sarah Wellness', 'wellness@stateuniv.edu',  'support', '00000000-0000-0000-0000-000000000001', NULL, true),
  ('00000000-0000-0000-0002-000000000003', '00000000-beef-0000-0000-000000000003', 'Coach Rivera',       'coach2@stateuniv.edu',    'coach',   '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 5. BACKGROUND ATHLETES — Men's Basketball (7 more, total 8 with test account)
-- ============================================================
INSERT INTO profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded) VALUES
  ('00000000-0000-0000-0002-000000000010', '00000000-beef-0000-0000-000000000010', 'Jordan Williams',  'jordan@stateuniv.edu',  'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true),
  ('00000000-0000-0000-0002-000000000011', '00000000-beef-0000-0000-000000000011', 'Marcus Davis',     'marcus@stateuniv.edu',  'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true),
  ('00000000-0000-0000-0002-000000000012', '00000000-beef-0000-0000-000000000012', 'Tyler Brown',      'tyler@stateuniv.edu',   'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true),
  ('00000000-0000-0000-0002-000000000013', '00000000-beef-0000-0000-000000000013', 'Chris Thompson',   'cthompson@stateuniv.edu','athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true),
  ('00000000-0000-0000-0002-000000000014', '00000000-beef-0000-0000-000000000014', 'Darius Hayes',     'darius@stateuniv.edu',  'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true),
  ('00000000-0000-0000-0002-000000000015', '00000000-beef-0000-0000-000000000015', 'Kevin Park',       'kpark@stateuniv.edu',   'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true),
  ('00000000-0000-0000-0002-000000000016', '00000000-beef-0000-0000-000000000016', 'Andre Jackson',    'ajackson@stateuniv.edu','athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. BACKGROUND ATHLETES — Women's Soccer (5)
-- ============================================================
INSERT INTO profiles (id, auth_user_id, full_name, email, role, organization_id, team_id, onboarded) VALUES
  ('00000000-0000-0000-0002-000000000020', '00000000-beef-0000-0000-000000000020', 'Emma Rodriguez', 'emma@stateuniv.edu',  'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true),
  ('00000000-0000-0000-0002-000000000021', '00000000-beef-0000-0000-000000000021', 'Sofia Patel',    'sofia@stateuniv.edu', 'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true),
  ('00000000-0000-0000-0002-000000000022', '00000000-beef-0000-0000-000000000022', 'Maya Johnson',   'maya@stateuniv.edu',  'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true),
  ('00000000-0000-0000-0002-000000000023', '00000000-beef-0000-0000-000000000023', 'Ava Kim',        'avak@stateuniv.edu',  'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true),
  ('00000000-0000-0000-0002-000000000024', '00000000-beef-0000-0000-000000000024', 'Priya Nair',     'priya@stateuniv.edu', 'athlete', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 7. CHECK-INS (new schema: pillar scores, mode, no risk_level)
-- All check-ins use fixed UUIDs so re-running the seed is idempotent.
-- UUID scheme: 00000000-0000-0000-[athlete-suffix]-[checkin-number]
-- ============================================================

-- ---- TEST ATHLETE (checkin.athlete.test@mailinator.com) ----
-- Uses INSERT...SELECT with fixed IDs; skips if already inserted
-- 4 weeks of history — improving trend
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at)
SELECT '00000000-0000-0000-0005-000000000001', p.id, p.team_id, 'weekly', true, 6.2, 7.1, 5.8, 6.5, '{}', '{}', NOW() - INTERVAL '21 days'
FROM profiles p WHERE p.email = 'checkin.athlete.test@mailinator.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at)
SELECT '00000000-0000-0000-0005-000000000002', p.id, p.team_id, 'weekly', true, 6.8, 7.4, 6.3, 7.0, '{}', '{}', NOW() - INTERVAL '14 days'
FROM profiles p WHERE p.email = 'checkin.athlete.test@mailinator.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at)
SELECT '00000000-0000-0000-0005-000000000003', p.id, p.team_id, 'weekly', true, 7.3, 7.8, 7.0, 7.5, '{}', '{}', NOW() - INTERVAL '7 days'
FROM profiles p WHERE p.email = 'checkin.athlete.test@mailinator.com'
ON CONFLICT (id) DO NOTHING;

INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, notes_private, completed_at)
SELECT '00000000-0000-0000-0005-000000000004', p.id, p.team_id, 'weekly', true, 7.8, 8.2, 7.5, 8.0, '{}', '{}', 'Feeling way better this week. Big game coming up but the team energy is great.', NOW() - INTERVAL '1 day'
FROM profiles p WHERE p.email = 'checkin.athlete.test@mailinator.com'
ON CONFLICT (id) DO NOTHING;

-- ---- JORDAN WILLIAMS (0010) — steady green ----
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at) VALUES
  ('00000000-0000-0000-0010-000000000001', '00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000001', 'weekly', true, 8.1, 7.9, 7.5, 8.3, '{}', '{}', NOW() - INTERVAL '21 days'),
  ('00000000-0000-0000-0010-000000000002', '00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000001', 'weekly', true, 7.8, 8.2, 8.0, 8.5, '{}', '{}', NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0010-000000000003', '00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000001', 'weekly', true, 8.3, 8.0, 7.8, 8.1, '{}', '{}', NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0010-000000000004', '00000000-0000-0000-0002-000000000010', '00000000-0000-0000-0001-000000000001', 'weekly', true, 8.6, 8.4, 8.2, 8.7, '{}', '{}', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ---- MARCUS DAVIS (0011) — declining, concern ----
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at) VALUES
  ('00000000-0000-0000-0011-000000000001', '00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0001-000000000001', 'weekly', true, 7.2, 7.0, 6.8, 7.1, '{}', '{}', NOW() - INTERVAL '21 days'),
  ('00000000-0000-0000-0011-000000000002', '00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0001-000000000001', 'weekly', true, 5.5, 5.8, 5.1, 5.4, '{}', '{}', NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0011-000000000003', '00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0001-000000000001', 'weekly', true, 4.3, 4.5, 3.8, 4.0, '{}', '{}', NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0011-000000000004', '00000000-0000-0000-0002-000000000011', '00000000-0000-0000-0001-000000000001', 'weekly', true, 3.1, 3.6, 2.9, 3.3, '{}', '{}', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ---- TYLER BROWN (0012) — struggling, needs support ----
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at) VALUES
  ('00000000-0000-0000-0012-000000000001', '00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0001-000000000001', 'weekly', true, 6.0, 5.8, 5.5, 6.2, '{}', '{}', NOW() - INTERVAL '21 days'),
  ('00000000-0000-0000-0012-000000000002', '00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0001-000000000001', 'weekly', true, 4.2, 4.0, 3.5, 3.8, '{}', '{}', NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0012-000000000003', '00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0001-000000000001', 'weekly', true, 2.8, 2.5, 2.2, 2.0, '{}', '{}', NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0012-000000000004', '00000000-0000-0000-0002-000000000012', '00000000-0000-0000-0001-000000000001', 'weekly', true, 2.1, 2.3, 1.8, 1.5, '{}', '{}', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ---- CHRIS THOMPSON (0013) — stable ----
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at) VALUES
  ('00000000-0000-0000-0013-000000000001', '00000000-0000-0000-0002-000000000013', '00000000-0000-0000-0001-000000000001', 'weekly', true, 7.4, 6.9, 7.1, 7.6, '{}', '{}', NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0013-000000000002', '00000000-0000-0000-0002-000000000013', '00000000-0000-0000-0001-000000000001', 'weekly', true, 7.1, 7.2, 7.4, 7.8, '{}', '{}', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- ---- DARIUS HAYES (0014) — solid performer ----
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at) VALUES
  ('00000000-0000-0000-0014-000000000001', '00000000-0000-0000-0002-000000000014', '00000000-0000-0000-0001-000000000001', 'weekly', true, 8.0, 7.5, 8.2, 7.9, '{}', '{}', NOW() - INTERVAL '21 days'),
  ('00000000-0000-0000-0014-000000000002', '00000000-0000-0000-0002-000000000014', '00000000-0000-0000-0001-000000000001', 'weekly', true, 8.3, 7.8, 8.4, 8.1, '{}', '{}', NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0014-000000000003', '00000000-0000-0000-0002-000000000014', '00000000-0000-0000-0001-000000000001', 'weekly', true, 7.9, 8.0, 7.8, 8.3, '{}', '{}', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ---- KEVIN PARK (0015) — moderate, recovery dip ----
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at) VALUES
  ('00000000-0000-0000-0015-000000000001', '00000000-0000-0000-0002-000000000015', '00000000-0000-0000-0001-000000000001', 'weekly', true, 6.5, 6.8, 5.2, 7.0, '{}', '{}', NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0015-000000000002', '00000000-0000-0000-0002-000000000015', '00000000-0000-0000-0001-000000000001', 'weekly', true, 6.8, 7.1, 4.8, 7.2, '{}', '{}', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ---- ANDRE JACKSON (0016) — just checked in ----
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at) VALUES
  ('00000000-0000-0000-0016-000000000001', '00000000-0000-0000-0002-000000000016', '00000000-0000-0000-0001-000000000001', 'weekly', true, 7.6, 7.3, 7.8, 7.5, '{}', '{}', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- ---- EMMA RODRIGUEZ (0020) — thriving ----
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at) VALUES
  ('00000000-0000-0000-0020-000000000001', '00000000-0000-0000-0002-000000000020', '00000000-0000-0000-0001-000000000002', 'weekly', true, 8.8, 8.5, 8.9, 9.0, '{}', '{}', NOW() - INTERVAL '21 days'),
  ('00000000-0000-0000-0020-000000000002', '00000000-0000-0000-0002-000000000020', '00000000-0000-0000-0001-000000000002', 'weekly', true, 9.0, 8.7, 9.1, 9.2, '{}', '{}', NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0020-000000000003', '00000000-0000-0000-0002-000000000020', '00000000-0000-0000-0001-000000000002', 'weekly', true, 8.9, 8.8, 8.7, 9.0, '{}', '{}', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- ---- SOFIA PATEL (0021) — exam-period stress ----
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at) VALUES
  ('00000000-0000-0000-0021-000000000001', '00000000-0000-0000-0002-000000000021', '00000000-0000-0000-0001-000000000002', 'weekly', true, 6.2, 5.9, 6.5, 6.0, '{}', '{}', NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0021-000000000002', '00000000-0000-0000-0002-000000000021', '00000000-0000-0000-0001-000000000002', 'weekly', true, 4.5, 4.2, 5.0, 3.8, '{}', '{}', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- ---- MAYA JOHNSON (0022) — steady ----
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at) VALUES
  ('00000000-0000-0000-0022-000000000001', '00000000-0000-0000-0002-000000000022', '00000000-0000-0000-0001-000000000002', 'weekly', true, 7.5, 7.2, 7.8, 7.6, '{}', '{}', NOW() - INTERVAL '10 days'),
  ('00000000-0000-0000-0022-000000000002', '00000000-0000-0000-0002-000000000022', '00000000-0000-0000-0001-000000000002', 'weekly', true, 7.3, 7.5, 7.6, 7.4, '{}', '{}', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- ---- AVA KIM (0023) — recovering from illness ----
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at) VALUES
  ('00000000-0000-0000-0023-000000000001', '00000000-0000-0000-0002-000000000023', '00000000-0000-0000-0001-000000000002', 'weekly', true, 7.0, 6.5, 4.2, 7.3, '{}', '{}', NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0023-000000000002', '00000000-0000-0000-0002-000000000023', '00000000-0000-0000-0001-000000000002', 'weekly', true, 7.4, 6.9, 5.8, 7.5, '{}', '{}', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- ---- PRIYA NAIR (0024) — new to team, anxious ----
INSERT INTO checkins (id, athlete_id, team_id, mode, is_private, emotional_score, resilience_score, recovery_score, support_score, question_ids, responses, completed_at) VALUES
  ('00000000-0000-0000-0024-000000000001', '00000000-0000-0000-0002-000000000024', '00000000-0000-0000-0001-000000000002', 'weekly', true, 5.8, 6.1, 6.4, 5.2, '{}', '{}', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 8. ALERTS (generated from low-scoring check-ins)
-- References fixed checkin UUIDs from section 7.
-- ============================================================

-- Marcus Davis (0011) — most recent check-in (0011-0004) has scores ~3, triggers yellow
INSERT INTO alerts (id, athlete_id, checkin_id, severity, trigger_type, status, created_at) VALUES
  ('00000000-0000-0000-0003-000000000001',
   '00000000-0000-0000-0002-000000000011',
   '00000000-0000-0000-0011-000000000004',
   'yellow', 'low_pillar_score', 'open',
   NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Tyler Brown (0012) — most recent check-in (0012-0004) triggers red
INSERT INTO alerts (id, athlete_id, checkin_id, severity, trigger_type, status, created_at) VALUES
  ('00000000-0000-0000-0003-000000000002',
   '00000000-0000-0000-0002-000000000012',
   '00000000-0000-0000-0012-000000000004',
   'red', 'support_trigger', 'open',
   NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Tyler Brown — previous alert from week 3 (0012-0003), now acknowledged
INSERT INTO alerts (id, athlete_id, checkin_id, severity, trigger_type, status, assigned_to_profile_id, created_at) VALUES
  ('00000000-0000-0000-0003-000000000003',
   '00000000-0000-0000-0002-000000000012',
   '00000000-0000-0000-0012-000000000003',
   'red', 'low_pillar_score', 'acknowledged',
   '00000000-0000-0000-0002-000000000002',
   NOW() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- Sofia Patel (0021) — most recent check-in (0021-0002) triggers yellow
INSERT INTO alerts (id, athlete_id, checkin_id, severity, trigger_type, status, created_at) VALUES
  ('00000000-0000-0000-0003-000000000004',
   '00000000-0000-0000-0002-000000000021',
   '00000000-0000-0000-0021-000000000002',
   'yellow', 'low_pillar_score', 'open',
   NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 9. FOLLOW-UPS
-- ============================================================
INSERT INTO followups (id, athlete_id, alert_id, assigned_to_profile_id, assigned_by_profile_id, reason, status, due_date, created_at)
VALUES
  -- Tyler Brown — in-progress
  ('00000000-0000-0000-0004-000000000001',
   '00000000-0000-0000-0002-000000000012',
   '00000000-0000-0000-0003-000000000003',
   '00000000-0000-0000-0002-000000000002',
   '00000000-0000-0000-0002-000000000001',
   'Athlete has shown declining scores across all four pillars for 3 consecutive weeks. Check in personally after Thursday practice and connect them with counseling.',
   'in_progress',
   (NOW() + INTERVAL '2 days')::date,
   NOW() - INTERVAL '5 days'),
  -- Marcus Davis — open
  ('00000000-0000-0000-0004-000000000002',
   '00000000-0000-0000-0002-000000000011',
   '00000000-0000-0000-0003-000000000001',
   '00000000-0000-0000-0002-000000000002',
   '00000000-0000-0000-0002-000000000001',
   'Four-week downward trend in emotional and resilience scores. Initial outreach recommended before scores deteriorate further.',
   'open',
   (NOW() + INTERVAL '4 days')::date,
   NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 10. CONSENT LOGS
-- Psychiatrist (test account) can view test athlete's full data
-- Trusted Adult (test account) can view test athlete's summary
-- ============================================================

INSERT INTO consent_logs (athlete_id, target_profile_id, target_role, scope, is_active, granted_at)
SELECT
  a.id   AS athlete_id,
  p.id   AS target_profile_id,
  'psychiatrist' AS target_role,
  'full'         AS scope,
  true,
  NOW() - INTERVAL '10 days'
FROM profiles a, profiles p
WHERE a.email = 'checkin.athlete.test@mailinator.com'
  AND p.email = 'checkin.psych.test@mailinator.com'
ON CONFLICT DO NOTHING;

INSERT INTO consent_logs (athlete_id, target_profile_id, target_role, scope, is_active, granted_at)
SELECT
  a.id   AS athlete_id,
  p.id   AS target_profile_id,
  'trusted_adult' AS target_role,
  'summary'       AS scope,
  true,
  NOW() - INTERVAL '5 days'
FROM profiles a, profiles p
WHERE a.email = 'checkin.athlete.test@mailinator.com'
  AND p.email = 'checkin.trusted.test@mailinator.com'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 11. ACCESS LOGS (psychiatrist has already viewed athlete data)
-- ============================================================
INSERT INTO access_logs (viewer_profile_id, athlete_id, access_type, accessed_at, metadata)
SELECT
  p.id,
  a.id,
  'view_full',
  NOW() - INTERVAL '3 days',
  '{"scope":"full"}'::jsonb
FROM profiles p, profiles a
WHERE p.email = 'checkin.psych.test@mailinator.com'
  AND a.email = 'checkin.athlete.test@mailinator.com'
ON CONFLICT DO NOTHING;


-- ============================================================
-- 12. RESOURCES
-- ============================================================
INSERT INTO resources (organization_id, title, description, category, url, created_by)
VALUES
  ('00000000-0000-0000-0000-000000000001', '988 Suicide & Crisis Lifeline',       'Free, confidential support 24/7. Call or text 988.',                                       'crisis',     'https://988lifeline.org/',                                             '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Crisis Text Line',                    'Text HOME to 741741 to reach a crisis counselor.',                                          'crisis',     'https://www.crisistextline.org/',                                       '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'University Counseling Center',        'Free confidential counseling for all students. Walk-ins welcome Mon–Fri 9–5.',              'counseling', 'https://example.com/counseling',                                       '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'NCAA Mental Health Resources',        'NCAA guide to mental health best practices for student-athletes.',                          'wellness',   'https://www.ncaa.org/sports/2022/3/10/mental-health-best-practices.aspx','00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Headspace for Students',              'Free meditation and mindfulness app available to enrolled students.',                       'wellness',   'https://www.headspace.com/studentplan',                                '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Academic Advising Portal',            'Schedule appointments with your academic advisor and track degree progress.',              'academic',   'https://example.com/advising',                                         '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Student Athlete Support Services',    'Dedicated academic support, tutoring, and time management coaching for athletes.',         'academic',   'https://example.com/sass',                                             '00000000-0000-0000-0002-000000000001'),
  ('00000000-0000-0000-0000-000000000001', 'Athlete Peer Mentoring Program',      'Connect with a senior athlete who has navigated the same challenges you are facing.',      'wellness',   'https://example.com/peer-mentoring',                                   '00000000-0000-0000-0002-000000000001')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 13. ATHLETE PREFERENCES
-- ============================================================
INSERT INTO athlete_preferences (athlete_id, wants_faith_support, wants_family_checkins, wants_peer_support, opt_out_reminders)
VALUES
  ('00000000-0000-0000-0002-000000000010', false, true,  false, false),
  ('00000000-0000-0000-0002-000000000012', true,  true,  true,  false),
  ('00000000-0000-0000-0002-000000000020', false, false, true,  false)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 14. INVITE CODES
-- ============================================================
INSERT INTO invite_codes (organization_id, team_id, code, role, created_by, uses_remaining)
VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000001', 'BBALL24',  'athlete', '00000000-0000-0000-0002-000000000001', NULL),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0001-000000000002', 'SOCCER24', 'athlete', '00000000-0000-0000-0002-000000000001', NULL),
  ('00000000-0000-0000-0000-000000000001', NULL,                                   'COACH24',  'coach',   '00000000-0000-0000-0002-000000000001', 10),
  ('00000000-0000-0000-0000-000000000001', NULL,                                   'ADMIN24',  'admin',   '00000000-0000-0000-0002-000000000001', 5)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 15. QUESTIONS (32 total — 8 per pillar)
--     Clears and re-inserts if fewer than 32 questions exist.
-- ============================================================
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM questions) < 32 THEN
    DELETE FROM questions;
    INSERT INTO questions (pillar, text, sub_text, low_label, high_label, modes) VALUES
      ('emotional', 'How settled do you feel inside right now?', 'Not whether everything is perfect — just whether there''s a baseline calm underneath it all.', 'Completely unsettled', 'Genuinely settled', ARRAY['weekly','screening']::checkin_mode[]),
      ('emotional', 'How much have difficult emotions been getting in the way this week?', 'Think about moments when feelings made it hard to focus, train, or connect with people.', 'Constantly getting in the way', 'Barely in the way at all', ARRAY['weekly','screening']::checkin_mode[]),
      ('emotional', 'How often did you feel genuinely okay — not just going through the motions?', 'There''s a difference between functioning and actually feeling alright. Which has it been?', 'Mostly going through motions', 'Genuinely okay most days', ARRAY['weekly','screening']::checkin_mode[]),
      ('emotional', 'How heavy has the weight of everything felt lately?', 'All the expectations, the pressure, the things you carry that others might not see.', 'Crushing weight', 'Feeling light and free', ARRAY['weekly','screening']::checkin_mode[]),
      ('emotional', 'How connected do you feel to things that usually bring you joy?', 'Hobbies, people, music, food — the stuff that normally lights you up.', 'Completely disconnected', 'Fully connected', ARRAY['weekly','screening']::checkin_mode[]),
      ('emotional', 'How much have you been able to let yourself feel things without pushing them down?', 'Not performing wellness — actually letting emotions land and move through you.', 'Blocking everything out', 'Letting it all land', ARRAY['weekly','screening']::checkin_mode[]),
      ('emotional', 'How often did you feel irritable or on edge this week for no clear reason?', 'That low-grade tension that makes small things feel bigger than they should.', 'Irritable almost constantly', 'Steady and even-keeled', ARRAY['weekly','screening']::checkin_mode[]),
      ('emotional', 'How much hope do you have about how things are going for you right now?', 'Not blind optimism — just a genuine sense that things can get better or stay good.', 'No hope at all', 'A lot of real hope', ARRAY['weekly','screening']::checkin_mode[]),
      ('resilience', 'When something went wrong this week, how well did you bounce back?', 'Think about a setback — a bad practice, a conflict, a disappointment. How did you handle it?', 'Stayed down for a long time', 'Got back up quickly', ARRAY['weekly','screening']::checkin_mode[]),
      ('resilience', 'How much did you adapt when things didn''t go as planned?', 'Flexibility under pressure — can you shift gears without it derailing you?', 'Fell apart when plans changed', 'Adapted with ease', ARRAY['weekly','screening']::checkin_mode[]),
      ('resilience', 'How confident are you in your ability to handle what''s in front of you?', 'Not arrogance — just a grounded belief that you have what it takes for this moment.', 'Not confident at all', 'Very confident', ARRAY['weekly','screening']::checkin_mode[]),
      ('resilience', 'How much did self-doubt slow you down this week?', 'The voice that says you''re not good enough, not ready, or going to fail.', 'Self-doubt was everywhere', 'Barely any self-doubt', ARRAY['weekly','screening']::checkin_mode[]),
      ('resilience', 'How well were you able to focus when it mattered most?', 'During practice, competition, or a big moment — was your mind with you or somewhere else?', 'Couldn''t focus at all', 'Locked in completely', ARRAY['weekly','screening']::checkin_mode[]),
      ('resilience', 'How much did you lean into difficulty instead of avoiding it this week?', 'The hard conversations, the tough workouts, the things you knew you needed to face.', 'Avoided everything hard', 'Leaned in fully', ARRAY['weekly','screening']::checkin_mode[]),
      ('resilience', 'How well did you manage stress without it spilling into other areas of your life?', 'Did the stress from one area — sport, school, relationships — stay contained, or did it spread?', 'Stress spilled into everything', 'Kept it well contained', ARRAY['weekly','screening']::checkin_mode[]),
      ('resilience', 'How much do you feel like yourself right now — your real self, not just who you show everyone?', 'Sometimes we perform a version of ourselves. This is asking about the real one.', 'Completely lost myself', 'Fully myself', ARRAY['weekly','screening']::checkin_mode[]),
      ('recovery', 'How well has your body been recovering between training sessions or physically demanding days?', 'Soreness, fatigue, tightness — is your body getting what it needs to restore?', 'Not recovering at all', 'Recovering really well', ARRAY['weekly','screening']::checkin_mode[]),
      ('recovery', 'How has your sleep been this week?', 'Both quality and quantity. Waking up rested, or dragging yourself out of bed every morning?', 'Terrible sleep all week', 'Sleeping great', ARRAY['weekly','screening']::checkin_mode[]),
      ('recovery', 'How well have you been eating in a way that actually fuels you?', 'Not about perfection — just whether your nutrition is supporting how you''re trying to live.', 'Barely fueling myself', 'Fueling myself well', ARRAY['weekly','screening']::checkin_mode[]),
      ('recovery', 'How much time have you had to genuinely rest — not scroll, not train, just rest?', 'Downtime that actually feels like downtime. Your nervous system off the hook.', 'No real rest at all', 'Plenty of real rest', ARRAY['weekly','screening']::checkin_mode[]),
      ('recovery', 'How is your energy throughout the day compared to your baseline?', 'Not your best-ever energy — just compared to your normal. High, low, or somewhere in between?', 'Way below my baseline', 'At or above my baseline', ARRAY['weekly','screening']::checkin_mode[]),
      ('recovery', 'How much has physical discomfort — pain, tightness, illness — been affecting your day-to-day?', 'This could be an old injury, a nagging soreness, or just feeling physically off.', 'Really affecting everything', 'Not affecting me at all', ARRAY['weekly','screening']::checkin_mode[]),
      ('recovery', 'How well have you been protecting your mental rest — time away from pressure and performance?', 'The mental load of being an athlete or student is real. Are you getting breaks from it?', 'No mental rest whatsoever', 'Protecting it really well', ARRAY['weekly','screening']::checkin_mode[]),
      ('recovery', 'How would you rate your overall sense of physical readiness heading into this coming week?', 'All things considered — body, energy, sleep — how prepared do you feel physically?', 'Running on empty', 'Feeling ready and restored', ARRAY['weekly','screening']::checkin_mode[]),
      ('support', 'How supported do you feel by the people around you right now?', 'The sense that if things got hard, someone would be in your corner.', 'Completely alone in this', 'Fully supported', ARRAY['weekly','screening']::checkin_mode[]),
      ('support', 'How easy has it felt to open up to someone you trust this week?', 'Not whether you did — just whether it felt possible or accessible.', 'Impossible to open up', 'Very easy to open up', ARRAY['weekly','screening']::checkin_mode[]),
      ('support', 'How connected do you feel to your teammates or peers right now?', 'That sense of being part of something, not just physically present but actually in it together.', 'Isolated from everyone', 'Deeply connected', ARRAY['weekly','screening']::checkin_mode[]),
      ('support', 'How much do you feel like the people around you actually understand what you''re going through?', 'Not just support in principle, but real understanding — someone who gets it.', 'Nobody understands', 'People really get it', ARRAY['weekly','screening']::checkin_mode[]),
      ('support', 'How safe do you feel being honest about how you''re really doing — not the polished version?', 'Whether it''s with a coach, teammate, friend, or family member. Is there a safe place for the truth?', 'Not safe to be honest anywhere', 'Very safe to be real', ARRAY['weekly','screening']::checkin_mode[]),
      ('support', 'How much have you felt like a burden to others when you needed something this week?', 'That feeling that asking for help is too much, that you shouldn''t need it.', 'Felt like a burden constantly', 'Didn''t feel like a burden at all', ARRAY['weekly','screening']::checkin_mode[]),
      ('support', 'How well are your relationships outside of sport or school holding up?', 'Family, close friends, people who know you as more than your role or performance.', 'Those relationships are struggling', 'Those relationships are strong', ARRAY['weekly','screening']::checkin_mode[]),
      ('support', 'If you needed real help right now — emotional, practical, or both — do you know who you''d go to?', 'Not hypothetically — is there an actual person you could call or text today?', 'No idea who I''d reach out to', 'I know exactly who to call', ARRAY['weekly','screening']::checkin_mode[]);
  END IF;
END $$;


-- ============================================================
-- DONE
-- The dashboards should now show:
--
--  Athlete (test account):
--    - 4 weeks of check-in history, improving trend
--    - Privacy page: Dr. Parker and Taylor Trusted can view data
--
--  Coach (test account):
--    - Men's Basketball with 8 athletes, 7/8 checked in this week
--    - Pillar averages: ~6.8 emotional, ~7.1 resilience, etc.
--    - Distribution across stable/moderate/elevated buckets
--
--  Admin (static account — Jamie Director):
--    - 2 teams, 13 athletes, 4 open alerts, 2 follow-ups
--
--  Psychiatrist (test account):
--    - Alex Athlete appears in their list (full consent granted)
--    - Access log shows 1 prior view
--
--  Trusted Adult (test account):
--    - Alex Athlete appears in their list (summary consent granted)
-- ============================================================
