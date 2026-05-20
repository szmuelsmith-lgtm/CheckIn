/**
 * send-alert-email
 *
 * Supabase Edge Function — called by a pg_net database trigger every time
 * a new row is inserted into the `alerts` table.
 *
 * Fires for:
 *   • severity = 'red'         (risk score below threshold)
 *   • trigger_type = 'wants_followup'  (athlete explicitly requested contact)
 *
 * Sends a formatted HTML email to every admin, support, and psychiatrist
 * in the same organization via Resend (https://resend.com).
 *
 * Required env vars (set in Supabase Dashboard > Edge Functions > Secrets):
 *   RESEND_API_KEY        — your Resend API key  (re_...)
 *   WEBHOOK_SECRET        — arbitrary secret shared with the pg_net trigger
 *   APP_URL               — your public app URL  (e.g. https://app.athleteanchor.com)
 *   ALERT_FROM_EMAIL      — verified sender address (e.g. alerts@athleteanchor.com)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ─── env ─────────────────────────────────────────────────────────────────────
const RESEND_API_KEY       = Deno.env.get('RESEND_API_KEY')      ?? ''
const WEBHOOK_SECRET       = Deno.env.get('WEBHOOK_SECRET')      ?? ''
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')        ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const APP_URL              = Deno.env.get('APP_URL')             ?? 'https://app.athleteanchor.com'
const FROM_EMAIL           = Deno.env.get('ALERT_FROM_EMAIL')    ?? 'alerts@athleteanchor.com'

// ─── types ────────────────────────────────────────────────────────────────────
interface AlertRecord {
  id:                     string
  athlete_id:             string
  checkin_id:             string | null
  organization_id:        string | null
  severity:               'yellow' | 'red'
  trigger_type:           string
  status:                 string
  assigned_to_profile_id: string | null
  created_at:             string
}

interface WebhookPayload {
  type:   'INSERT' | 'UPDATE' | 'DELETE'
  table:  string
  record: AlertRecord
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function scoreColor(val: number | null): string {
  if (val === null) return '#6b7280'
  if (val <= 3)     return '#dc2626'
  if (val <= 5)     return '#d97706'
  return '#16a34a'
}

function buildHtml(opts: {
  athleteName:       string
  teamName:          string
  isFollowup:        boolean
  scores:            Record<string, number | null>
  alertId:           string
  createdAt:         string
  appUrl:            string
}): string {
  const { athleteName, teamName, isFollowup, scores, alertId, createdAt, appUrl } = opts

  const subject = isFollowup
    ? `✋ ${athleteName} requested counselor contact`
    : `🚨 High-risk alert: ${athleteName}`

  const headerBg = isFollowup
    ? 'linear-gradient(135deg,#92400e,#d97706)'
    : 'linear-gradient(135deg,#991b1b,#dc2626)'

  const headerLabel = isFollowup ? 'Athlete outreach request' : 'High-risk wellness alert'

  const bodyText = isFollowup
    ? `<strong>${athleteName}</strong> from <strong>${teamName}</strong> checked a box in their check-in indicating they would like to speak with a counselor or support staff.`
    : `A check-in from <strong>${athleteName}</strong> on <strong>${teamName}</strong> triggered a <strong style="color:#dc2626">high-risk alert</strong> based on their wellness scores.`

  const scoreRows = Object.entries({
    Emotional:  scores.emotional_score,
    Resilience: scores.resilience_score,
    Recovery:   scores.recovery_score,
    Support:    scores.support_score,
  })
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([label, val]) =>
      `<tr>
         <td style="padding:5px 10px;color:#6b7280;font-size:13px">${label}</td>
         <td style="padding:5px 10px;font-weight:700;font-size:13px;color:${scoreColor(val as number)}">${val}/10</td>
       </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;max-width:520px">

  <!-- Header -->
  <tr>
    <td style="background:${headerBg};padding:28px 32px">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.65)">${headerLabel}</p>
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3">${subject}</h1>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:28px 32px">
      <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6">${bodyText}</p>

      ${scoreRows ? `
      <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;width:100%;margin:0 0 24px;border:1px solid #e5e7eb">
        <tr>
          <td colspan="2" style="padding:12px 10px 6px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280">
            Check-In Scores
          </td>
        </tr>
        ${scoreRows}
      </table>` : ''}

      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px">
        <tr>
          <td style="border-radius:10px;background:linear-gradient(135deg,#1e3a5f,#2563eb)">
            <a href="${appUrl}/admin/alerts"
               style="display:block;padding:13px 26px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700">
              Open Alert Queue →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6">
        Alert ID: <span style="font-family:monospace">${alertId}</span><br>
        Time: ${new Date(createdAt).toLocaleString('en-US', { dateStyle:'medium', timeStyle:'short' })}<br>
        This notification was sent to all admin and support staff in your organization.
      </p>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:11px;color:#9ca3af">
        Check-In &middot; Athlete Wellness Platform &middot; All access is logged for FERPA compliance.
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── main ─────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // 1. Authenticate the request — only the pg_net trigger should call this
  const auth = req.headers.get('Authorization') ?? ''
  if (!WEBHOOK_SECRET || auth !== `Bearer ${WEBHOOK_SECRET}`) {
    console.error('[send-alert-email] Unauthorized request — check WEBHOOK_SECRET')
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. Parse payload
  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { record } = payload

  // 3. Gate — only fire for red alerts or explicit followup requests
  const isFollowup = record.trigger_type === 'wants_followup'
  if (record.severity !== 'red' && !isFollowup) {
    console.log(`[send-alert-email] Skipping ${record.severity}/${record.trigger_type} alert`)
    return new Response(JSON.stringify({ skipped: true }), { status: 200 })
  }

  if (!RESEND_API_KEY) {
    console.error('[send-alert-email] RESEND_API_KEY not set — cannot send emails')
    return new Response('RESEND_API_KEY missing', { status: 500 })
  }

  // 4. Build a service-role Supabase client (bypasses RLS)
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // 5. Fetch athlete name + team
  const { data: athlete } = await supabase
    .from('profiles')
    .select('full_name, team_id')
    .eq('id', record.athlete_id)
    .single()

  const athleteName = athlete?.full_name ?? 'An athlete'

  let teamName = 'Unknown Team'
  if (athlete?.team_id) {
    const { data: team } = await supabase
      .from('teams')
      .select('name')
      .eq('id', athlete.team_id)
      .single()
    if (team) teamName = team.name
  }

  // 6. Fetch check-in scores (if linked)
  let scores: Record<string, number | null> = {
    emotional_score: null, resilience_score: null,
    recovery_score:  null, support_score:    null,
  }
  if (record.checkin_id) {
    const { data: checkin } = await supabase
      .from('checkins')
      .select('emotional_score,resilience_score,recovery_score,support_score')
      .eq('id', record.checkin_id)
      .single()
    if (checkin) scores = checkin
  }

  // 7. Fetch staff emails in the org (admin + support + psychiatrist)
  let staffQuery = supabase
    .from('profiles')
    .select('email, full_name')
    .in('role', ['admin', 'support', 'psychiatrist'])
    .not('email', 'is', null)

  if (record.organization_id) {
    staffQuery = staffQuery.eq('organization_id', record.organization_id)
  }

  const { data: staff, error: staffErr } = await staffQuery
  if (staffErr) {
    console.error('[send-alert-email] Failed to load staff:', staffErr.message)
    return new Response('Failed to load staff', { status: 500 })
  }

  if (!staff || staff.length === 0) {
    console.warn('[send-alert-email] No staff found in org — no emails sent')
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
  }

  // 8. Build email HTML once, send to each staff member
  const subject = isFollowup
    ? `✋ ${athleteName} requested counselor contact`
    : `🚨 High-risk alert: ${athleteName}`

  const html = buildHtml({ athleteName, teamName, isFollowup, scores, alertId: record.id, createdAt: record.created_at, appUrl: APP_URL })

  const results = await Promise.allSettled(
    staff.map(({ email }: { email: string }) =>
      fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    `Check-In Alerts <${FROM_EMAIL}>`,
          to:      [email],
          subject,
          html,
        }),
      }).then(async (r) => {
        if (!r.ok) {
          const body = await r.text()
          throw new Error(`Resend ${r.status}: ${body}`)
        }
        return r.json()
      })
    )
  )

  const sent   = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected')
  if (failed.length > 0) {
    failed.forEach(f => console.error('[send-alert-email] Resend error:', (f as PromiseRejectedResult).reason))
  }

  console.log(`[send-alert-email] Sent ${sent}/${staff.length} emails for alert ${record.id}`)
  return new Response(JSON.stringify({ sent, total: staff.length }), {
    status:  200,
    headers: { 'Content-Type': 'application/json' },
  })
})
