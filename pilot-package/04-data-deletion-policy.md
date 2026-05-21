# Data Deletion Policy — Check-In by Athlete Anchor

---

## Your Right to Delete

Your institution can request full deletion of all Check-In data at any time. No reason required, no waiting period, no fees.

**How to request:** Send an email to szmuelsmith@gmail.com with the subject line: **"Data Deletion Request — [Your School Name]"**

**What happens next:**
1. We confirm receipt within 2 hours during business hours
2. We execute complete deletion within **24 hours** of your request
3. We send you a written confirmation email listing every table wiped and the timestamp of deletion

---

## What Gets Deleted

When you request deletion, we permanently remove every record tied to your institution:

- ✓ All athlete check-in responses
- ✓ All journal entries
- ✓ All athlete and coach profiles
- ✓ All wellness alerts and follow-up records
- ✓ All coach notes
- ✓ All aggregated reports or cached analytics
- ✓ Your institution's organization record

Nothing is retained. No backups with your data are kept after 24 hours of confirmation.

---

## Paste-Ready Email Template

> **Subject:** Data Deletion Request — [School Name]
>
> Hi Samuel,
>
> Please delete all Check-In data associated with [School Name]. Our pilot/agreement is ending and we want a full wipe of all records.
>
> Please confirm when complete.
>
> [Your name]

---

## Confirmation Email You Will Receive

When we finish, you'll receive an email like this:

> **Subject:** Data Deletion Complete — [School Name]
>
> Hi [Name],
>
> All Check-In data for [School Name] has been permanently deleted. This includes check-ins, journals, profiles, alerts, follow-ups, and coach notes.
>
> Deletion completed: [timestamp]
>
> If you have any questions, reply to this email.
>
> — Samuel Smith, Athlete Anchor

---

---

## SQL Deletion Script

Run this in the Supabase SQL editor (or via service role API) to wipe a full organization. Replace `'YOUR_ORG_ID'` with the actual UUID from the `organizations` table.

```sql
-- ============================================================
-- Athlete Anchor — Full Organization Data Wipe
-- Replace 'YOUR_ORG_ID' with the target organization UUID.
-- Run in Supabase SQL editor with service role access.
-- This is irreversible. Confirm org ID before executing.
-- ============================================================

DO $$
DECLARE
  v_org_id UUID := 'YOUR_ORG_ID';
  v_deleted_at TIMESTAMPTZ := NOW();
BEGIN

  -- 1. Delete coach notes
  DELETE FROM coach_notes
  WHERE athlete_id IN (
    SELECT id FROM profiles WHERE organization_id = v_org_id
  );

  -- 2. Delete follow-ups
  DELETE FROM followups
  WHERE alert_id IN (
    SELECT a.id FROM alerts a
    JOIN profiles p ON p.id = a.athlete_id
    WHERE p.organization_id = v_org_id
  );

  -- 3. Delete alerts
  DELETE FROM alerts
  WHERE athlete_id IN (
    SELECT id FROM profiles WHERE organization_id = v_org_id
  );

  -- 4. Delete journal entries
  DELETE FROM journals
  WHERE athlete_id IN (
    SELECT id FROM profiles WHERE organization_id = v_org_id
  );

  -- 5. Delete check-ins
  DELETE FROM checkins
  WHERE athlete_id IN (
    SELECT id FROM profiles WHERE organization_id = v_org_id
  );

  -- 6. Delete profiles (athletes and coaches)
  DELETE FROM profiles
  WHERE organization_id = v_org_id;

  -- 7. Log the deletion event (audit trail — do not delete this row)
  INSERT INTO audit_logs (
    actor_profile_id,
    action,
    target_type,
    target_id,
    metadata
  ) VALUES (
    NULL,
    'organization_data_wiped',
    'organization',
    v_org_id,
    jsonb_build_object(
      'deleted_at', v_deleted_at,
      'reason', 'deletion_request',
      'tables_wiped', ARRAY[
        'coach_notes','followups','alerts',
        'journals','checkins','profiles'
      ]
    )
  );

  -- 8. Delete the organization record last
  DELETE FROM organizations WHERE id = v_org_id;

  RAISE NOTICE 'Full data wipe complete for org % at %', v_org_id, v_deleted_at;

END $$;
```

> **Before running:** Confirm `v_org_id` in a SELECT first. This cannot be undone.
> ```sql
> SELECT id, name FROM organizations WHERE name ILIKE '%school name%';
> ```
