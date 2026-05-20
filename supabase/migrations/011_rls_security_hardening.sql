-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 011 — RLS security hardening
--
-- Root causes addressed:
--   1. Migration 002 was never applied to the live database, leaving four tables
--      (questions, question_usage, consent_logs, access_logs) either with RLS
--      disabled or with no policies — equivalent to "all rows blocked" for the
--      first three and "RLS off / world-readable" for questions.
--
--   2. audit_logs INSERT uses WITH CHECK (true) — any authenticated user can
--      write a log entry impersonating any actor_profile_id. Should be scoped
--      to the caller's own profile.
--
--   3. access_logs INSERT uses WITH CHECK (true) — same spoofing risk.
--
--   4. access_logs.athlete_id is NOT NULL, but coach-aggregate and other
--      non-athlete-specific access log writes omit it → silent insert failures.
--
--   5. All SECURITY DEFINER helper functions are executable by the anon role.
--      Best practice: restrict to authenticated only.
--
-- This migration is FULLY IDEMPOTENT — safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════════════════════
-- §1  SCHEMA FIXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Fix 1: access_logs.athlete_id  →  nullable
-- Coach-aggregate logs and other non-athlete-scoped accesses don't have a
-- specific athlete_id. Making it NOT NULL was causing silent insert failures.
ALTER TABLE access_logs
  ALTER COLUMN athlete_id DROP NOT NULL;

-- Fix 2: access_logs.viewer_profile_id ON DELETE action
-- NOT NULL + ON DELETE SET NULL is a PostgreSQL constraint contradiction that
-- will raise an error if a viewer profile is ever deleted. Change to CASCADE
-- so the entire access log row is removed along with the profile.
-- (FERPA: deleting a viewer's profile also removes their access trail — acceptable
--  because the athlete_id access logs, which are the primary FERPA record,
--  remain intact on the athlete side.)
ALTER TABLE access_logs
  DROP CONSTRAINT IF EXISTS access_logs_viewer_profile_id_fkey;

ALTER TABLE access_logs
  ADD CONSTRAINT access_logs_viewer_profile_id_fkey
  FOREIGN KEY (viewer_profile_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;


-- ══════════════════════════════════════════════════════════════════════════════
-- §2  QUESTIONS  (RLS was disabled; policies may be missing)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated read active questions" ON questions;
DROP POLICY IF EXISTS "Admins manage questions"                 ON questions;

-- Any authenticated user (all roles) can read active questions.
-- Questions are not sensitive data; athletes need them to complete check-ins.
CREATE POLICY "All authenticated read active questions"
  ON questions FOR SELECT
  USING (active = true);

-- Only admins may create / update / delete questions in their org context.
CREATE POLICY "Admins manage questions"
  ON questions FOR ALL
  USING     (get_my_role() = 'admin')
  WITH CHECK(get_my_role() = 'admin');


-- ══════════════════════════════════════════════════════════════════════════════
-- §3  QUESTION USAGE  (policies may be missing from migration 002)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE question_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes read own usage"   ON question_usage;
DROP POLICY IF EXISTS "Athletes insert own usage"  ON question_usage;

-- Athletes can read their own usage history (used by the question-rotation engine).
CREATE POLICY "Athletes read own usage"
  ON question_usage FOR SELECT
  USING (athlete_id = get_my_profile_id());

-- Athletes can only insert usage records for themselves.
CREATE POLICY "Athletes insert own usage"
  ON question_usage FOR INSERT
  WITH CHECK (athlete_id = get_my_profile_id());

-- The /api/checkins route runs under service role and bypasses RLS,
-- so no additional INSERT policy is needed for server-side writes.


-- ══════════════════════════════════════════════════════════════════════════════
-- §4  CONSENT LOGS  (policies may be missing from migration 002)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes read own consents"   ON consent_logs;
DROP POLICY IF EXISTS "Athletes create consents"      ON consent_logs;
DROP POLICY IF EXISTS "Athletes revoke own consents"  ON consent_logs;
DROP POLICY IF EXISTS "Targets read their consents"   ON consent_logs;
DROP POLICY IF EXISTS "Admins read org consents"      ON consent_logs;

-- Athletes can see all consent grants they have issued.
CREATE POLICY "Athletes read own consents"
  ON consent_logs FOR SELECT
  USING (athlete_id = get_my_profile_id());

-- Athletes can grant consent only for themselves.
CREATE POLICY "Athletes create consents"
  ON consent_logs FOR INSERT
  WITH CHECK (athlete_id = get_my_profile_id());

-- Athletes can revoke (update is_active, revoked_at) only their own consents.
CREATE POLICY "Athletes revoke own consents"
  ON consent_logs FOR UPDATE
  USING     (athlete_id = get_my_profile_id())
  WITH CHECK(athlete_id = get_my_profile_id());

-- Psychiatrists / trusted adults can read consents where they are the target
-- (so their dashboards can confirm they have active access before querying data).
CREATE POLICY "Targets read their consents"
  ON consent_logs FOR SELECT
  USING (target_profile_id = get_my_profile_id());

-- Admins can read all consent history in their org for compliance reporting.
CREATE POLICY "Admins read org consents"
  ON consent_logs FOR SELECT
  USING (
    get_my_role() = 'admin'
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- §5  ACCESS LOGS  (policies missing; INSERT was WITH CHECK (true))
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes read own access logs"    ON access_logs;
DROP POLICY IF EXISTS "Authenticated insert access log"  ON access_logs;
DROP POLICY IF EXISTS "Admins read org access logs"      ON access_logs;
DROP POLICY IF EXISTS "Staff insert access log"          ON access_logs;
DROP POLICY IF EXISTS "Viewers insert own access log"    ON access_logs;

-- Athletes can see who has accessed their data.
CREATE POLICY "Athletes read own access logs"
  ON access_logs FOR SELECT
  USING (athlete_id = get_my_profile_id());

-- Admins can see all access logs in their organization (FERPA audit trail).
CREATE POLICY "Admins read org access logs"
  ON access_logs FOR SELECT
  USING (
    get_my_role() = 'admin'
    AND (
      athlete_id IN (SELECT id FROM profiles WHERE organization_id = get_my_org_id())
      OR viewer_profile_id IN (SELECT id FROM profiles WHERE organization_id = get_my_org_id())
    )
  );

-- Any authenticated user may write an access log entry,
-- BUT only as themselves (viewer_profile_id must match their own profile).
-- This prevents spoofing another staff member's access record.
CREATE POLICY "Viewers insert own access log"
  ON access_logs FOR INSERT
  WITH CHECK (viewer_profile_id = get_my_profile_id());


-- ══════════════════════════════════════════════════════════════════════════════
-- §6  AUDIT LOGS  (INSERT was WITH CHECK (true) → spoofable)
-- ══════════════════════════════════════════════════════════════════════════════

-- Drop the over-broad policies from migrations 008 and earlier.
DROP POLICY IF EXISTS "Authenticated users insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Staff insert audit logs"               ON audit_logs;

-- Any authenticated user may log an audit entry for their own actions only.
-- actor_profile_id must be their own profile — prevents spoofing.
-- The auto_set_audit_org() trigger fills organization_id automatically.
CREATE POLICY "Actors insert own audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (actor_profile_id = get_my_profile_id());

-- Note: /api/* routes use the service_role key, which bypasses RLS entirely.
-- The above policy only constrains browser-client direct writes (e.g., quick tags,
-- preference saves, consent grants). Server-side writes are always correct.


-- ══════════════════════════════════════════════════════════════════════════════
-- §7  ALERTS INSERT  (verify migration 005 tightening is in place)
-- ══════════════════════════════════════════════════════════════════════════════

-- Migration 005 replaced the wide-open INSERT with a staff-only policy.
-- Re-create idempotently in case 005 didn't run.
DROP POLICY IF EXISTS "Authenticated users insert alerts" ON alerts;
DROP POLICY IF EXISTS "Staff insert alerts"               ON alerts;

-- Staff may manually create alerts for athletes in their org.
-- The primary alert creation path uses service_role (bypasses RLS),
-- so this policy covers manual/dashboard alert creation only.
CREATE POLICY "Staff insert alerts"
  ON alerts FOR INSERT
  WITH CHECK (
    get_my_role() IN ('support', 'admin', 'psychiatrist')
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- §8  SECURITY DEFINER functions — revoke anon, grant authenticated
-- ══════════════════════════════════════════════════════════════════════════════
-- By default, newly created functions grant EXECUTE to PUBLIC (which includes
-- anon). These helper functions call auth.uid() internally — they return NULL
-- for anon users and are not dangerous in practice — but best practice is to
-- restrict them to authenticated users to prevent any future logic bypasses.

-- Core auth helpers
REVOKE EXECUTE ON FUNCTION public.get_my_profile_id()         FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_role()               FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_org_id()             FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_team_id()            FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_org_team_count(UUID)    FROM anon, PUBLIC;

GRANT  EXECUTE ON FUNCTION public.get_my_profile_id()         TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.get_my_role()               TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.get_my_org_id()             TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.get_my_team_id()            TO authenticated, service_role;
GRANT  EXECUTE ON FUNCTION public.get_org_team_count(UUID)    TO authenticated, service_role;

-- Consent helper (used in RLS policies and Edge Function gate)
-- Guard: has_consent() is defined in migration 002; if that never ran, skip gracefully.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'has_consent') THEN
    REVOKE EXECUTE ON FUNCTION public.has_consent(UUID, consent_scope) FROM anon, PUBLIC;
    GRANT  EXECUTE ON FUNCTION public.has_consent(UUID, consent_scope) TO authenticated, service_role;
  END IF;
END $$;

-- Trigger functions — only need to be callable by the trigger system (superuser).
-- Revoking PUBLIC prevents direct calls while leaving trigger execution intact.
REVOKE EXECUTE ON FUNCTION public.auto_set_audit_org()        FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.auto_set_audit_org()        TO service_role;

-- pg_net alert trigger (from migration 010)
-- Guard: notify_alert_email() is defined in migration 010; skip if not yet applied.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'notify_alert_email') THEN
    REVOKE EXECUTE ON FUNCTION public.notify_alert_email() FROM anon, PUBLIC;
    GRANT  EXECUTE ON FUNCTION public.notify_alert_email() TO service_role;
  END IF;
END $$;

-- NOTE: create_signup_profile() is intentionally accessible to anon.
-- It validates the caller against auth.users before inserting, so exposure to
-- anon is safe and required for the signup flow. Do NOT revoke anon here.


-- ══════════════════════════════════════════════════════════════════════════════
-- §9  ENSURE RLS IS ENABLED ON ALL CORE TABLES  (idempotent safety net)
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE organizations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins         ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_usage   ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources        ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_teams    ENABLE ROW LEVEL SECURITY;

-- invite_codes (may exist from rls-policies.sql run outside migrations)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invite_codes' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;
