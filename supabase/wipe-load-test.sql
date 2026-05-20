-- ============================================================
-- Wipe all load-test data
--
-- Targets every row whose ID follows the deterministic patterns
-- used by seed-load-test.sql (all 100 orgs):
--   Orgs:     aaaaaaaa-0000-0000-0000-{1..100}
--   Teams:    bbbbbbbb-{org}-0000-{team}-000000000001
--   Coaches:  cccccccc-{org}-0000-{team}-000000000001
--   Athletes: dddddddd-{org}-{team}-{ath}-000000000001
--   Admins:   eeeeeeee-0000-0000-0000-{1..100}
--
-- FK delete order (same as single-org wipe):
--   alerts → checkins → profiles → teams → organizations
-- ============================================================

BEGIN;

-- 1. Alerts — organization_id matches load-test orgs
DELETE FROM public.alerts
WHERE organization_id::text LIKE 'aaaaaaaa-0000-0000-0000-%';

-- 2. Checkins — via team_id (all load-test teams start with bbbbbbbb-)
DELETE FROM public.checkins
WHERE team_id::text LIKE 'bbbbbbbb-%';

-- 3. Profiles — covers athletes (dddddddd-), coaches (cccccccc-), admins (eeeeeeee-)
--    CASCADEs: athlete_teams, question_usage, consent_logs, access_logs, profile_meta
DELETE FROM public.profiles
WHERE id::text LIKE 'dddddddd-%'
   OR id::text LIKE 'cccccccc-%'
   OR id::text LIKE 'eeeeeeee-%';

-- 4. Teams — CASCADEs team_messages; athlete_teams already gone via profiles
DELETE FROM public.teams
WHERE id::text LIKE 'bbbbbbbb-%';

-- 5. Organizations
DELETE FROM public.organizations
WHERE id::text LIKE 'aaaaaaaa-0000-0000-0000-%';

COMMIT;

-- Verify clean
SELECT
  (SELECT count(*) FROM public.organizations WHERE id::text LIKE 'aaaaaaaa-%') AS orgs_remaining,
  (SELECT count(*) FROM public.teams         WHERE id::text LIKE 'bbbbbbbb-%') AS teams_remaining,
  (SELECT count(*) FROM public.profiles      WHERE id::text LIKE 'dddddddd-%'
                                                OR id::text LIKE 'cccccccc-%'
                                                OR id::text LIKE 'eeeeeeee-%') AS profiles_remaining,
  (SELECT count(*) FROM public.checkins      WHERE athlete_id::text LIKE 'dddddddd-%') AS checkins_remaining,
  (SELECT count(*) FROM public.alerts        WHERE organization_id::text LIKE 'aaaaaaaa-%') AS alerts_remaining;
