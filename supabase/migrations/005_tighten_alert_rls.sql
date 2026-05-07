-- ============================================================
-- MIGRATION 005: Tighten alert INSERT policy
-- ============================================================
-- Alerts are now created server-side via the service role key,
-- so the wide-open "authenticated users insert alerts" policy
-- is no longer needed. Remove it to prevent athletes from
-- injecting alerts via the browser Supabase client.
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users insert alerts" ON alerts;

-- Service role bypasses RLS entirely, so no new INSERT policy is needed.
-- Staff (support/admin) may also create alerts manually via the dashboard.
CREATE POLICY "Staff insert alerts"
  ON alerts FOR INSERT
  WITH CHECK (
    get_my_role() IN ('support', 'admin', 'psychiatrist')
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  );
