"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Pillar } from "@/types/database";
import Link from "next/link";
import { Heart, Zap, Shield, Users, ArrowRight, FileText, Lock } from "lucide-react";

// ─── Design system — Smart Home aesthetic ─────────────────────────────────────
const DS = {
  bg:        "#F0F2F8",
  surface:   "#FFFFFF",
  shadow:    "0 4px 24px rgba(31,38,135,0.08)",
  shadowSm:  "0 2px 12px rgba(31,38,135,0.05)",
  text:      "#1C1C3D",
  textSub:   "#5A5A8A",
  textMuted: "#9EA3B2",
  radius:    "20px",
};

const PILLAR_CONFIG: Record<Pillar, { color: string; bg: string; icon: React.ReactNode; grad: string }> = {
  emotional:  { color: "#5B8FF9", bg: "#EEF3FF", grad: "#5B8FF9", icon: <Heart  className="h-5 w-5" /> },
  resilience: { color: "#9B8FF9", bg: "#F0EEFF", grad: "#9B8FF9", icon: <Zap    className="h-5 w-5" /> },
  recovery:   { color: "#10B981", bg: "#D1FAE5", grad: "#10B981", icon: <Shield className="h-5 w-5" /> },
  support:    { color: "#00C2CB", bg: "#E0FAFB", grad: "#00C2CB", icon: <Users  className="h-5 w-5" /> },
};

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

interface LatestCheckin {
  completed_at:     string;
  emotional_score:  number | null;
  resilience_score: number | null;
  recovery_score:   number | null;
  support_score:    number | null;
  mode:             string;
}

export default function AthleteDashboard() {
  const [userName, setUserName]           = useState("...");
  const [firstName, setFirstName]         = useState("Athlete");
  const [latestCheckin, setLatestCheckin] = useState<LatestCheckin | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(false);

  async function load() {
    setLoading(true); setError(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase
        .from("profiles").select("id, full_name").eq("auth_user_id", user.id).single();
      if (!prof) { setLoading(false); return; }
      setUserName(prof.full_name);
      setFirstName(prof.full_name?.split(" ")[0] || "Athlete");
      const { data: checkins } = await supabase
        .from("checkins")
        .select("completed_at, emotional_score, resilience_score, recovery_score, support_score, mode")
        .eq("athlete_id", prof.id)
        .order("completed_at", { ascending: false })
        .limit(1);
      if (checkins && checkins.length > 0) setLatestCheckin(checkins[0] as LatestCheckin);
    } catch { setError(true); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <DashboardLayout role="athlete" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin"
             style={{ borderColor: "#EEF3FF", borderTopColor: "#5B8FF9" }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-2xl mx-auto">
        <div className="rounded-[20px] p-8 text-center" style={{ background: DS.surface, boxShadow: DS.shadow }}>
          <p className="text-sm mb-3" style={{ color: DS.textMuted }}>Couldn&apos;t load your dashboard.</p>
          <button onClick={load} className="text-sm font-semibold" style={{ color: "#5B8FF9" }}>Retry</button>
        </div>
      </div>
    </DashboardLayout>
  );

  const daysSinceCheckin = latestCheckin
    ? Math.floor((Date.now() - new Date(latestCheckin.completed_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const pillarScores: Record<Pillar, number | null> = {
    emotional:  latestCheckin?.emotional_score  ?? null,
    resilience: latestCheckin?.resilience_score ?? null,
    recovery:   latestCheckin?.recovery_score   ?? null,
    support:    latestCheckin?.support_score    ?? null,
  };

  const hasScores = latestCheckin && PILLARS.some(p => pillarScores[p] !== null);
  const greeting  = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-2xl mx-auto space-y-4 pb-4">

        {/* Header greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight leading-tight" style={{ color: DS.text }}>
              {greeting}, {firstName}!
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: DS.textMuted }}>{today}</p>
          </div>
          <div
            className="h-11 w-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#EEF3FF", boxShadow: DS.shadowSm }}
          >
            <span className="text-[17px] font-bold" style={{ color: "#5B8FF9" }}>
              {firstName.charAt(0)}
            </span>
          </div>
        </div>

        {/* Primary CTA — gradient card */}
        <Link href="/athlete/checkin">
          <div
            className="relative overflow-hidden rounded-[20px] p-5 transition-opacity active:opacity-90"
            style={{
              background: "linear-gradient(135deg, #5B8FF9 0%, #9B8FF9 100%)",
              boxShadow: "0 10px 36px rgba(91,143,249,0.38)",
            }}
          >
            {/* Decorative blobs */}
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full pointer-events-none"
                 style={{ background: "rgba(255,255,255,0.09)" }} />
            <div className="absolute right-6 -bottom-8 h-24 w-24 rounded-full pointer-events-none"
                 style={{ background: "rgba(255,255,255,0.06)" }} />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
                   style={{ color: "rgba(255,255,255,0.65)" }}>
                  Weekly
                </p>
                <p className="text-[24px] font-bold text-white leading-tight">Check-In</p>
                <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.72)" }}>
                  {daysSinceCheckin === null
                    ? "Start your first check-in →"
                    : daysSinceCheckin === 0
                      ? "Checked in today ✓"
                      : `Last checked in ${daysSinceCheckin}d ago`}
                </p>
              </div>
              <div
                className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <ArrowRight className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </Link>

        {/* Section title */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[16px] font-bold" style={{ color: DS.text }}>Your Pillars</p>
          <Link href="/athlete/trends">
            <p className="text-[13px] font-semibold" style={{ color: "#5B8FF9" }}>See Trends →</p>
          </Link>
        </div>

        {/* Pillar grid — 2×2 cards */}
        {hasScores ? (
          <div className="grid grid-cols-2 gap-3">
            {PILLARS.map(pillar => {
              const score = pillarScores[pillar];
              const pct   = score !== null ? Math.round((score / 10) * 100) : 0;
              const cfg   = PILLAR_CONFIG[pillar];
              return (
                <div
                  key={pillar}
                  className="rounded-[20px] p-4"
                  style={{ background: DS.surface, boxShadow: DS.shadow }}
                >
                  {/* Colored icon */}
                  <div
                    className="h-10 w-10 rounded-[12px] flex items-center justify-center mb-3"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon}
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1"
                     style={{ color: DS.textMuted }}>
                    {PILLAR_LABELS[pillar]}
                  </p>
                  <p className="text-[32px] font-bold tabular-nums leading-none mb-3"
                     style={{ color: DS.text }}>
                    {score !== null ? score.toFixed(1) : "—"}
                  </p>

                  {/* Progress bar */}
                  <div className="h-[4px] rounded-full overflow-hidden"
                       style={{ background: "#F0F2F8" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(to right, ${cfg.color}88, ${cfg.color})`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: DS.textMuted }}>out of 10</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-[20px] p-10 text-center"
            style={{ background: DS.surface, boxShadow: DS.shadow }}
          >
            <div className="h-14 w-14 rounded-[16px] flex items-center justify-center mx-auto mb-4"
                 style={{ background: "#EEF3FF" }}>
              <Heart className="h-7 w-7" style={{ color: "#5B8FF9" }} />
            </div>
            <p className="text-[15px] font-bold mb-1" style={{ color: DS.text }}>No data yet</p>
            <p className="text-[13px]" style={{ color: DS.textMuted }}>
              Complete your first check-in to see your pillar scores.
            </p>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { href: "/athlete/checkin/screening", label: "Screening", color: "#5B8FF9", bg: "#EEF3FF", Icon: FileText },
            { href: "/athlete/resources",         label: "Resources", color: "#10B981", bg: "#D1FAE5", Icon: Heart    },
            { href: "/athlete/privacy",           label: "Privacy",   color: "#9B8FF9", bg: "#F0EEFF", Icon: Lock     },
          ] as const).map(({ href, label, color, bg, Icon }) => (
            <Link key={href} href={href}>
              <div
                className="rounded-[20px] py-4 px-3 flex flex-col items-center gap-2.5 transition-opacity active:opacity-80"
                style={{ background: DS.surface, boxShadow: DS.shadowSm }}
              >
                <div
                  className="h-10 w-10 rounded-[12px] flex items-center justify-center"
                  style={{ background: bg }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <span className="text-[11px] font-semibold" style={{ color: DS.textSub }}>
                  {label}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Privacy notice */}
        <div
          className="rounded-[20px] px-4 py-3.5 text-center"
          style={{ background: "#EEF3FF" }}
        >
          <p className="text-[12px]" style={{ color: DS.textSub }}>
            <span className="font-bold" style={{ color: "#5B8FF9" }}>Your data is private.</span>{" "}
            Coaches only see anonymized team averages — never your individual responses.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
