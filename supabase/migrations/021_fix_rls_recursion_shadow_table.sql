-- Migration 021: Permanently fix infinite RLS recursion on profiles
--
-- Root cause:
--   The helper functions (get_my_role, get_my_profile_id, get_my_org_id,
--   get_my_team_id) are SECURITY DEFINER but query the `profiles` table.
--   In this Supabase environment the postgres role does not have BYPASSRLS,
--   so even SECURITY DEFINER + SET search_path = public still re-enters the
--   profiles RLS evaluation loop → "infinite recursion detected".
--
-- Fix:
--   Create a `profile_meta` shadow table with RLS *disabled* and access
--   revoked from all non-superuser roles.  The SECURITY DEFINER helper
--   functions query this table instead of `profiles`.  Because there is no
--   RLS on profile_meta there is no cycle to detect.
--   A trigger keeps profile_meta in sync with profiles automatically.

-- ── 1. Shadow table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profile_meta (
  auth_user_id    UUID PRIMARY KEY,
  profile_id      UUID NOT NULL,
  role            user_role NOT NULL DEFAULT 'athlete',
  organization_id UUID,
  team_id         UUID
);

-- No RLS — that is the whole point.
-- Revoke all access from regular roles so clients can never query it directly.
REVOKE ALL ON public.profile_meta FROM anon, authenticated, PUBLIC;
GRANT  ALL ON public.profile_meta TO  postgres, service_role;

-- Backfill from current profiles
INSERT INTO public.profile_meta (auth_user_id, profile_id, role, organization_id, team_id)
SELECT auth_user_id, id, role, organization_id, team_id
FROM   public.profiles
ON CONFLICT (auth_user_id) DO UPDATE
  SET profile_id      = EXCLUDED.profile_id,
      role            = EXCLUDED.role,
      organization_id = EXCLUDED.organization_id,
      team_id         = EXCLUDED.team_id;

-- ── 2. Sync trigger ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_profile_meta()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.profile_meta WHERE auth_user_id = OLD.auth_user_id;
    RETURN OLD;
  END IF;

  INSERT INTO public.profile_meta (auth_user_id, profile_id, role, organization_id, team_id)
  VALUES (NEW.auth_user_id, NEW.id, NEW.role, NEW.organization_id, NEW.team_id)
  ON CONFLICT (auth_user_id) DO UPDATE
    SET profile_id      = EXCLUDED.profile_id,
        role            = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id,
        team_id         = EXCLUDED.team_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_meta ON public.profiles;
CREATE TRIGGER trg_sync_profile_meta
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_meta();

-- ── 3. Rewrite helper functions to query profile_meta (no RLS) ───────────────

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT profile_id FROM profile_meta WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profile_meta WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM profile_meta WHERE auth_user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_my_team_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT team_id FROM profile_meta WHERE auth_user_id = auth.uid() LIMIT 1
$$;
