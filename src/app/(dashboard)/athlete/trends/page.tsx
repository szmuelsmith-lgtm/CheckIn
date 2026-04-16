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

interface TrendPoint {
  week: string;
  emotional: number | null;
  resilience: number | null;
  recovery: number | null;
  support: number | null;
}

const PILLAR_COLORS: Record<Pillar, string> = {
  emotional:  "#059669",
  resilience: "#3B82F6",
  recovery:   "#8B5CF6",
  support:    "#0891b2",
};

const PILLAR_ICONS: Record<Pillar, React.ReactNode> = {
  emotional:  <Heart  className="h-3.5 w-3.5" />,
  resilience: <Zap    className="h-3.5 w-3.5" />,
  recovery:   <Shield className="h-3.5 w-3.5" />,
  support:    <Users  className="h-3.5 w-3.5" />,
};

const PILLAR_BG: Record<Pillar, string> = {
  emotional:  "bg-emerald-50 border-emerald-200/70",
  resilience: "bg-blue-50 border-blue-200/70",
  recovery:   "bg-violet-50 border-violet-200/70",
  support:    "bg-cyan-50 border-cyan-200/70",
};

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

const PILLAR_DESCRIPTIONS: Record<Pillar, string> = {
  emotional:  "How you feel emotionally day-to-day",
  resilience: "Your ability to handle stress and setbacks",
  recovery:   "Sleep quality, rest, and physical energy",
  support:    "Feeling connected and supported by others",
};

// Custom tooltip for the chart
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-[12px]">
      <p className="font-semibold text-slate-700 mb-2">Week of {label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-600">{entry.name}</span>
          </div>
          <span className="font-bold" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("auth_user_id", user.id)
        .single();

      if (!prof) return;
      setProfile(prof);

      const twelveWeeksAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString();

      const { data: checkins } = await supabase
        .from("checkins")
        .select("emotional_score, resilience_score, recovery_score, support_score, completed_at")
        .eq("athlete_id", prof.id)
        .gte("completed_at", twelveWeeksAgo)
        .order("completed_at", { ascending: true });

      if (!checkins || checkins.length === 0) {
        setTrendData([]);
        setLoading(false);
        return;
      }

      type WeekBucket = { emotional: number[]; resilience: number[]; recovery: number[]; support: number[] };
      const weekMap = new Map<string, WeekBucket>();

      checkins.forEach((c) => {
        const date = new Date(c.completed_at);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        const weekKey = monday.toISOString().split("T")[0];

        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, { emotional: [], resilience: [], recovery: [], support: [] });
        }
        const w = weekMap.get(weekKey)!;
        if (c.emotional_score != null)  w.emotional.push(c.emotional_score);
        if (c.resilience_score != null) w.resilience.push(c.resilience_score);
        if (c.recovery_score != null)   w.recovery.push(c.recovery_score);
        if (c.support_score != null)    w.support.push(c.support_score);
      });

      const avg = (arr: number[]) =>
        arr.length > 0 ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : null;

      const trends: TrendPoint[] = Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekKey, scores]) => {
          const d = new Date(weekKey);
          return {
            week: `${d.getMonth() + 1}/${d.getDate()}`,
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
          <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-emerald-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const latest = trendData.length > 0 ? trendData[trendData.length - 1] : null;
  const prev    = trendData.length > 1 ? trendData[trendData.length - 2] : null;

  function trend(pillar: Pillar): "up" | "down" | "flat" | null {
    if (!latest || !prev) return null;
    const curr = latest[pillar];
    const p    = prev[pillar];
    if (curr === null || p === null) return null;
    if (curr > p + 0.5) return "up";
    if (curr < p - 0.5) return "down";
    return "flat";
  }

  // Streak: consecutive weeks that have any data
  const streak = trendData.reduce((acc, _, i, arr) => {
    const fromEnd = arr.length - 1 - i;
    const pt = arr[arr.length - 1 - i];
    if (fromEnd !== acc) return acc;
    const hasData = PILLARS.some(p => pt[p] !== null);
    return hasData ? acc + 1 : acc;
  }, 0);

  // Personal best for each pillar
  const personalBest: Partial<Record<Pillar, number>> = {};
  PILLARS.forEach(p => {
    const vals = trendData.map(d => d[p]).filter(v => v !== null) as number[];
    if (vals.length > 0) personalBest[p] = Math.max(...vals);
  });

  // Insight: most improved pillar this week vs last
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
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Your Trends</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">Rolling 12-week view of your four wellness pillars.</p>
        </div>

        {trendData.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <TrendingUp className="h-8 w-8 text-slate-300 mx-auto mb-4" />
            <h2 className="text-[17px] font-semibold text-slate-900 mb-2">No data yet</h2>
            <p className="text-[14px] text-slate-500 mb-5">Complete your first check-in to start tracking trends.</p>
            <Link
              href="/athlete/checkin"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}
            >
              Start check-in <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <>
            {/* Streak + insights */}
            {(streak > 1 || mostImproved) && (
              <div className="grid grid-cols-2 gap-3">
                {streak > 1 && (
                  <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#fef3c7" }}>
                      <Flame className="h-[18px] w-[18px]" style={{ color: "#d97706" }} />
                    </div>
                    <div>
                      <p className="text-[22px] font-bold tabular-nums leading-none" style={{ color: "#92400e" }}>{streak}</p>
                      <p className="text-[11px] font-medium mt-0.5" style={{ color: "#d97706" }}>week streak 🔥</p>
                    </div>
                  </div>
                )}
                {mostImproved && (
                  <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#dcfce7" }}>
                      <Star className="h-[18px] w-[18px]" style={{ color: "#047857" }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#047857" }}>Most improved</p>
                      <p className="text-[13px] font-semibold mt-0.5" style={{ color: "#065f46" }}>
                        {PILLAR_LABELS[(mostImproved as { pillar: Pillar; change: number }).pillar]}
                        {" "}+{((mostImproved as { pillar: Pillar; change: number }).change).toFixed(1)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Latest scores */}
            <div className="grid grid-cols-2 gap-3">
              {PILLARS.map((pillar) => {
                const val = latest?.[pillar];
                const t   = trend(pillar);
                const pct = val !== null && val !== undefined ? Math.round((val / 10) * 100) : 0;
                return (
                  <div
                    key={pillar}
                    className={`rounded-2xl border p-4 ${PILLAR_BG[pillar]}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => setActiveLines(prev => ({ ...prev, [pillar]: !prev[pillar] }))}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5" style={{ color: PILLAR_COLORS[pillar] }}>
                        {PILLAR_ICONS[pillar]}
                        <span className="text-[11px] font-bold uppercase tracking-wider">{PILLAR_LABELS[pillar]}</span>
                      </div>
                      {t && (
                        <span className={`text-[11px] font-semibold ${t === "up" ? "text-emerald-600" : t === "down" ? "text-red-500" : "text-slate-400"}`}>
                          {t === "up" ? "↑" : t === "down" ? "↓" : "→"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <p className="text-[28px] font-bold leading-none" style={{ color: PILLAR_COLORS[pillar] }}>
                        {val ?? "—"}
                      </p>
                      {val !== null && val !== undefined && personalBest[pillar] !== undefined && val >= personalBest[pillar]! && trendData.length > 2 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1"
                              style={{ background: PILLAR_COLORS[pillar] + "20", color: PILLAR_COLORS[pillar] }}>
                          BEST
                        </span>
                      )}
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.08)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: PILLAR_COLORS[pillar], opacity: 0.6 }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">out of 10 · tap to toggle</p>
                  </div>
                );
              })}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold text-slate-900">Wellness over time</h2>
                <p className="text-[12px] text-slate-400">{trendData.length} week{trendData.length !== 1 ? "s" : ""} of data</p>
              </div>

              {/* Legend (interactive) */}
              <div className="flex flex-wrap gap-2 mb-4">
                {PILLARS.map((pillar) => (
                  <button
                    key={pillar}
                    onClick={() => setActiveLines(prev => ({ ...prev, [pillar]: !prev[pillar] }))}
                    className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
                      activeLines[pillar]
                        ? "border-transparent opacity-100"
                        : "border-slate-200 opacity-40"
                    }`}
                    style={activeLines[pillar] ? { background: PILLAR_COLORS[pillar] + "20", color: PILLAR_COLORS[pillar], borderColor: PILLAR_COLORS[pillar] + "40" } : {}}
                  >
                    <div className="h-2 w-2 rounded-full" style={{ background: PILLAR_COLORS[pillar] }} />
                    {PILLAR_LABELS[pillar]}
                  </button>
                ))}
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      domain={[1, 10]}
                      ticks={[2, 4, 6, 8, 10]}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {PILLARS.map(pillar => (
                      activeLines[pillar] && (
                        <Line
                          key={pillar}
                          type="monotone"
                          dataKey={pillar}
                          stroke={PILLAR_COLORS[pillar]}
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: PILLAR_COLORS[pillar], strokeWidth: 0 }}
                          activeDot={{ r: 5, strokeWidth: 0 }}
                          connectNulls
                          name={PILLAR_LABELS[pillar]}
                        />
                      )
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pillar explanations */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-[13px] font-semibold text-slate-700 mb-3 uppercase tracking-wide">Understanding your pillars</h3>
              <div className="space-y-3">
                {PILLARS.map(pillar => (
                  <div key={pillar} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: PILLAR_COLORS[pillar] + "15", color: PILLAR_COLORS[pillar] }}>
                      {PILLAR_ICONS[pillar]}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800">{PILLAR_LABELS[pillar]}</p>
                      <p className="text-[12px] text-slate-500 leading-relaxed">{PILLAR_DESCRIPTIONS[pillar]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy note */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-center">
              <p className="text-[12px] text-emerald-800">
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
