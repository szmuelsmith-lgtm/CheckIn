import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";
import { sendSilenceDigestEmail } from "@/lib/email";

// POST /api/sweeps/silence
// Silence detection: the athletes who most need help are often the ones who
// STOP checking in. This sweep finds athletes who went quiet and, when there's
// risk context, opens a clinical-tier alert so a counselor can reach out first.
//
// Fires a 'no_checkin' alert when EITHER:
//   (a) no check-in for >= CONCERN_DAYS AND the athlete's most recent check-in
//       was yellow/red  (went quiet right after a hard week — highest value), OR
//   (b) no check-in for >= LONG_DAYS regardless of last risk (prolonged silence).
//
// FERPA / privacy:
//   • Alerts land in the existing `alerts` table → inherit its RLS. Coaches have
//     NO select policy on alerts and never see these. Only clinical tier does.
//   • Runs server-side with the service role and a CRON_SECRET gate.
//   • Notification emails carry zero athlete identity and zero wellness data.
//   • Every created alert is written to audit_logs.
//   • Deduped: never opens a second silence alert while one is already open.

const CONCERN_DAYS = 14; // quiet this long after a yellow/red → flag
const LONG_DAYS    = 21; // quiet this long regardless → flag

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Optional org scope. Pass { organization_id } to bound the sweep to a single
  // organization — required for correctness at scale (a global scan would hit the
  // DB's max-rows cap). Production cron should invoke once per organization.
  let organizationId: string | null = null;
  try {
    const body = await request.json();
    if (body && typeof body.organization_id === "string") organizationId = body.organization_id;
  } catch { /* no body — global (bounded by max-rows; intended for small deployments) */ }

  const svc = createServiceSupabaseClient();
  const now = Date.now();
  const concernCutoff = new Date(now - CONCERN_DAYS * 86400000).toISOString();
  const longCutoff    = new Date(now - LONG_DAYS * 86400000).toISOString();

  // 1. Athletes in scope.
  let athletesQuery = svc
    .from("profiles")
    .select("id, team_id, organization_id")
    .eq("role", "athlete")
    .range(0, 19999);
  if (organizationId) athletesQuery = athletesQuery.eq("organization_id", organizationId);
  const { data: athletes, error: athErr } = await athletesQuery;
  if (athErr) {
    return NextResponse.json({ error: "Failed to load athletes" }, { status: 500 });
  }
  if (!athletes || athletes.length === 0) {
    return NextResponse.json({ success: true, flagged: 0 });
  }

  // 2. Latest check-in (completed_at + risk_level) per athlete.
  //    CHUNK kept small AND the row cap lifted with .range() so athletes with
  //    many check-ins can't exhaust PostgREST's default 1000-row budget and
  //    starve later athletes in the chunk (which previously caused some to be
  //    skipped and re-flagged across runs).
  const CHUNK = 100;
  type LastCheckin = { completed_at: string; risk_level: string | null };
  const lastByAthlete = new Map<string, LastCheckin>();
  const ids = athletes.map(a => a.id);
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { data: rows } = await svc
      .from("checkins")
      .select("athlete_id, completed_at, risk_level")
      .in("athlete_id", chunk)
      .order("completed_at", { ascending: false })
      .range(0, 49999);
    for (const r of (rows ?? []) as { athlete_id: string; completed_at: string; risk_level: string | null }[]) {
      if (!lastByAthlete.has(r.athlete_id)) {
        lastByAthlete.set(r.athlete_id, { completed_at: r.completed_at, risk_level: r.risk_level });
      }
    }
  }

  // 3. Athletes who already have an OPEN no_checkin alert (dedupe).
  const alreadyOpen = new Set<string>();
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const { data: openAlerts } = await svc
      .from("alerts")
      .select("athlete_id")
      .in("athlete_id", chunk)
      .eq("trigger_type", "no_checkin")
      .eq("status", "open")
      .range(0, 19999);
    for (const a of (openAlerts ?? []) as { athlete_id: string }[]) alreadyOpen.add(a.athlete_id);
  }

  // 4. Decide who to flag.
  type ToFlag = { athlete: typeof athletes[0]; severity: "yellow" | "red"; lastCheckinAt: string | null };
  const toFlag: ToFlag[] = [];
  for (const athlete of athletes) {
    if (alreadyOpen.has(athlete.id)) continue;
    const last = lastByAthlete.get(athlete.id);

    // Never checked in at all is handled by onboarding/reminders, not silence.
    if (!last) continue;

    const concerningRisk = last.risk_level === "yellow" || last.risk_level === "red";
    const quietConcern = last.completed_at < concernCutoff && concerningRisk;
    const quietLong    = last.completed_at < longCutoff;

    if (quietConcern || quietLong) {
      // Severity mirrors the last known risk so a red-then-silence escalates.
      const severity: "yellow" | "red" = last.risk_level === "red" ? "red" : "yellow";
      toFlag.push({ athlete, severity, lastCheckinAt: last.completed_at });
    }
  }

  if (toFlag.length === 0) {
    return NextResponse.json({ success: true, flagged: 0 });
  }

  // 5. Insert alerts + audit logs.
  const alertRows = toFlag.map(f => ({
    athlete_id:      f.athlete.id,
    checkin_id:      null,
    severity:        f.severity,
    trigger_type:    "no_checkin",
    status:          "open",
    team_id:         f.athlete.team_id ?? null,
    organization_id: f.athlete.organization_id ?? null,
    last_checkin_at: f.lastCheckinAt,
  }));
  const { error: insErr } = await svc.from("alerts").insert(alertRows);
  if (insErr) {
    console.error("[silence] alert insert failed:", insErr.message);
    return NextResponse.json({ error: "Failed to create alerts" }, { status: 500 });
  }

  await svc.from("audit_logs").insert(
    toFlag.map(f => ({
      actor_profile_id: null,
      action:           "silence_flagged",
      target_type:      "athlete",
      target_id:        f.athlete.id,
      organization_id:  f.athlete.organization_id ?? null,
      metadata:         { trigger: "no_checkin", severity: f.severity },
    }))
  );

  // 6. Notify clinical staff per org — zero athlete identity, just a count.
  const byOrg = new Map<string, number>();
  for (const f of toFlag) {
    const org = f.athlete.organization_id;
    if (org) byOrg.set(org, (byOrg.get(org) ?? 0) + 1);
  }
  for (const [orgId, count] of Array.from(byOrg)) {
    const { data: org } = await svc.from("organizations").select("name").eq("id", orgId).single();
    const { data: staff } = await svc
      .from("profiles")
      .select("email")
      .eq("organization_id", orgId)
      .in("role", ["support", "admin", "psychiatrist"]);
    const teamName = org?.name ?? "your program";
    await Promise.all(
      (staff ?? []).map(s =>
        sendSilenceDigestEmail({ to: s.email, teamName, count }).catch(err =>
          console.error("[silence] email failed:", err)
        )
      )
    );
  }

  return NextResponse.json({ success: true, flagged: toFlag.length });
}
