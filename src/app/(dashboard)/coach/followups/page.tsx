"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Lock, Users, ClipboardCheck } from "lucide-react";

export default function CoachSupportInfoPage() {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, team_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!prof) return;
      setProfile(prof);

      if (prof.team_id) {
        const { data: team } = await supabase
          .from("teams")
          .select("name")
          .eq("id", prof.team_id)
          .single();
        if (team) setTeamName(team.name);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="coach" userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Athlete Support</h1>
          <p className="text-slate-500 mt-1">
            How Check-In protects your athletes{teamName ? ` on ${teamName}` : ""}
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="py-8 text-center">
            <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              Athletes are supported directly
            </h2>
            <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
              When an athlete&apos;s check-in indicates they may need support, qualified counselors and support staff are notified automatically. Individual follow-ups are handled by licensed professionals, not coaches.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="py-6 text-center">
              <Lock className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">Privacy Protected</h3>
              <p className="text-xs text-slate-500">
                Individual scores and responses are never visible to coaches. You see team percentages only.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6 text-center">
              <Users className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">Qualified Staff</h3>
              <p className="text-xs text-slate-500">
                Alerts go to licensed counselors and trained support staff who provide appropriate follow-up.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-6 text-center">
              <ClipboardCheck className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-2 text-sm">Nothing Falls Through</h3>
              <p className="text-xs text-slate-500">
                Every alert generates a tracked follow-up task. Staff response is documented and monitored.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="py-6">
            <h3 className="font-semibold text-slate-900 mb-4">What you can do as a coach</h3>
            <ul className="space-y-3">
              {[
                "Monitor your team's overall wellness trends on the Dashboard",
                "Track week-over-week changes in team mood, stress, sleep, and support",
                "Encourage athletes to complete their weekly check-ins",
                "Use the Team Pulse page to identify team-wide patterns (e.g., stress spikes before competitions)",
                "Create a supportive team environment that encourages honest check-ins",
                "Refer any athlete who approaches you directly to your program's support staff",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
