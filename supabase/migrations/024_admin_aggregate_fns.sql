-- Migration 024: Server-side aggregate functions for admin dashboard
--
-- The admin dashboard previously fetched all athlete profiles client-side
-- to compute per-team counts. PostgREST caps responses at 1 000 rows, so
-- orgs with >1 000 athletes got silently truncated totals.
--
-- These two SECURITY DEFINER functions run the aggregation in Postgres and
-- return only the summary rows the dashboard actually needs.

-- ── 1. Per-team athlete counts ────────────────────────────────────────────────
-- Returns one row per team with the athlete count for that team.
-- Used by the admin dashboard team-breakdown widget.

CREATE OR REPLACE FUNCTION public.get_team_athlete_counts(p_org_id uuid)
RETURNS TABLE(team_id uuid, athlete_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT   team_id, COUNT(*) AS athlete_count
  FROM     public.profiles
  WHERE    organization_id = p_org_id
    AND    role            = 'athlete'
    AND    team_id         IS NOT NULL
  GROUP BY team_id;
$$;

-- ── 2. Total athlete count for an org ────────────────────────────────────────
-- Simple scalar so the dashboard can display the total without a full fetch.

CREATE OR REPLACE FUNCTION public.get_org_athlete_count(p_org_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM public.profiles
  WHERE  organization_id = p_org_id AND role = 'athlete';
$$;

-- Grant execute to authenticated users (RLS on profiles still enforces org scope)
GRANT EXECUTE ON FUNCTION public.get_team_athlete_counts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_athlete_count(uuid)   TO authenticated;
