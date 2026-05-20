-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 015 — Allow psychiatrists to manage resources
--
-- Migration 008 set "Admins manage resources" as admin-only.
-- Psychiatrists need to add/edit/delete mental health resources for athletes
-- in their organization. This replaces the policy to include staff role too.
--
-- IDEMPOTENT — safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins manage resources" ON resources;

CREATE POLICY "Staff manage resources"
  ON resources FOR ALL
  USING (
    get_my_role() IN ('admin', 'psychiatrist')
    AND (
      organization_id = get_my_org_id()
      OR organization_id IS NULL
    )
  )
  WITH CHECK (
    get_my_role() IN ('admin', 'psychiatrist')
    AND (
      organization_id = get_my_org_id()
      OR (organization_id IS NULL AND get_my_org_id() IS NULL)
    )
  );
