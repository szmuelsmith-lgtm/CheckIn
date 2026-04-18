"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Pillar } from "@/types/database";
import Link from "next/link";
import {
  ClipboardCheck, TrendingUp, Heart, Lock, ClipboardList,
  ArrowRight, Zap, Shield, Users,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:        "#f4f7f5",
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

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

const PILLAR_ICONS: Record<Pillar, React.ReactNode> = {
  emotional:  <Heart  size={13} />,
  resilience: <Zap    size={13} />,
  recovery:   <Shield size={13} />,
  support:    <Users  size={13} />,
};

// ─── Semantic score coloring ──────────────────────────────────────────────────
function scoreColor(s: number | null): string {
  if (s === null) return "#cbd5e1";
  if (s >= 7)    return "#059669";   // green — stable
  if (s >= 4)    return "#d97706";   // amber — moderate
  return         "#ef4444";          // red — elevated
}

function scoreBg(s: number | null): string {
  if (s === null) return T.surface;
  if (s >= 7)    return "#f0fdf4";
  if (s >= 4)    return "#fffbeb";
  return         "#fef2f2";
}

function scoreBorder(s: number | null): string {
  if (s === null) return T.border;
  if (s >= 7)    return "#bbf7d0";
  if (s >= 4)    return "#fde68a";
  return         "#fecaca";
}

// ─── Circular progress dial ───────────────────────────────────────────────────
function PillarDial({ score }: { score: number | null }) {
  const CX = 44, CY = 44, R = 32, SW = 6;
  const circ   = 2 * Math.PI * R;
  const pct    = score !== null ? Math.min(score / 10, 1) : 0;
  const offset = circ * (1 - pct);
  const col    = scoreColor(score);

  return (
    <svg width={88} height={88} viewBox="0 0 88 88" style={{ overflow: "visible" }}>
      {/* Track */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e8edf2" strokeWidth={SW} />
      {/* Progress */}
      {score !== null && pct > 0 && (
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={col}
          strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${CX} ${CY})`}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)" }}
        />
      )}
    </svg>
  );
}

// ─── Pillar card ──────────────────────────────────────────────────────────────
function PillarCard({ pillar, score }: { pillar: Pillar; score: number | null }) {
  const col = scoreColor(score);
  return (
    <div
      className="rounded-3xl p-4 flex flex-col items-center animate-fade-in-up"
      style={{
        background:  scoreBg(score),
        border:      `1px solid ${scoreBorder(score)}`,
        boxShadow:   "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center gap-1.5 self-start mb-2">
        <span style={{ color: col }}>{PILLAR_ICONS[pillar]}</span>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
          {PILLAR_LABELS[pillar]}
        </p>
      </div>

      {/* Dial with overlaid score */}
      <div className="relative flex items-center justify-center">
        <PillarDial score={score} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-[22px] font-bold tabular-nums leading-none"
            style={{ color: col }}
          >
            {score !== null ? score.toFixed(1) : "—"}
          </span>
          <span className="text-[9px] mt-0.5" style={{ color: T.textMuted }}>/ 10</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
interface LatestCheckin {
  completed_at:     string;
  emotional_score:  number | null;
  resilience_score: number | null;
  recovery_score:   number | null;
  support_score:    number | null;
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: prof } = await supabase
        .from("profiles").select("id, full_name").eq("auth_user_id", session.user.id).single();
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
        <div className="h-6 w-6 rounded-full border-2 animate-spin"
             style={{ borderColor: "#e2e8f0", borderTopColor: T.green }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl p-8 text-center"
             style={{ background: T.surface, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: `1px solid ${T.border}` }}>
          <p className="text-sm mb-3" style={{ color: T.textMuted }}>Couldn&apos;t load your dashboard.</p>
          <button onClick={load} className="text-sm font-semibold" style={{ color: T.green }}>Retry</button>
        </div>
      </div>
    </DashboardLayout>
  );

  const daysSinceCheckin = latestCheckin
    ? Math.floor((Date.now() - new Date(latestCheckin.completed_at).getTime()) / 86400000)
    : null;

  const pillarScores: Record<Pillar, number | null> = {
    emotional:  latestCheckin?.emotional_score  ?? null,
    resilience: latestCheckin?.resilience_score ?? null,
    recovery:   latestCheckin?.recovery_score   ?? null,
    support:    latestCheckin?.support_score    ?? null,
  };

  const hasScores = latestCheckin && PILLARS.some(p => pillarScores[p] !== null);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  const statusMsg =
    daysSinceCheckin === null      ? "Welcome — start your first check-in below."
    : daysSinceCheckin === 0       ? "You checked in today. Keep it up."
    : daysSinceCheckin <= 7        ? `Last checked in ${daysSinceCheckin} day${daysSinceCheckin === 1 ? "" : "s"} ago.`
    :                                "It's been a while — how are you doing?";

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Greeting card ─────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-5 animate-fade-in"
          style={{
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 80%, #a7f3d0 100%)",
            border: "1px solid #a7f3d0",
            boxShadow: "0 2px 12px rgba(5,150,105,0.08)",
          }}
        >
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#059669" }}>
                {today}
              </p>
              <h1 className="text-[26px] font-bold tracking-tight mt-0.5" style={{ color: T.text }}>
                {greeting}, {firstName}!
              </h1>
              <p className="text-[13px] mt-1 leading-snug" style={{ color: "#047857" }}>
                {statusMsg}
              </p>
            </div>
            <div
              className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #065f46, #059669)",
                boxShadow: "0 4px 12px rgba(5,150,105,0.35)",
              }}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="3" />
                <path d="M6.5 8.5C4 10.5 3 13.5 4 16l3 6h10l3-6c1-2.5 0-5.5-2.5-7.5" />
              </svg>
            </div>
          </div>
          {/* Decorative orbs */}
          <div className="absolute -right-5 -bottom-5 h-24 w-24 rounded-full pointer-events-none"
               style={{ background: "rgba(16,185,129,0.12)" }} />
          <div className="absolute right-10 -top-8 h-20 w-20 rounded-full pointer-events-none"
               style={{ background: "rgba(16,185,129,0.07)" }} />
        </div>

        {/* ── Pillar score grid ──────────────────────────────────────── */}
        {hasScores ? (
          <div className="grid grid-cols-2 gap-3">
            {PILLARS.map((pillar, i) => (
              <div key={pillar} style={{ animationDelay: `${i * 60}ms` }}>
                <PillarCard pillar={pillar} score={pillarScores[pillar]} />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="rounded-3xl p-10 text-center animate-fade-in"
            style={{
              background: T.surface,
              border: `2px dashed ${T.border}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div
              className="h-14 w-14 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#f0fdf4" }}
            >
              <TrendingUp className="h-7 w-7" style={{ color: "#bbf7d0" }} />
            </div>
            <p className="text-[14px] font-medium" style={{ color: T.textMuted }}>
              Your wellness scores appear here after your first check-in.
            </p>
          </div>
        )}

        {/* ── Primary CTA — Weekly check-in ─────────────────────────── */}
        <Link
          href="/athlete/checkin"
          className="block rounded-3xl overflow-hidden animate-fade-in-up group"
          style={{
            boxShadow: "0 4px 24px rgba(5,150,105,0.2), 0 2px 6px rgba(5,150,105,0.12)",
          }}
        >
          <div
            className="px-5 py-5 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 55%, #10b981 100%)" }}
          >
            <div className="flex items-center gap-4">
              <div
                className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}
              >
                <ClipboardCheck className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-[17px] text-white">Weekly Check-In</p>
                <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                  2 minutes · Confidential
                </p>
              </div>
            </div>
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <ArrowRight className="h-4 w-4 text-white" />
            </div>
          </div>
        </Link>

        {/* ── Secondary CTA — Screening ─────────────────────────────── */}
        <Link
          href="/athlete/checkin/screening"
          className="flex items-center justify-between rounded-3xl px-5 py-4 group animate-fade-in-up"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: T.raised, border: `1px solid ${T.border}` }}
            >
              <ClipboardList className="h-4 w-4" style={{ color: T.textMuted }} />
            </div>
            <div>
              <p className="font-semibold text-[15px]" style={{ color: T.textSub }}>Mental Health Screening</p>
              <p className="text-[12px]" style={{ color: T.textMuted }}>Comprehensive assessment</p>
            </div>
          </div>
          <ArrowRight
            className="h-4 w-4 shrink-0 group-hover:translate-x-0.5 transition-transform"
            style={{ color: T.textMuted }}
          />
        </Link>

        {/* ── Quick links ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { href: "/athlete/trends",    icon: <TrendingUp className="h-5 w-5" />, label: "Trends",    color: "#3b82f6", bg: "#eff6ff" },
            { href: "/athlete/resources", icon: <Heart      className="h-5 w-5" />, label: "Resources", color: "#ec4899", bg: "#fdf2f8" },
            { href: "/athlete/privacy",   icon: <Lock       className="h-5 w-5" />, label: "Privacy",   color: "#8b5cf6", bg: "#f5f3ff" },
          ] as const).map(({ href, icon, label, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-2.5 rounded-3xl py-5 transition-all active:scale-95 animate-fade-in-up"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="h-10 w-10 rounded-2xl flex items-center justify-center"
                style={{ background: bg, color }}
              >
                {icon}
              </div>
              <span className="text-[12px] font-semibold" style={{ color: T.textSub }}>{label}</span>
            </Link>
          ))}
        </div>

        {/* ── Privacy notice ─────────────────────────────────────────── */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
          <p className="text-[12px] leading-relaxed" style={{ color: "#065f46" }}>
            <span className="font-semibold">Your data is private.</span>{" "}
            Coaches only see anonymized team averages — never your individual responses.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
