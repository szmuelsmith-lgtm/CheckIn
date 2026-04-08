import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendRedAlertEmail } from "@/lib/email";

// POST /api/notifications
// Called after a RED alert is created to notify support + admin staff
// Body: { alertId: string, teamId: string }
export async function POST(request: NextRequest) {
  try {
    // Verify API key for server-to-server calls, or authenticated user
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.INTERNAL_API_KEY;

    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      // Fall back to checking if user is authenticated
      const supabase = createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { alertId, teamId } = body;

    if (!alertId) {
      return NextResponse.json({ error: "alertId required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Get team name
    let teamName = "Unknown Team";
    if (teamId) {
      const { data: team } = await supabase
        .from("teams")
        .select("name, organization_id")
        .eq("id", teamId)
        .single();

      if (team) {
        teamName = team.name;

        // Get all support + admin users in the org
        const { data: staffProfiles } = await supabase
          .from("profiles")
          .select("email, role")
          .eq("organization_id", team.organization_id)
          .in("role", ["support", "admin"]);

        if (staffProfiles && staffProfiles.length > 0) {
          // Send email to each staff member
          const results = await Promise.allSettled(
            staffProfiles.map((staff) =>
              sendRedAlertEmail({
                to: staff.email,
                teamName,
                alertId,
              })
            )
          );

          const sent = results.filter((r) => r.status === "fulfilled").length;
          const failed = results.filter((r) => r.status === "rejected").length;

          // Audit log the notification
          await supabase.from("audit_logs").insert({
            actor_profile_id: null,
            action: "notify",
            target_type: "alert",
            target_id: alertId,
            metadata: { type: "red_alert_email", sent, failed, recipients: staffProfiles.length },
          });

          return NextResponse.json({ success: true, sent, failed });
        }
      }
    }

    return NextResponse.json({ success: true, sent: 0, message: "No recipients found" });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
