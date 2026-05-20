import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendWeeklyReminderEmail } from "@/lib/email";

// POST /api/reminders
// Called by cron job (e.g., Vercel Cron) to send weekly check-in reminders
// Protected by CRON_SECRET
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Get today's day of week (0=Sunday, 1=Monday, etc.)
    const today = new Date().getDay();

    // Get organizations whose reminder_day matches today
    const { data: orgs } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("reminder_day", today);

    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ success: true, message: "No orgs scheduled for today", sent: 0 });
    }

    const orgIds = orgs.map((o) => o.id);

    // Get athletes in those orgs who haven't opted out of reminders.
    // .range(0, 19999) raises PostgREST's default 1,000-row cap to 20K,
    // which covers 100 teams × 100 athletes = 10K athletes with headroom.
    const { data: athletes } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("organization_id", orgIds)
      .eq("role", "athlete")
      .range(0, 19999);

    if (!athletes || athletes.length === 0) {
      return NextResponse.json({ success: true, message: "No athletes to remind", sent: 0 });
    }

    // Check for opt-outs and recent check-ins.
    // PostgREST URL limit: a single .in() with 10K UUIDs ≈ 360 KB — way over the 8 KB cap.
    // Chunk into batches of 200 (≈ 7.2 KB each). Run at most 5 in parallel to avoid
    // saturating the Supabase connection pool at 10K athletes (= 50 chunks).
    const athleteIds = athletes.map((a) => a.id);
    const CHUNK = 200;
    const CONCURRENCY = 5;
    const idChunks: string[][] = [];
    for (let i = 0; i < athleteIds.length; i += CHUNK) idChunks.push(athleteIds.slice(i, i + CHUNK));

    // Serially drain chunks at max CONCURRENCY to avoid overwhelming the connection pool.
    // At 10K athletes / 200 per chunk = 50 chunks; CONCURRENCY=5 means 10 round-trips.
    const optedOutIds: string[] = [];
    for (let i = 0; i < idChunks.length; i += CONCURRENCY) {
      const batch = idChunks.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(chunk =>
          supabase.from("athlete_preferences")
            .select("athlete_id")
            .in("athlete_id", chunk)
            .eq("opt_out_reminders", true)
        )
      );
      batchResults.forEach(r => { (r.data ?? []).forEach((p: { athlete_id: string }) => optedOutIds.push(p.athlete_id)); });
    }
    const optedOut = new Set(optedOutIds);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const checkedInIds: string[] = [];
    for (let i = 0; i < idChunks.length; i += CONCURRENCY) {
      const batch = idChunks.slice(i, i + CONCURRENCY);
      const batchResults = await Promise.all(
        batch.map(chunk =>
          supabase.from("checkins")
            .select("athlete_id")
            .in("athlete_id", chunk)
            .gte("completed_at", weekAgo)
            .limit(chunk.length) // one per athlete is enough
        )
      );
      batchResults.forEach(r => { (r.data ?? []).forEach((c: { athlete_id: string }) => checkedInIds.push(c.athlete_id)); });
    }
    const alreadyCheckedIn = new Set(checkedInIds);

    // Filter to athletes who need a reminder
    const toRemind = athletes.filter(
      (a) => !optedOut.has(a.id) && !alreadyCheckedIn.has(a.id)
    );

    if (toRemind.length === 0) {
      return NextResponse.json({ success: true, message: "All athletes up to date", sent: 0 });
    }

    // Send reminders
    const results = await Promise.allSettled(
      toRemind.map((athlete) =>
        sendWeeklyReminderEmail({
          to: athlete.email,
          athleteName: athlete.full_name,
        })
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Audit log
    await supabase.from("audit_logs").insert({
      actor_profile_id: null,
      action: "notify",
      target_type: "reminder",
      target_id: null,
      metadata: {
        type: "weekly_reminder",
        day: today,
        total_athletes: athletes.length,
        opted_out: optedOut.size,
        already_checked_in: alreadyCheckedIn.size,
        sent,
        failed,
      },
    });

    return NextResponse.json({ success: true, sent, failed, skipped: athletes.length - toRemind.length });
  } catch (error) {
    console.error("Reminder error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
