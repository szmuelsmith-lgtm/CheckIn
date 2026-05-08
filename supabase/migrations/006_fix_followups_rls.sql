-- Remove coaches from the followups policy.
-- Followups are clinical records managed by support staff, admins, and psychiatrists.
-- Coaches should see only aggregate wellness data, never individual clinical follow-up records.

DROP POLICY IF EXISTS "Staff manage followups" ON followups;

CREATE POLICY "Staff manage followups"
  ON followups FOR ALL
  USING (
    get_my_role() IN ('support', 'admin', 'psychiatrist')
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  )
  WITH CHECK (
    get_my_role() IN ('support', 'admin', 'psychiatrist')
    AND athlete_id IN (
      SELECT id FROM profiles WHERE organization_id = get_my_org_id()
    )
  );
