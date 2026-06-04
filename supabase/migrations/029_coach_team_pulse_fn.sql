-- ============================================================
-- MIGRATION 029: Coach Team Pulse — set-based SQL aggregation
-- ============================================================
-- Replaces the app-side aggregation that pulled every athlete's
-- check-ins into the Node function and filtered with .in([all ids]).
-- That pattern breaks past ~1,000 athletes in one org (query URL
-- length + the 1,000-row cap corrupting the average). This function
-- does the whole thing in Postgres: dedup to the latest check-in per
-- athlete per ISO week, average per pillar, and apply k-anonymity.
--
-- Security:
--   • SECURITY DEFINER, but EXECUTE granted ONLY to service_role.
--     End users cannot call it directly; the /api/coach/team-pulse
--     route (which verifies the caller is a coach of this team) is the
--     sole gatekeeper, exactly as before.
--   • Returns only aggregated weekly buckets — never athlete_id, never
--     an individual row. k-anonymity: pillar averages are NULL unless
--     ≥5 distinct athletes checked in that week.
-- ============================================================

create or replace function public.coach_team_pulse(p_team_id uuid, p_weeks int default 8)
returns table (
  week_key       date,
  emotional      numeric,
  resilience     numeric,
  recovery       numeric,
  support        numeric,
  checkin_count  bigint,
  total_athletes bigint
)
language sql
security definer
set search_path = public
as $$
  with team_athletes as (
    select id from profiles
    where team_id = p_team_id and role = 'athlete'
  ),
  -- One row per athlete per week: their LATEST check-in that week.
  latest as (
    select distinct on (c.athlete_id, date_trunc('week', c.completed_at))
      c.athlete_id,
      date_trunc('week', c.completed_at)::date as wk,
      c.emotional_score, c.resilience_score, c.recovery_score, c.support_score
    from checkins c
    join team_athletes t on t.id = c.athlete_id
    where c.mode = 'weekly'
      and c.completed_at >= now() - make_interval(weeks => p_weeks)
    order by c.athlete_id, date_trunc('week', c.completed_at), c.completed_at desc
  ),
  agg as (
    select
      wk,
      count(distinct athlete_id) as n,
      avg(emotional_score)  as e,
      avg(resilience_score) as r,
      avg(recovery_score)   as rc,
      avg(support_score)    as s
    from latest
    group by wk
  )
  select
    wk as week_key,
    case when n >= 5 then round(e,  1) end as emotional,
    case when n >= 5 then round(r,  1) end as resilience,
    case when n >= 5 then round(rc, 1) end as recovery,
    case when n >= 5 then round(s,  1) end as support,
    n as checkin_count,
    (select count(*) from team_athletes) as total_athletes
  from agg
  order by wk;
$$;

-- Lock it down: only the server (service_role) may execute it.
revoke all on function public.coach_team_pulse(uuid, int) from public, anon, authenticated;
grant execute on function public.coach_team_pulse(uuid, int) to service_role;
