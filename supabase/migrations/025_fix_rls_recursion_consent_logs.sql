-- Migration 025: Fix infinite recursion in consent_logs / profiles RLS
--
-- CHAIN THAT CAUSES ERROR 42P17:
--   SELECT from profiles
--   → "Psychiatrists read consented athlete profiles" policy
--     → subquery on consent_logs
--       → "Admins read org consents" policy on consent_logs
--         → subquery on profiles (WHERE organization_id = ...)
--           → evaluates profiles policies again → INFINITE RECURSION
--
-- FIX: replace the direct `SELECT profiles.id FROM profiles WHERE ...` inside
-- consent_logs policies with a SECURITY DEFINER helper function that queries
-- profiles bypassing RLS (same pattern as get_my_role / get_my_org_id).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Helper: returns all profile IDs for an org, bypassing RLS via SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_org_profile_ids(p_org_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE organization_id = p_org_id;
$$;

REVOKE ALL ON FUNCTION public.get_org_profile_ids(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_org_profile_ids(uuid) TO authenticated;

-- 2. Re-create all consent_logs policies that referenced profiles directly

-- Drop the recursive one
DROP POLICY IF EXISTS "Admins read org consents" ON public.consent_logs;

-- Recreate using the new helper (no direct profiles subquery)
CREATE POLICY "Admins read org consents" ON public.consent_logs
  FOR SELECT USING (
    get_my_role() = 'admin'::user_role
    AND athlete_id = ANY(
      SELECT get_org_profile_ids(get_my_org_id())
    )
  );

-- 3. Fix the alerts policies that also chain through profiles

DROP POLICY IF EXISTS "Support and admin read alerts"  ON public.alerts;
DROP POLICY IF EXISTS "Support and admin update alerts" ON public.alerts;
DROP POLICY IF EXISTS "Admins read org access logs"    ON public.access_logs;
DROP POLICY IF EXISTS "Staff manage followups"         ON public.followups;

CREATE POLICY "Support and admin read alerts" ON public.alerts
  FOR SELECT USING (
    get_my_role() = ANY (ARRAY['support'::user_role, 'admin'::user_role])
    AND (
      organization_id = get_my_org_id()
      OR athlete_id = ANY(SELECT get_org_profile_ids(get_my_org_id()))
    )
  );

CREATE POLICY "Support and admin update alerts" ON public.alerts
  FOR UPDATE USING (
    get_my_role() = ANY (ARRAY['support'::user_role, 'admin'::user_role])
    AND (
      organization_id = get_my_org_id()
      OR athlete_id = ANY(SELECT get_org_profile_ids(get_my_org_id()))
    )
  );

CREATE POLICY "Admins read org access logs" ON public.access_logs
  FOR SELECT USING (
    get_my_role() = 'admin'::user_role
    AND (
      athlete_id    = ANY(SELECT get_org_profile_ids(get_my_org_id()))
      OR viewer_profile_id = ANY(SELECT get_org_profile_ids(get_my_org_id()))
    )
  );

CREATE POLICY "Staff manage followups" ON public.followups
  FOR ALL USING (
    get_my_role() = ANY (ARRAY['support'::user_role, 'admin'::user_role, 'psychiatrist'::user_role, 'trusted_adult'::user_role])
    AND athlete_id = ANY(SELECT get_org_profile_ids(get_my_org_id()))
  );

-- 4. Fix team_messages policies that query profiles directly (not via helper)
DROP POLICY IF EXISTS "Coach manages their team messages" ON public.team_messages;
DROP POLICY IF EXISTS "Athlete reads their team messages" ON public.team_messages;

CREATE POLICY "Coach manages their team messages" ON public.team_messages
  FOR ALL USING (
    get_my_role() = 'coach'::user_role
    AND team_id = get_my_team_id()
  );

CREATE POLICY "Athlete reads their team messages" ON public.team_messages
  FOR SELECT USING (
    get_my_role() = 'athlete'::user_role
    AND team_id = get_my_team_id()
    AND expires_at > now()
  );
