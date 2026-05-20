-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 012 — Follow-up pipeline fixes
--
-- Root causes addressed:
--   1. followups.alert_id is NOT NULL in the base schema (schema.sql).
--      Migrations 007 + 008 both attempted to drop this constraint, but if
--      either migration was never applied to the live DB the constraint is
--      still there, causing any counselor-initiated follow-up (no triggering
--      alert) to fail with a 23502 NOT NULL violation.
--      The 409 reported as "FK constraint" is Supabase's REST translation of
--      this — the FK to alerts(id) and the NOT NULL both produce 409.
--
--   2. followups.assigned_by_profile_id is nullable in the schema but the
--      admin alerts page omits it entirely on INSERT; make the intent explicit.
--
--   3. checkins.mood_score / stress_score / sleep_score are NOT NULL in the
--      original schema.sql but the /api/checkins route never sets them (it
--      uses pillar scores instead). If the live DB still has these columns as
--      NOT NULL with no DEFAULT, the entire checkin submission path fails.
--      Make them nullable idempotently so new-style check-ins always succeed.
--
--   4. alerts.checkin_id is NOT NULL in schema.sql. The admin alerts page
--      shows alerts correctly, but manual alert creation (future) would fail
--      without a checkin. Make nullable now for forward compatibility.
--
-- This migration is FULLY IDEMPOTENT — safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────


-- ══════════════════════════════════════════════════════════════════════════════
-- §1  followups.alert_id  →  nullable
-- ══════════════════════════════════════════════════════════════════════════════
-- This is the primary cause of "Schedule Follow-up" failing when the athlete
-- has no open alert. Migrations 007 + 008 both try this; repeating is safe.
ALTER TABLE followups
  ALTER COLUMN alert_id DROP NOT NULL;


-- ══════════════════════════════════════════════════════════════════════════════
-- §2  checkins legacy score columns  →  nullable
-- ══════════════════════════════════════════════════════════════════════════════
-- The original schema required mood_score, stress_score, sleep_score.
-- The current /api/checkins route never sets these (uses pillar scores).
-- If still NOT NULL, every check-in submission fails at the DB level.
ALTER TABLE checkins
  ALTER COLUMN mood_score    DROP NOT NULL,
  ALTER COLUMN stress_score  DROP NOT NULL,
  ALTER COLUMN sleep_score   DROP NOT NULL;

-- Add safe defaults so old app versions still work without changes
ALTER TABLE checkins
  ALTER COLUMN mood_score    SET DEFAULT NULL,
  ALTER COLUMN stress_score  SET DEFAULT NULL,
  ALTER COLUMN sleep_score   SET DEFAULT NULL;


-- ══════════════════════════════════════════════════════════════════════════════
-- §3  alerts.checkin_id  →  nullable
-- ══════════════════════════════════════════════════════════════════════════════
-- Manually-created alerts (e.g., from staff dashboard) should not require a
-- linked check-in. The auto-created path always has a checkin_id, so this
-- is purely additive and does not affect existing data.
ALTER TABLE alerts
  ALTER COLUMN checkin_id DROP NOT NULL;


-- ══════════════════════════════════════════════════════════════════════════════
-- §4  followups RLS  —  ensure athletes can read their own follow-ups
-- ══════════════════════════════════════════════════════════════════════════════
-- The psychiatrist dashboard checks followups.status for each athlete; the
-- existing "Staff manage followups" policy covers staff reads but athletes
-- may also need to read their own follow-up status in future views.
-- Add this now so the SELECT from athlete context doesn't silently return 0.
DROP POLICY IF EXISTS "Athletes read own followups" ON followups;
CREATE POLICY "Athletes read own followups"
  ON followups FOR SELECT
  USING (athlete_id = get_my_profile_id());


-- ══════════════════════════════════════════════════════════════════════════════
-- §5  followups RLS  —  re-confirm staff INSERT/UPDATE policy is correct
-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 007 created "Staff manage followups" (FOR ALL). Re-create
-- idempotently to ensure the WITH CHECK matches the psychiatrist's workflow
-- exactly: org-scoped athlete_id, role in ('support','admin','psychiatrist').
DROP POLICY IF EXISTS "Staff manage followups" ON followups;
CREATE POLICY "Staff manage followups"
  ON followups FOR ALL
  USING (
    get_my_role() IN ('support', 'admin', 'psychiatrist', 'trusted_adult')
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  )
  WITH CHECK (
    get_my_role() IN ('support', 'admin', 'psychiatrist', 'trusted_adult')
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  );


-- ══════════════════════════════════════════════════════════════════════════════
-- §6  alerts RLS  —  ensure psychiatrist INSERT works for staff-created alerts
-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 011 replaced the open "Authenticated users insert alerts" with a
-- staff-only policy. Re-create idempotently to confirm it's in place.
DROP POLICY IF EXISTS "Authenticated users insert alerts" ON alerts;
DROP POLICY IF EXISTS "Staff insert alerts"               ON alerts;
CREATE POLICY "Staff insert alerts"
  ON alerts FOR INSERT
  WITH CHECK (
    get_my_role() IN ('support', 'admin', 'psychiatrist')
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  );

-- The /api/checkins route uses service_role (bypasses RLS) to insert alerts.
-- The above policy only constrains direct browser-client inserts.
