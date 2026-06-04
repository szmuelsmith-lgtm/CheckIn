-- ============================================================
-- PRUNE LOAD-TEST DATA — keep ONLY the demo org, delete the rest.
-- ============================================================
-- The production DB carries ~1.02M synthetic profiles and ~2.17M synthetic
-- check-ins across 103 load-test orgs. This shrinks every table back to the
-- single real demo org (b4c5313a…), so queries get snappy.
--
-- SAFE BY DESIGN:
--   • Batched with COMMIT between chunks → no long table locks, no statement
--     timeout, and the app stays usable while it runs.
--   • Fully RE-RUNNABLE: if it stops early (editor cutoff, etc.), just run the
--     last line `CALL public.prune_loadtest_data();` again until it finishes.
--   • Demo org fully preserved: 17 profiles, 169 check-ins, all of its alerts,
--     follow-ups, messages, consent, and audit history stay intact.
--   • Deletes cascade from profiles; a trigger auto-cleans profile_meta.
--
-- HOW TO RUN: paste this whole script into the Supabase SQL editor and Run.
-- Expect ~2–5 minutes. Watch the NOTICES for progress.
-- ============================================================

CREATE OR REPLACE PROCEDURE public.prune_loadtest_data()
LANGUAGE plpgsql AS $$
DECLARE
  keep_org uuid := 'b4c5313a-fbbd-4a95-9226-4417d24d7291';
  n     int;
  total bigint;
BEGIN
  -- 1) Check-ins for non-demo athletes (the ~2.17M-row table). Batched.
  total := 0;
  LOOP
    DELETE FROM checkins WHERE id IN (
      SELECT id FROM checkins
      WHERE athlete_id NOT IN (SELECT id FROM profiles WHERE organization_id = keep_org)
      LIMIT 50000
    );
    GET DIAGNOSTICS n = ROW_COUNT;
    total := total + n;
    COMMIT;
    EXIT WHEN n = 0;
  END LOOP;
  RAISE NOTICE 'Pruned % check-ins', total;

  -- 2) Non-demo profiles. Cascades remaining children (alerts, follow-ups,
  --    messages, consent, journals, prefs, question_usage); the sync trigger
  --    removes the matching profile_meta rows. Batched.
  total := 0;
  LOOP
    DELETE FROM profiles WHERE id IN (
      SELECT id FROM profiles WHERE organization_id <> keep_org LIMIT 10000
    );
    GET DIAGNOSTICS n = ROW_COUNT;
    total := total + n;
    COMMIT;
    EXIT WHEN n = 0;
  END LOOP;
  RAISE NOTICE 'Pruned % profiles', total;

  -- 3) Safety net: any profile_meta the trigger somehow missed.
  DELETE FROM profile_meta WHERE auth_user_id NOT IN (SELECT auth_user_id FROM profiles);
  COMMIT;

  -- 4) Non-demo teams + organizations.
  DELETE FROM teams         WHERE organization_id <> keep_org;
  DELETE FROM organizations WHERE id              <> keep_org;
  COMMIT;

  RAISE NOTICE 'Prune complete — demo org preserved.';
END $$;

CALL public.prune_loadtest_data();
DROP PROCEDURE public.prune_loadtest_data();
