"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, Lock, Users, ClipboardCheck } from "lucide-react";

const T = {
  surface:   "#ffffff",
  raised:    "#f8fafc",
  border:    "#e8edf2",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#059669",
  greenDeep: "#065f46",
};

export default function CoachSupportInfoPage() {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { getMyProfile } = await import("@/lib/current-user");
      const { profile: prof } = await getMyProfile(supabase);
      if (!prof) return;
      setProfile(prof);
      if (prof.team_id) {
        const { data: team } = await supabase.from("teams").select("name").eq("id", prof.team_id).single();
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
          <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.green }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>Athlete Support</h1>
          <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>
            How Check-In protects your athletes{teamName ? ` on ${teamName}` : ""}
          </p>
        </div>

        {/* Hero card */}
        <div className="rounded-3xl p-8 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="h-14 w-14 rounded-3xl flex items-center justify-center mx-auto mb-4" style={{ background: "#d1fae5" }}>
            <ShieldCheck className="h-7 w-7" style={{ color: T.green }} />
          </div>
          <h2 className="text-[20px] font-bold mb-3" style={{ color: T.text }}>Athletes are supported directly</h2>
          <p className="text-[14px] max-w-lg mx-auto leading-relaxed" style={{ color: T.textMuted }}>
            When an athlete&apos;s check-in indicates they may need support, qualified counselors and support staff are notified automatically. Individual follow-ups are handled by licensed professionals, not coaches.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-3">
          {[
            {
              icon: <Lock className="h-7 w-7" style={{ color: T.green }} />,
              title: "Privacy Protected",
              desc: "Individual scores and responses are never visible to coaches. You see team percentages only.",
            },
            {
              icon: <Users className="h-7 w-7" style={{ color: T.green }} />,
              title: "Qualified Staff",
              desc: "Alerts go to licensed counselors and trained support staff who provide appropriate follow-up.",
            },
            {
              icon: <ClipboardCheck className="h-7 w-7" style={{ color: T.green }} />,
              title: "Nothing Falls Through",
              desc: "Every alert generates a tracked follow-up task. Staff response is documented and monitored.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl p-5 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "#d1fae5" }}>
                {item.icon}
              </div>
              <h3 className="font-semibold text-[13px] mb-2" style={{ color: T.text }}>{item.title}</h3>
              <p className="text-[12px]" style={{ color: T.textMuted }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* What you can do */}
        <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <h3 className="font-semibold text-[14px] mb-4" style={{ color: T.text }}>What you can do as a coach</h3>
          <ul className="space-y-3">
            {[
              "Monitor your team's overall wellness trends on the Dashboard",
              "Track week-over-week changes in team mood, stress, sleep, and support",
              "Encourage athletes to complete their weekly check-ins",
              "Use the Team Pulse page to identify team-wide patterns (e.g., stress spikes before competitions)",
              "Create a supportive team environment that encourages honest check-ins",
              "Refer any athlete who approaches you directly to your program's support staff",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-[13px]" style={{ color: T.textSub }}>
                <div className="h-1.5 w-1.5 rounded-full shrink-0 mt-2" style={{ background: T.green }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
