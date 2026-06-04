import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { sendEscalationEmail } from "@/lib/email";

// POST /api/sweeps/sla
// Last-mile guarantee: a red alert that sits unacknowledged is a broken promise
// for a product whose whole purpose is "help comes to you." This sweep finds red
// alerts still 'open' past the SLA window, marks them escalated, and notifies org
// admins so no urgent alert rots silently.
//
// FERPA / privacy:
//   • Reads/updates the existing `alerts` table → inherits its RLS. Coaches never
//     see alerts; this sweep runs server-side with the service role.
//   • Gated by CRON_SECRET.
//   • Escalation emails carry zero athlete identity and zero wellness data.
//   • Each escalation is written to audit_logs.
//
// An escalated alert stays status='open' (it still needs action) but gets
// escalated_at set so it's only escalated once and the UI can badge it.

const SLA_HOURS = 4; // red alert unacknowledged this long → escalate

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional org scope — bound the sweep to one organization (see silence route).
  let organizationId: string | null = null;
  try {
    const body = await request.json();
    if (body && typeof body.organization_id === "string") organizationId = body.organization_id;
  } catch { /* no body — global */ }

  const svc = createServiceSupabaseClient();
  const cutoff = new Date(Date.now() - SLA_HOURS * 3600000).toISOString();

  // Open red alerts, not yet escalated, older than the SLA window.
  let staleQuery = svc
    .from("alerts")
    .select("id, created_at, organization_id")
    .eq("severity", "red")
    .eq("status", "open")
    .is("escalated_at", null)
    .lt("created_at", cutoff)
    .range(0, 4999);
  if (organizationId) staleQuery = staleQuery.eq("organization_id", organizationId);
  const { data: stale, error } = await staleQuery;
  if (error) {
    return NextResponse.json({ error: "Failed to scan alerts" }, { status: 500 });
  }
  if (!stale || stale.length === 0) {
    return NextResponse.json({ success: true, escalated: 0 });
  }

  const nowIso = new Date().toISOString();
  const ids = stale.map(a => a.id);

  // Mark escalated (single update; idempotent because we filtered escalated_at IS NULL).
  const { error: updErr } = await svc
    .from("alerts")
    .update({ escalated_at: nowIso })
    .in("id", ids);
  if (updErr) {
    console.error("[sla] escalation update failed:", updErr.message);
    return NextResponse.json({ error: "Failed to escalate" }, { status: 500 });
  }

  // Audit each escalation.
  await svc.from("audit_logs").insert(
    stale.map(a => ({
      actor_profile_id: null,
      action:           "alert_escalated",
      target_type:      "alert",
      target_id:        a.id,
      organization_id:  a.organization_id ?? null,
      metadata:         { reason: "sla_breach", sla_hours: SLA_HOURS },
    }))
  );

  // Notify admins per org — zero athlete identity, just team + hours open.
  const byOrg = new Map<string, number>(); // orgId -> max hours open
  for (const a of stale) {
    if (!a.organization_id) continue;
    const hours = Math.round((Date.now() - new Date(a.created_at).getTime()) / 3600000);
    byOrg.set(a.organization_id, Math.max(byOrg.get(a.organization_id) ?? 0, hours));
  }
  for (const [orgId, hoursOpen] of Array.from(byOrg)) {
    const { data: org } = await svc.from("organizations").select("name").eq("id", orgId).single();
    const { data: admins } = await svc
      .from("profiles")
      .select("email")
      .eq("organization_id", orgId)
      .eq("role", "admin");
    const teamName = org?.name ?? "your program";
    await Promise.all(
      (admins ?? []).map(a =>
        sendEscalationEmail({ to: a.email, teamName, hoursOpen }).catch(err =>
          console.error("[sla] email failed:", err)
        )
      )
    );
  }

  return NextResponse.json({ success: true, escalated: stale.length });
}
