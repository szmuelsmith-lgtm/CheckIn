-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 013 — athlete_preferences RLS policy
--
-- Migration 011 enabled RLS on athlete_preferences but never added policies
-- (they lived only in rls-policies.sql which wasn't applied to the live DB).
-- With RLS on and no policies, every athlete upsert fails — including the
-- opt_out_reminders toggle in the athlete check-in settings screen.
--
-- IDEMPOTENT — safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE athlete_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Athletes manage own preferences" ON athlete_preferences;

CREATE POLICY "Athletes manage own preferences"
  ON athlete_preferences FOR ALL
  USING     (athlete_id = get_my_profile_id())
  WITH CHECK(athlete_id = get_my_profile_id());
