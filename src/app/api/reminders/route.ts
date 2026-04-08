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

    // Get athletes in those orgs who haven't opted out of reminders
    // Left join with athlete_preferences to check opt-out
    const { data: athletes } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("organization_id", orgIds)
      .eq("role", "athlete");

    if (!athletes || athletes.length === 0) {
      return NextResponse.json({ success: true, message: "No athletes to remind", sent: 0 });
    }

    // Check for opt-outs
    const athleteIds = athletes.map((a) => a.id);
    const { data: prefs } = await supabase
      .from("athlete_preferences")
      .select("athlete_id, opt_out_reminders")
      .in("athlete_id", athleteIds)
      .eq("opt_out_reminders", true);

    const optedOut = new Set(prefs?.map((p) => p.athlete_id) || []);

    // Check who already checked in this week (skip them)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentCheckins } = await supabase
      .from("checkins")
      .select("athlete_id")
      .in("athlete_id", athleteIds)
      .gte("completed_at", weekAgo);

    const alreadyCheckedIn = new Set(recentCheckins?.map((c) => c.athlete_id) || []);

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
