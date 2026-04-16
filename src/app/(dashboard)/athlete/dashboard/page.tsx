"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Pillar } from "@/types/database";
import Link from "next/link";
import { ClipboardCheck, TrendingUp, Heart, Lock, ClipboardList, ArrowRight } from "lucide-react";

// Design tokens — aligned to login page
const OB = {
  bg:         "#f8fafc",
  surface:    "#ffffff",
  raised:     "#f8fafc",
  border:     "#e2e8f0",
  borderSub:  "#f1f5f9",
  textPrimary:"#0f172a",
  textSub:    "#334155",
  textMuted:  "#64748b",
  green:      "#047857",
  greenDark:  "#047857",
  greenDeep:  "#065f46",
};

const PILLAR_TOP: Record<Pillar, string> = {
  emotional:  "#059669",
  resilience: "#2563eb",
  recovery:   "#7c3aed",
  support:    "#0891b2",
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
             style={{ borderColor: OB.border, borderTopColor: OB.green }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl p-8 text-center" style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
          <p className="text-sm mb-3" style={{ color: OB.textMuted }}>Couldn&apos;t load your dashboard.</p>
          <button onClick={load} className="text-sm font-medium" style={{ color: OB.green }}>Retry</button>
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

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Greeting */}
        <div>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: OB.textPrimary }}>
            {greeting}, {firstName}
          </h1>
          <p className="text-[14px] mt-0.5" style={{ color: OB.textMuted }}>
            {daysSinceCheckin === null
              ? "Welcome — start your first check-in below."
              : daysSinceCheckin === 0
                ? "You checked in today. Keep it up."
                : daysSinceCheckin <= 7
                  ? `Last checked in ${daysSinceCheckin} day${daysSinceCheckin === 1 ? "" : "s"} ago.`
                  : "It's been a while — how are you doing?"}
          </p>
        </div>

        {/* Pillar scores */}
        {hasScores ? (
          <div className="grid grid-cols-2 gap-3">
            {PILLARS.map(pillar => {
              const score = pillarScores[pillar];
              const pct   = score !== null ? Math.round((score / 10) * 100) : 0;
              return (
                <div
                  key={pillar}
                  className="rounded-2xl p-4"
                  style={{
                    background: OB.surface,
                    border: `1px solid ${OB.border}`,
                    borderTop: `2px solid ${PILLAR_TOP[pillar]}`,
                  }}
                >
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: OB.textMuted }}>
                    {PILLAR_LABELS[pillar]}
                  </p>
                  <p className="text-[32px] font-bold leading-none mb-2 tabular-nums" style={{ color: OB.textPrimary }}>
                    {score !== null ? score.toFixed(1) : "—"}
                  </p>
                  <div className="h-[2px] rounded-full overflow-hidden" style={{ background: OB.borderSub }}>
                    <div className="h-full rounded-full transition-all duration-500"
                         style={{ width: `${pct}%`, background: PILLAR_TOP[pillar] }} />
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: OB.textMuted }}>out of 10</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center border-dashed"
               style={{ background: OB.surface, border: `1px dashed ${OB.border}` }}>
            <TrendingUp className="h-7 w-7 mx-auto mb-3" style={{ color: OB.textMuted }} />
            <p className="text-sm" style={{ color: OB.textMuted }}>Pillar scores appear after your first check-in.</p>
          </div>
        )}

        {/* Primary CTA */}
        <Link
          href="/athlete/checkin"
          className="flex items-center justify-between rounded-2xl px-5 py-4 transition-opacity group"
          style={{ background: "linear-gradient(135deg,#065f46 0%,#047857 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-[15px] text-white">Weekly Check-In</p>
              <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.45)" }}>2 minutes · Confidential</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-white/50 group-hover:translate-x-0.5 transition-transform" />
        </Link>

        {/* Secondary CTA */}
        <Link
          href="/athlete/checkin/screening"
          className="flex items-center justify-between rounded-2xl px-5 py-4 transition-colors group"
          style={{ background: OB.surface, border: `1px solid ${OB.border}` }}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: OB.raised }}>
              <ClipboardList className="h-5 w-5" style={{ color: OB.textMuted }} />
            </div>
            <div>
              <p className="font-semibold text-[15px]" style={{ color: OB.textSub }}>Mental Health Screening</p>
              <p className="text-[12px]" style={{ color: OB.textMuted }}>Comprehensive assessment</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" style={{ color: OB.textMuted }} />
        </Link>

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/athlete/trends",    icon: <TrendingUp className="h-4 w-4" />, label: "Trends"    },
            { href: "/athlete/resources", icon: <Heart      className="h-4 w-4" />, label: "Resources" },
            { href: "/athlete/privacy",   icon: <Lock       className="h-4 w-4" />, label: "Privacy"   },
          ].map(({ href, icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 transition-colors"
              style={{ background: OB.surface, border: `1px solid ${OB.border}` }}
            >
              <span style={{ color: OB.textMuted }}>{icon}</span>
              <span className="text-[12px] font-medium" style={{ color: OB.textMuted }}>{label}</span>
            </Link>
          ))}
        </div>

        {/* Privacy notice */}
        <div className="rounded-xl px-4 py-3 text-center"
             style={{ background: OB.raised, border: `1px solid ${OB.border}` }}>
          <p className="text-[12px]" style={{ color: OB.textMuted }}>
            <span className="font-semibold" style={{ color: OB.textSub }}>Your data is private.</span>{" "}
            Coaches only see anonymized team averages — never your individual responses.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
