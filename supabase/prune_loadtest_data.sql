-- ============================================================
-- PRUNE LOAD-TEST DATA — keep ONLY the demo org. (v2, no COMMIT)
-- ============================================================
-- The Supabase SQL editor runs a script inside one transaction, so a
-- procedure with COMMIT fails ("invalid transaction termination"). This
-- version is plain sequential DELETEs — no procedure, no COMMIT.
--
-- Speed trick: we temporarily disable the profile_meta sync trigger so the
-- 1M-row profile delete doesn't fire it a million times, then clean
-- profile_meta directly and re-enable the trigger.
--
-- Demo org (b4c5313a…) is fully preserved: 17 profiles, 169 check-ins, and
-- all of its alerts, follow-ups, messages, consent, and audit history.
--
-- HOW TO RUN: paste the whole thing into the Supabase SQL editor and Run.
-- Expect ~1–3 minutes. If the editor reports a timeout, see the BATCHED
-- FALLBACK at the bottom.
-- ============================================================

SET statement_timeout = 0;

-- Keep the demo org from firing the per-row profile_meta trigger during the bulk delete.
ALTER TABLE profiles DISABLE TRIGGER trg_sync_profile_meta;

-- 1) Check-ins belonging to non-demo athletes (the ~2.17M-row table).
DELETE FROM checkins
WHERE athlete_id NOT IN (
  SELECT id FROM profiles WHERE organization_id = 'b4c5313a-fbbd-4a95-9226-4417d24d7291'
);

-- 2) Non-demo profiles. Cascades remaining children (alerts, follow-ups,
--    messages, consent, journals, prefs, question_usage).
DELETE FROM profiles
WHERE organization_id <> 'b4c5313a-fbbd-4a95-9226-4417d24d7291';

-- 3) Clean profile_meta directly (trigger is off).
DELETE FROM profile_meta
WHERE auth_user_id NOT IN (SELECT auth_user_id FROM profiles);

-- 4) Non-demo teams + organizations.
DELETE FROM teams         WHERE organization_id <> 'b4c5313a-fbbd-4a95-9226-4417d24d7291';
DELETE FROM organizations WHERE id              <> 'b4c5313a-fbbd-4a95-9226-4417d24d7291';

-- Restore the trigger.
ALTER TABLE profiles ENABLE TRIGGER trg_sync_profile_meta;


-- ============================================================
-- BATCHED FALLBACK — only if the script above times out.
-- Run statement A repeatedly until it reports "0 rows", then B repeatedly
-- until "0 rows", then run C and D once. Each run is its own fast transaction.
-- (Leave the trigger DISABLED from step above until after B + C + D, then
--  run the ENABLE TRIGGER line.)
-- ============================================================
--
-- A) DELETE FROM checkins WHERE ctid IN (
--      SELECT ctid FROM checkins
--      WHERE athlete_id NOT IN (SELECT id FROM profiles WHERE organization_id = 'b4c5313a-fbbd-4a95-9226-4417d24d7291')
--      LIMIT 300000);
--
-- B) DELETE FROM profiles WHERE ctid IN (
--      SELECT ctid FROM profiles
--      WHERE organization_id <> 'b4c5313a-fbbd-4a95-9226-4417d24d7291'
--      LIMIT 100000);
--
-- C) DELETE FROM profile_meta WHERE auth_user_id NOT IN (SELECT auth_user_id FROM profiles);
--    DELETE FROM teams WHERE organization_id <> 'b4c5313a-fbbd-4a95-9226-4417d24d7291';
--    DELETE FROM organizations WHERE id <> 'b4c5313a-fbbd-4a95-9226-4417d24d7291';
--
-- D) ALTER TABLE profiles ENABLE TRIGGER trg_sync_profile_meta;
