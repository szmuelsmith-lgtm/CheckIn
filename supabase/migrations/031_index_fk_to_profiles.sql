-- ============================================================
-- 031: Index foreign-key columns that reference profiles(id)
--
-- WHY: Deleting (or merging) a profile forces Postgres to verify every FK that
-- points at profiles(id). Any such column without its own index is checked with
-- a sequential scan of the referencing table. With ~1M rows in `profiles`, the
-- self-referential `linked_athlete_id` FK alone made a single profile delete
-- seq-scan a million rows and hit the statement timeout. These indexes make
-- profile deletes / cascade checks O(log n) instead of O(n).
--
-- Already indexed (no action needed): every athlete_id column (checkins, alerts,
-- journals, followups, consent_logs, question_usage, access_logs, athlete_teams),
-- athlete_preferences.athlete_id (UNIQUE), audit_logs.actor_profile_id,
-- followups.assigned_to_profile_id, consent_logs.target_profile_id.
--
-- Safe to re-run (IF NOT EXISTS). Run in the Supabase SQL editor for project
-- doeycpheigjihvfvupid, or via your normal migration path.
-- ============================================================

-- The critical one: self-referential FK on the 1M-row profiles table.
CREATE INDEX IF NOT EXISTS idx_profiles_linked_athlete
  ON profiles(linked_athlete_id)
  WHERE linked_athlete_id IS NOT NULL;

-- Remaining unindexed FK-to-profiles columns (small tables, but cheap insurance).
CREATE INDEX IF NOT EXISTS idx_followups_assigned_by
  ON followups(assigned_by_profile_id);

CREATE INDEX IF NOT EXISTS idx_resources_created_by
  ON resources(created_by);

CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by
  ON invite_codes(created_by);

CREATE INDEX IF NOT EXISTS idx_access_logs_viewer
  ON access_logs(viewer_profile_id);
