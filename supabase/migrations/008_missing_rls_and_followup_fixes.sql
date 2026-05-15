-- ============================================================
-- MIGRATION 008: Missing RLS policies & follow-up fixes
-- ============================================================
-- Root cause: rls-policies.sql was a one-time setup file that
-- never made it into the numbered migrations. If it failed or
-- was never run, several tables have RLS enabled but NO policies.
-- RLS enabled + no policies = every row blocked for all users.
--
-- This migration is IDEMPOTENT (safe to re-run). It uses
-- DROP POLICY IF EXISTS + CREATE to ensure correct state.
-- ============================================================

-- ── RESOURCES: ensure table exists and policies are correct ──────────────────
-- (resources table + resource_category enum live in schema.sql, not migrations)

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_category') THEN
    CREATE TYPE resource_category AS ENUM ('crisis','counseling','academic','wellness','other');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS resources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL DEFAULT 'other',
  url             TEXT NOT NULL DEFAULT '',
  created_by      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resources_org ON resources(organization_id);
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read org resources"  ON resources;
DROP POLICY IF EXISTS "Admins manage resources"      ON resources;

-- All org members (and public/global resources with org IS NULL) can read
CREATE POLICY "Members read org resources"
  ON resources FOR SELECT
  USING (
    organization_id = get_my_org_id()
    OR organization_id IS NULL
  );

-- Admins can insert/update/delete resources in their org
CREATE POLICY "Admins manage resources"
  ON resources FOR ALL
  USING (
    get_my_role() = 'admin'
    AND (
      organization_id = get_my_org_id()
      OR organization_id IS NULL
    )
  )
  WITH CHECK (
    get_my_role() = 'admin'
    AND (
      organization_id = get_my_org_id()
      OR (organization_id IS NULL AND get_my_org_id() IS NULL)
    )
  );

-- ── AUDIT LOGS: ensure INSERT policy exists ───────────────────────────────────
-- Migration 004 only set SELECT policies. INSERT needs to be open to all auth
-- users so that any role can write audit log entries.

DROP POLICY IF EXISTS "Authenticated users insert audit logs" ON audit_logs;
CREATE POLICY "Authenticated users insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- ── PROFILES: include psychiatrist/trusted_adult in org read policy ───────────
-- The original "Coaches read team profiles" only listed coach/support/admin.
-- Psychiatrists need to read org profiles for the Assign To dropdown.

DROP POLICY IF EXISTS "Coaches read team profiles" ON profiles;
DROP POLICY IF EXISTS "Staff read org profiles"    ON profiles;

CREATE POLICY "Staff read org profiles"
  ON profiles FOR SELECT
  USING (
    get_my_role() IN ('coach', 'support', 'admin', 'psychiatrist', 'trusted_adult')
    AND organization_id = get_my_org_id()
  );

-- ── ALERTS: ensure INSERT policy exists (checkin route creates alerts) ────────
DROP POLICY IF EXISTS "Authenticated users insert alerts" ON alerts;
CREATE POLICY "Authenticated users insert alerts"
  ON alerts FOR INSERT
  WITH CHECK (true);

-- ── ORGANIZATIONS: add WITH CHECK so screening toggle works ──────────────────
DROP POLICY IF EXISTS "Admins manage orgs" ON organizations;
CREATE POLICY "Admins manage orgs"
  ON organizations FOR ALL
  USING     (get_my_role() = 'admin' AND id = get_my_org_id())
  WITH CHECK(get_my_role() = 'admin' AND id = get_my_org_id());

-- ── FOLLOWUPS: extend alert_id to be optional (already in 007 but idempotent) -
ALTER TABLE followups
  ALTER COLUMN alert_id DROP NOT NULL;

-- ── ALERTS: ensure columns exist (idempotent from 007) ───────────────────────
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS team_id         UUID REFERENCES teams(id)         ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_alerts_org  ON alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_team ON alerts(team_id);
