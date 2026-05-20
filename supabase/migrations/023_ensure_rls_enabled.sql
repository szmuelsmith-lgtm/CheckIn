-- Migration 023: Ensure RLS is enabled on every application table
--
-- Migration 011 declared ENABLE ROW LEVEL SECURITY for all tables, but the
-- live database shows profiles (and possibly others) with RLS still off —
-- likely from a partially-rolled-back transaction during the recursion-fix
-- debugging sessions.
--
-- ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent: running it on a
-- table that already has RLS enabled is a safe no-op.
--
-- profile_meta is intentionally excluded — it has no RLS by design (that is
-- the entire point of the shadow-table pattern from migration 021).

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_usage    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_teams     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes      ENABLE ROW LEVEL SECURITY;

-- Verify — this SELECT should return zero rows after running.
-- If any table appears here, it still has RLS off.
SELECT relname AS "table_missing_rls"
FROM   pg_class c
JOIN   pg_namespace n ON n.oid = c.relnamespace
WHERE  n.nspname  = 'public'
AND    c.relkind  = 'r'
AND    c.relrowsecurity = false
AND    c.relname NOT IN ('profile_meta')  -- intentionally exempt
ORDER  BY relname;
