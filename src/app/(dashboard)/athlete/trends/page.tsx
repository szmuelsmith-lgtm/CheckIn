"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Pillar } from "@/types/database";
import { TrendingUp, Heart, Zap, Shield, Users, ArrowRight, Flame, Star } from "lucide-react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  surface:   "#ffffff",
  bg:        "#f4f7f5",
  border:    "#e8edf2",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#059669",
  greenDeep: "#065f46",
};

// Pillar identity colors (for chart lines)
const PILLAR_COLORS: Record<Pillar, string> = {
  emotional:  "#059669",
  resilience: "#3b82f6",
  recovery:   "#8b5cf6",
  support:    "#06b6d4",
};

// Pillar pastel backgrounds
const PILLAR_BG: Record<Pillar, string> = {
  emotional:  "#f0fdf4",
  resilience: "#eff6ff",
  recovery:   "#f5f3ff",
  support:    "#ecfeff",
};

const PILLAR_BORDER: Record<Pillar, string> = {
  emotional:  "#bbf7d0",
  resilience: "#bfdbfe",
  recovery:   "#ddd6fe",
  support:    "#a5f3fc",
};

const PILLAR_ICONS: Record<Pillar, React.ReactNode> = {
  emotional:  <Heart  className="h-3.5 w-3.5" />,
  resilience: <Zap    className="h-3.5 w-3.5" />,
  recovery:   <Shield className="h-3.5 w-3.5" />,
  support:    <Users  className="h-3.5 w-3.5" />,
};

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

const PILLAR_DESCRIPTIONS: Record<Pillar, string> = {
  emotional:  "How you feel emotionally day-to-day",
  resilience: "Your ability to handle stress and setbacks",
  recovery:   "Sleep quality, rest, and physical energy",
  support:    "Feeling connected and supported by others",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface TrendPoint {
  week: string;
  emotional: number | null;
  resilience: number | null;
  recovery: number | null;
  support: number | null;
}

// ─── Circular score dial ────────────────────────────────────────────────────────
function ScoreDial({ score, color }: { score: number | null; color: string }) {
  const CX = 38, CY = 38, R = 28, SW = 5;
  const circ   = 2 * Math.PI * R;
  const pct    = score !== null ? Math.min(score / 10, 1) : 0;
  const offset = circ * (1 - pct);

  return (
    <svg width={76} height={76} viewBox="0 0 76 76">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e8edf2" strokeWidth={SW} />
      {score !== null && pct > 0 && (
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={color}
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

// ─── Custom tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({
  active, payload, label,
}: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-2xl p-3 text-[12px]"
      style={{
        background: "#ffffff",
        border: "1px solid #e8edf2",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}
    >
      <p className="font-semibold mb-2" style={{ color: T.textSub }}>Week of {label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span style={{ color: T.textMuted }}>{entry.name}</span>
          </div>
          <span className="font-bold" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AthleteTrendsPage() {
  const [profile, setProfile] = useState<{ full_name: string; id: string } | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [activeLines, setActiveLines] = useState<Record<Pillar, boolean>>({
    emotional: true, resilience: true, recovery: true, support: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: prof } = await supabase
        .from("profiles").select("id, full_name").eq("auth_user_id", session.user.id).single();
      if (!prof) return;
      setProfile(prof);

      const twelveWeeksAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString();
      const { data: checkins } = await supabase
        .from("checkins")
        .select("emotional_score, resilience_score, recovery_score, support_score, completed_at")
        .eq("athlete_id", prof.id)
        .gte("completed_at", twelveWeeksAgo)
        .order("completed_at", { ascending: true });

      if (!checkins || checkins.length === 0) { setTrendData([]); setLoading(false); return; }

      type WeekBucket = { emotional: number[]; resilience: number[]; recovery: number[]; support: number[] };
      const weekMap = new Map<string, WeekBucket>();

      checkins.forEach((c) => {
        const date = new Date(c.completed_at);
        const day  = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        const weekKey = monday.toISOString().split("T")[0];
        if (!weekMap.has(weekKey)) weekMap.set(weekKey, { emotional: [], resilience: [], recovery: [], support: [] });
        const w = weekMap.get(weekKey)!;
        if (c.emotional_score  != null) w.emotional.push(c.emotional_score);
        if (c.resilience_score != null) w.resilience.push(c.resilience_score);
        if (c.recovery_score   != null) w.recovery.push(c.recovery_score);
        if (c.support_score    != null) w.support.push(c.support_score);
      });

      const avg = (arr: number[]) =>
        arr.length > 0 ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : null;

      const trends: TrendPoint[] = Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekKey, scores]) => {
          const d = new Date(weekKey);
          return {
            week:       `${d.getMonth() + 1}/${d.getDate()}`,
            emotional:  avg(scores.emotional),
            resilience: avg(scores.resilience),
            recovery:   avg(scores.recovery),
            support:    avg(scores.support),
          };
        });

      setTrendData(trends);
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <DashboardLayout role="athlete" userName="...">
        <div className="flex items-center justify-center h-64">
          <div className="h-5 w-5 rounded-full border-2 animate-spin"
               style={{ borderColor: "#e2e8f0", borderTopColor: "#059669" }} />
        </div>
      </DashboardLayout>
    );
  }

  const latest = trendData.length > 0 ? trendData[trendData.length - 1] : null;
  const prev   = trendData.length > 1 ? trendData[trendData.length - 2] : null;

  function trend(pillar: Pillar): "up" | "down" | "flat" | null {
    if (!latest || !prev) return null;
    const curr = latest[pillar]; const p = prev[pillar];
    if (curr === null || p === null) return null;
    if (curr > p + 0.5) return "up";
    if (curr < p - 0.5) return "down";
    return "flat";
  }

  const streak = trendData.reduce((acc, _, i, arr) => {
    if (i !== arr.length - 1 - acc) return acc;
    const pt = arr[arr.length - 1 - i];
    return PILLARS.some(p => pt[p] !== null) ? acc + 1 : acc;
  }, 0);

  const personalBest: Partial<Record<Pillar, number>> = {};
  PILLARS.forEach(p => {
    const vals = trendData.map(d => d[p]).filter(v => v !== null) as number[];
    if (vals.length > 0) personalBest[p] = Math.max(...vals);
  });

  let mostImproved: { pillar: Pillar; change: number } | null = null;
  if (latest && prev) {
    PILLARS.forEach(p => {
      const curr = latest[p]; const lv = prev[p];
      if (curr !== null && lv !== null) {
        const change = curr - lv;
        if (!mostImproved || change > mostImproved.change) mostImproved = { pillar: p, change };
      }
    });
    if (mostImproved && (mostImproved as { pillar: Pillar; change: number }).change <= 0) mostImproved = null;
  }

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: T.text }}>Your Trends</h1>
          <p className="text-[14px] mt-0.5" style={{ color: T.textMuted }}>Rolling 12-week view of your four wellness pillars.</p>
        </div>

        {trendData.length === 0 ? (
          <div
            className="rounded-3xl p-12 text-center animate-fade-in"
            style={{
              background: T.surface,
              border: `2px dashed ${T.border}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div
              className="h-16 w-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#f0fdf4" }}
            >
              <TrendingUp className="h-8 w-8" style={{ color: "#bbf7d0" }} />
            </div>
            <h2 className="text-[17px] font-bold mb-2" style={{ color: T.text }}>No data yet</h2>
            <p className="text-[14px] mb-6" style={{ color: T.textMuted }}>
              Complete your first check-in to start tracking trends.
            </p>
            <Link
              href="/athlete/checkin"
              className="inline-flex items-center gap-2 text-[13px] font-bold text-white px-5 py-2.5 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #065f46, #059669)",
                boxShadow: "0 3px 12px rgba(5,150,105,0.3)",
              }}
            >
              Start check-in <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Streak + insights */}
            {(streak > 1 || mostImproved) && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
                {streak > 1 && (
                  <div
                    className="rounded-3xl p-4 flex items-center gap-3"
                    style={{ background: "#fffbeb", border: "1px solid #fde68a", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                  >
                    <div
                      className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: "#fef3c7" }}
                    >
                      <Flame className="h-5 w-5" style={{ color: "#d97706" }} />
                    </div>
                    <div>
                      <p className="text-[24px] font-bold tabular-nums leading-none" style={{ color: "#92400e" }}>{streak}</p>
                      <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#d97706" }}>week streak 🔥</p>
                    </div>
                  </div>
                )}
                {mostImproved && (
                  <div
                    className="rounded-3xl p-4 flex items-center gap-3"
                    style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                  >
                    <div
                      className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: "#dcfce7" }}
                    >
                      <Star className="h-5 w-5" style={{ color: "#059669" }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#059669" }}>Most improved</p>
                      <p className="text-[13px] font-semibold mt-0.5" style={{ color: "#065f46" }}>
                        {PILLAR_LABELS[(mostImproved as { pillar: Pillar; change: number }).pillar]}
                        {" "}+{((mostImproved as { pillar: Pillar; change: number }).change).toFixed(1)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Score cards with circular dials */}
            <div className="grid grid-cols-2 gap-3">
              {PILLARS.map((pillar, i) => {
                const val = latest?.[pillar];
                const t   = trend(pillar);
                const col = PILLAR_COLORS[pillar];
                const isPB = val !== null && val !== undefined && personalBest[pillar] !== undefined
                          && val >= personalBest[pillar]! && trendData.length > 2;
                return (
                  <div
                    key={pillar}
                    className="rounded-3xl p-4 flex flex-col items-center cursor-pointer animate-fade-in-up active:scale-[0.98] transition-transform"
                    style={{
                      background: PILLAR_BG[pillar],
                      border: `1px solid ${PILLAR_BORDER[pillar]}`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      animationDelay: `${i * 60}ms`,
                    }}
                    onClick={() => setActiveLines(prev => ({ ...prev, [pillar]: !prev[pillar] }))}
                  >
                    {/* Header row */}
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="flex items-center gap-1.5" style={{ color: col }}>
                        {PILLAR_ICONS[pillar]}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{PILLAR_LABELS[pillar]}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isPB && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: col + "20", color: col }}
                          >
                            BEST
                          </span>
                        )}
                        {t && (
                          <span
                            className="text-[12px] font-bold"
                            style={{
                              color: t === "up" ? "#059669" : t === "down" ? "#ef4444" : "#94a3b8",
                            }}
                          >
                            {t === "up" ? "↑" : t === "down" ? "↓" : "→"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dial */}
                    <div className="relative flex items-center justify-center">
                      <ScoreDial
                        score={val !== null && val !== undefined ? val : null}
                        color={activeLines[pillar] ? col : "#cbd5e1"}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          className="text-[20px] font-bold tabular-nums leading-none"
                          style={{ color: activeLines[pillar] ? col : "#94a3b8" }}
                        >
                          {val ?? "—"}
                        </span>
                        <span className="text-[9px] mt-0.5" style={{ color: "#94a3b8" }}>/ 10</span>
                      </div>
                    </div>

                    <p className="text-[9px] mt-1.5" style={{ color: "#94a3b8" }}>tap to toggle</p>
                  </div>
                );
              })}
            </div>

            {/* Chart */}
            <div
              className="rounded-3xl p-5 animate-fade-in"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[15px] font-bold" style={{ color: T.text }}>Wellness over time</h2>
                <p className="text-[12px]" style={{ color: T.textMuted }}>
                  {trendData.length} week{trendData.length !== 1 ? "s" : ""} of data
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 mb-4">
                {PILLARS.map((pillar) => (
                  <button
                    key={pillar}
                    onClick={() => setActiveLines(prev => ({ ...prev, [pillar]: !prev[pillar] }))}
                    className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all"
                    style={activeLines[pillar] ? {
                      background: PILLAR_COLORS[pillar] + "18",
                      color: PILLAR_COLORS[pillar],
                      borderColor: PILLAR_COLORS[pillar] + "40",
                    } : {
                      background: "transparent",
                      color: "#cbd5e1",
                      borderColor: "#e8edf2",
                    }}
                  >
                    <div className="h-2 w-2 rounded-full" style={{ background: activeLines[pillar] ? PILLAR_COLORS[pillar] : "#e2e8f0" }} />
                    {PILLAR_LABELS[pillar]}
                  </button>
                ))}
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e8edf2" }}
                    />
                    <YAxis
                      domain={[1, 10]}
                      ticks={[2, 4, 6, 8, 10]}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {PILLARS.map(pillar =>
                      activeLines[pillar] && (
                        <Line
                          key={pillar}
                          type="monotone"
                          dataKey={pillar}
                          stroke={PILLAR_COLORS[pillar]}
                          strokeWidth={2.5}
                          dot={{ r: 3.5, fill: PILLAR_COLORS[pillar], strokeWidth: 0 }}
                          activeDot={{ r: 5.5, strokeWidth: 0 }}
                          connectNulls
                          name={PILLAR_LABELS[pillar]}
                        />
                      )
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pillar explanations */}
            <div
              className="rounded-3xl p-5 animate-fade-in"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              }}
            >
              <h3
                className="text-[11px] font-bold uppercase tracking-widest mb-4"
                style={{ color: T.textMuted }}
              >
                Understanding your pillars
              </h3>
              <div className="space-y-3.5">
                {PILLARS.map(pillar => (
                  <div key={pillar} className="flex items-start gap-3">
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: PILLAR_BG[pillar], color: PILLAR_COLORS[pillar] }}
                    >
                      {PILLAR_ICONS[pillar]}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: T.textSub }}>{PILLAR_LABELS[pillar]}</p>
                      <p className="text-[12px] leading-relaxed" style={{ color: T.textMuted }}>{PILLAR_DESCRIPTIONS[pillar]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy note */}
            <div className="rounded-2xl px-5 py-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <p className="text-[12px] leading-relaxed text-center" style={{ color: "#065f46" }}>
                <span className="font-semibold">Your trends are private.</span>{" "}
                Coaches only see anonymized team-level aggregates — never your individual scores.
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
