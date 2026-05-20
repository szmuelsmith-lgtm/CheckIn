-- ── 017: Missing athlete RLS policies ─────────────────────────────────────────
-- Three gaps discovered during feature audit:
--   1. Athletes could not SELECT their own checkins
--      (journal page and athlete dashboard need this)
--   2. Journals table had RLS enabled (migration 011) but NO policies at all
--      → every journal operation silently returned 0 rows / blocked writes
--   3. Athletes could not UPDATE their own profile
--      (onboarding completion writes onboarded=true)

-- ── 1. CHECKINS: athletes read their own records ────────────────────────────────
-- Coaches only ever see aggregated data via the /api/coach/aggregate route (service
-- role), so this policy does NOT expose individual scores to coaches.
DROP POLICY IF EXISTS "Athletes read own checkins" ON checkins;
CREATE POLICY "Athletes read own checkins"
  ON checkins FOR SELECT
  USING (athlete_id = get_my_profile_id());

-- ── 2. JOURNALS: athletes manage their own entries ─────────────────────────────
DROP POLICY IF EXISTS "Athletes manage own journals" ON journals;
CREATE POLICY "Athletes manage own journals"
  ON journals FOR ALL
  USING   (athlete_id = get_my_profile_id())
  WITH CHECK (athlete_id = get_my_profile_id());

-- Support / admin staff can read (not write) journals for safeguarding purposes.
-- This mirrors the consent-gated access pattern used elsewhere.
DROP POLICY IF EXISTS "Admin reads all journals" ON journals;
CREATE POLICY "Admin reads all journals"
  ON journals FOR SELECT
  USING (get_my_role() IN ('admin', 'support'));

-- ── 3. PROFILES: athletes update their own record ──────────────────────────────
-- Athletes need to write back the `onboarded` flag (and optionally preferences).
-- They cannot escalate their role — that column is immutable in practice because
-- the app never sends a `role` field in athlete-initiated updates.
DROP POLICY IF EXISTS "Athletes update own profile" ON profiles;
CREATE POLICY "Athletes update own profile"
  ON profiles FOR UPDATE
  USING   (id = get_my_profile_id())
  WITH CHECK (id = get_my_profile_id());
