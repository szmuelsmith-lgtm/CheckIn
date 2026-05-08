"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import type { Pillar } from "@/types/database";
import Link from "next/link";
import {
  ClipboardCheck, TrendingUp, TrendingDown, Minus, Heart, Lock,
  ArrowRight, Zap, Shield, Users, ClipboardList,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:         "#f4f7f5",
  surface:    "#ffffff",
  raised:     "#f8fafc",
  border:     "#e8edf2",
  borderSub:  "#f1f5f9",
  text:       "#0f172a",
  textSub:    "#334155",
  textMuted:  "#64748b",
  green:      "#16a34a",
  greenDeep:  "#065f46",
  greenLight: "#f0fdf4",
  amber:      "#d97706",
  amberLight: "#fefce8",
  red:        "#dc2626",
  redLight:   "#fef2f2",
};

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

const PILLAR_LABEL: Record<Pillar, string> = {
  emotional:  "Emotional",
  resilience: "Resilience",
  recovery:   "Recovery",
  support:    "Support",
};

const PILLAR_ICON: Record<Pillar, React.ReactNode> = {
  emotional:  <Heart  className="h-3.5 w-3.5" />,
  resilience: <Zap    className="h-3.5 w-3.5" />,
  recovery:   <Shield className="h-3.5 w-3.5" />,
  support:    <Users  className="h-3.5 w-3.5" />,
};

const PILLAR_COLOR: Record<Pillar, string> = {
  emotional:  "#16a34a",
  resilience: "#3b82f6",
  recovery:   "#8b5cf6",
  support:    "#06b6d4",
};

const PILLAR_TRACK: Record<Pillar, string> = {
  emotional:  "#dcfce7",
  resilience: "#dbeafe",
  recovery:   "#ede9fe",
  support:    "#cffafe",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface CheckinRow {
  completed_at:     string;
  emotional_score:  number | null;
  resilience_score: number | null;
  recovery_score:   number | null;
  support_score:    number | null;
}

interface StatusInfo {
  message: string;
  sub:     string;
  dot:     string;
  bg:      string;
  border:  string;
  textCol: string;
}

// ─── Status derivation ────────────────────────────────────────────────────────
function deriveStatus(scores: Record<Pillar, number | null>, daysSince: number | null): StatusInfo {
  const vals = PILLARS.map(p => scores[p]).filter((v): v is number => v !== null);

  if (vals.length === 0) return {
    message: "Welcome to Check-In",
    sub:     "Complete your first check-in to see your wellness snapshot.",
    dot:     T.textMuted, bg: T.raised, border: T.border, textCol: T.textSub,
  };

  if (daysSince !== null && daysSince > 7) return {
    message: "Time for a check-in",
    sub:     "It's been a while — a quick check-in keeps your trends current.",
    dot: T.amber, bg: T.amberLight, border: "#fde68a", textCol: "#92400e",
  };

  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;

  if (avg >= 7) return {
    message: "You're doing well this week",
    sub:     "Your wellness scores are in a healthy range.",
    dot: T.green, bg: T.greenLight, border: "#bbf7d0", textCol: T.greenDeep,
  };

  if (avg >= 4.5) return {
    message: "Some areas need attention",
    sub:     "A few pillars show signs of stress. Small steps help.",
    dot: T.amber, bg: T.amberLight, border: "#fde68a", textCol: "#92400e",
  };

  return {
    message: "Support is available",
    sub:     "You may be going through a tough time. You're not alone.",
    dot: T.red, bg: T.redLight, border: "#fecaca", textCol: "#991b1b",
  };
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <div className="w-full h-5" />;
  const W = 100, H = 22;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const pts = values.map((v, i) => ({
    x: 2 + (i / (values.length - 1)) * (W - 4),
    y: 2 + (1 - (v - min) / range) * (H - 4),
  }));
  // Smooth cubic bezier through points
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const mx = (p.x + c.x) / 2;
    d += ` C${mx.toFixed(1)},${p.y.toFixed(1)} ${mx.toFixed(1)},${c.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`;
  }
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.65} />
      {/* Latest dot */}
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={2} fill={color} opacity={0.9} />
    </svg>
  );
}

// ─── Pillar card ──────────────────────────────────────────────────────────────
function PillarCard({ pillar, score, history }: { pillar: Pillar; score: number | null; history: number[] }) {
  const color = PILLAR_COLOR[pillar];
  const pct   = score !== null ? Math.min((score / 10) * 100, 100) : 0;

  const scoreCol = score === null ? T.textMuted
    : score >= 7 ? T.green
    : score >= 4.5 ? T.amber
    : T.red;

  const trend = history.length >= 2
    ? history[history.length - 1] - history[history.length - 2]
    : null;

  return (
    <div className="rounded-2xl p-4"
         style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span style={{ color }}>{PILLAR_ICON[pillar]}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>
            {PILLAR_LABEL[pillar]}
          </span>
        </div>
        {trend !== null && (
          trend > 0.3  ? <TrendingUp   className="h-3.5 w-3.5" style={{ color: T.green }} /> :
          trend < -0.3 ? <TrendingDown className="h-3.5 w-3.5" style={{ color: T.red   }} /> :
                         <Minus        className="h-3 w-3"     style={{ color: T.textMuted }} />
        )}
      </div>

      {/* Score */}
      <p className="text-[28px] font-bold tabular-nums leading-none mb-2" style={{ color: scoreCol }}>
        {score !== null ? score.toFixed(1) : "—"}
        {score !== null && <span className="text-[12px] font-normal ml-0.5" style={{ color: T.textMuted }}>/10</span>}
      </p>

      {/* Bar */}
      <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background: PILLAR_TRACK[pillar] }}>
        <div className="h-full rounded-full transition-all duration-700"
             style={{ width: `${pct}%`, background: color }} />
      </div>

      {/* Sparkline */}
      <Sparkline values={history} color={color} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AthleteDashboard() {
  const [userName,  setUserName]  = useState("...");
  const [firstName, setFirstName] = useState("Athlete");
  const [history,   setHistory]   = useState<CheckinRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);

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

      const { data: recent } = await supabase
        .from("checkins")
        .select("completed_at, emotional_score, resilience_score, recovery_score, support_score")
        .eq("athlete_id", prof.id)
        .order("completed_at", { ascending: false })
        .limit(6);

      if (recent) setHistory([...recent].reverse() as CheckinRow[]);
    } catch { setError(true); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const latest = history[history.length - 1] ?? null;

  const pillarScores: Record<Pillar, number | null> = {
    emotional:  latest?.emotional_score  ?? null,
    resilience: latest?.resilience_score ?? null,
    recovery:   latest?.recovery_score   ?? null,
    support:    latest?.support_score    ?? null,
  };

  const pillarHistory: Record<Pillar, number[]> = {
    emotional:  history.map(c => c.emotional_score).filter((v): v is number => v !== null),
    resilience: history.map(c => c.resilience_score).filter((v): v is number => v !== null),
    recovery:   history.map(c => c.recovery_score).filter((v): v is number => v !== null),
    support:    history.map(c => c.support_score).filter((v): v is number => v !== null),
  };

  const daysSince = latest
    ? Math.floor((Date.now() - new Date(latest.completed_at).getTime()) / 86400000)
    : null;

  const status      = deriveStatus(pillarScores, daysSince);
  const hasData     = history.length > 0;
  const checkedToday = daysSince === 0;

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  if (loading) return (
    <DashboardLayout role="athlete" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin"
             style={{ borderColor: T.border, borderTopColor: T.green }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl p-8 text-center"
             style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <p className="text-[14px] mb-3" style={{ color: T.textMuted }}>Couldn&apos;t load your dashboard.</p>
          <button onClick={load} className="text-[13px] font-semibold" style={{ color: T.green }}>Retry</button>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto space-y-4">

        {/* ── Greeting ──────────────────────────────────────────────────── */}
        <div>
          <p className="text-[12px] font-medium mb-0.5" style={{ color: T.textMuted }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>
            {greeting}, {firstName}
          </h1>
        </div>

        {/* ── Status card ───────────────────────────────────────────────── */}
        <div className="rounded-2xl px-5 py-5"
             style={{ background: status.bg, border: `1px solid ${status.border}` }}>
          <div className="flex items-start gap-3">
            <div className="h-2.5 w-2.5 rounded-full mt-[5px] shrink-0"
                 style={{ background: status.dot }} />
            <div>
              <p className="text-[16px] font-bold leading-snug" style={{ color: T.text }}>
                {status.message}
              </p>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color: status.textCol }}>
                {status.sub}
              </p>
              {daysSince !== null && (
                <p className="text-[11px] mt-2 font-medium" style={{ color: T.textMuted }}>
                  {daysSince === 0 ? "Checked in today" : `Last check-in: ${daysSince}d ago`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Check-in CTA ──────────────────────────────────────────────── */}
        <Link href="/athlete/checkin" className="block rounded-2xl overflow-hidden group"
              style={{ boxShadow: "0 4px 20px rgba(5,150,105,0.18),0 2px 6px rgba(5,150,105,0.1)" }}>
          <div className="px-5 py-4 flex items-center justify-between"
               style={{ background: "linear-gradient(135deg, #065f46 0%, #059669 55%, #10b981 100%)" }}>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: "rgba(255,255,255,0.15)" }}>
                <ClipboardCheck className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-[16px] text-white">
                  {checkedToday ? "Check in again" : "Weekly Check-In"}
                </p>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {checkedToday ? "Track how you feel today" : "2 minutes · Confidential"}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-white opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* ── Pillar cards ──────────────────────────────────────────────── */}
        {hasData ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {PILLARS.map(pillar => (
                <PillarCard
                  key={pillar}
                  pillar={pillar}
                  score={pillarScores[pillar]}
                  history={pillarHistory[pillar]}
                />
              ))}
            </div>

            {/* Full trends link */}
            <Link href="/athlete/trends"
                  className="flex items-center justify-between rounded-2xl px-5 py-4 group"
                  style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                     style={{ background: "#eff6ff" }}>
                  <TrendingUp className="h-4 w-4" style={{ color: "#3b82f6" }} />
                </div>
                <div>
                  <p className="font-semibold text-[14px]" style={{ color: T.textSub }}>Your Trends</p>
                  <p className="text-[11px]" style={{ color: T.textMuted }}>Full history & weekly view</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform"
                          style={{ color: T.textMuted }} />
            </Link>
          </>
        ) : (
          <div className="rounded-2xl p-10 text-center"
               style={{ background: T.surface, border: `2px dashed ${T.border}` }}>
            <TrendingUp className="h-7 w-7 mx-auto mb-3" style={{ color: T.border }} />
            <p className="text-[13px] font-medium" style={{ color: T.textMuted }}>
              Your wellness scores appear here after your first check-in.
            </p>
          </div>
        )}

        {/* ── Secondary links ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { href: "/athlete/checkin/screening", icon: <ClipboardList className="h-4 w-4" />, label: "Screening", color: "#8b5cf6", bg: "#f5f3ff" },
            { href: "/athlete/resources",         icon: <Heart         className="h-4 w-4" />, label: "Resources", color: "#ec4899", bg: "#fdf2f8" },
            { href: "/athlete/privacy",           icon: <Lock          className="h-4 w-4" />, label: "Privacy",   color: T.textMuted, bg: T.raised },
          ] as const).map(({ href, icon, label, color, bg }) => (
            <Link key={href} href={href}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 active:scale-95 transition-transform"
                  style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>
                {icon}
              </div>
              <span className="text-[11px] font-semibold" style={{ color: T.textSub }}>{label}</span>
            </Link>
          ))}
        </div>

        {/* ── Privacy note ──────────────────────────────────────────────── */}
        <div className="rounded-xl px-4 py-3.5"
             style={{ background: T.greenLight, border: "1px solid #bbf7d0" }}>
          <p className="text-[11px] leading-relaxed" style={{ color: T.greenDeep }}>
            <span className="font-semibold">Your data is private.</span>{" "}
            Coaches only see anonymized team averages — never your individual responses.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
