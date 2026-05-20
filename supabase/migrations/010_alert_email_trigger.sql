-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 010 — pg_net trigger for alert email notifications
--
-- Fires the `send-alert-email` Edge Function whenever a new row is inserted
-- into `alerts` with severity = 'red' OR trigger_type = 'wants_followup'.
--
-- Prerequisites:
--   • pg_net extension must be enabled (Dashboard → Database → Extensions → pg_net)
--   • Edge Function `send-alert-email` must be deployed
--   • Two DB-level settings must be configured (see Step 1 below)
--
-- Setup (run once in your Supabase project):
--
--   1. Set DB-level settings (replace values with your real project values):
--
--        ALTER DATABASE postgres
--          SET "app.supabase_url"    = 'https://<project-ref>.supabase.co';
--
--        ALTER DATABASE postgres
--          SET "app.webhook_secret"  = '<your-WEBHOOK_SECRET>';
--
--      The WEBHOOK_SECRET must match the value you set in:
--        supabase secrets set WEBHOOK_SECRET=<your-secret>
--
--   2. Enable pg_net extension if not already active:
--        CREATE EXTENSION IF NOT EXISTS pg_net;
--
--   3. Deploy the Edge Function:
--        supabase functions deploy send-alert-email --project-ref <project-ref>
--
--   4. Set all required secrets for the Edge Function:
--        supabase secrets set \
--          RESEND_API_KEY="re_..." \
--          WEBHOOK_SECRET="<same-secret-as-above>" \
--          APP_URL="https://app.athleteanchor.com" \
--          ALERT_FROM_EMAIL="alerts@athleteanchor.com" \
--          --project-ref <project-ref>
--
--      Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected
--      automatically by the Supabase runtime — you do NOT need to set them.
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Ensure pg_net is available
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger function
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_alert_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url     TEXT;
  _secret  TEXT;
  _payload JSONB;
BEGIN
  -- Only fire for red-severity alerts or explicit follow-up requests
  IF NEW.severity <> 'red' AND NEW.trigger_type <> 'wants_followup' THEN
    RETURN NEW;
  END IF;

  -- Read project-level settings (set via ALTER DATABASE … SET "app.*")
  BEGIN
    _url    := current_setting('app.supabase_url');
    _secret := current_setting('app.webhook_secret');
  EXCEPTION WHEN undefined_object THEN
    -- If the settings aren't configured yet, log and skip rather than hard-fail
    RAISE WARNING '[notify_alert_email] app.supabase_url or app.webhook_secret not set — skipping email trigger';
    RETURN NEW;
  END;

  -- Build the same payload shape the Edge Function expects
  _payload := jsonb_build_object(
    'type',   'INSERT',
    'table',  'alerts',
    'record', row_to_json(NEW)::jsonb
  );

  -- Fire-and-forget HTTP POST via pg_net (non-blocking)
  PERFORM net.http_post(
    url     := _url || '/functions/v1/send-alert-email',
    headers := jsonb_build_object(
      'Content-Type',   'application/json',
      'Authorization',  'Bearer ' || _secret
    ),
    body    := _payload::text
  );

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Attach trigger to alerts table
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop first so re-running this migration is idempotent
DROP TRIGGER IF EXISTS on_alert_insert ON public.alerts;

CREATE TRIGGER on_alert_insert
  AFTER INSERT ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_alert_email();

-- ─────────────────────────────────────────────────────────────────────────────
-- Grant: trigger function runs as SECURITY DEFINER (superuser-owned).
-- Revoke direct execute from public so only the trigger can call it.
-- ─────────────────────────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.notify_alert_email() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.notify_alert_email() TO service_role;
