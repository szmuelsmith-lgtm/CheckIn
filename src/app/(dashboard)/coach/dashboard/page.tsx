"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS, scoreToPillarLevel } from "@/lib/pillar-scoring";
import type { Pillar, PillarScores } from "@/types/database";
import type { PillarLevel } from "@/lib/pillar-scoring";
import { ClipboardCheck, Users, TrendingUp, TrendingDown, Minus, Heart, Zap, Shield } from "lucide-react";

// ─── Design tokens ─────────────────────────────────────────────────────────────
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
  red:       "#ef4444",
};

// Pillar identity colors
const PILLAR_COLOR: Record<Pillar, string> = {
  emotional:  "#059669",
  resilience: "#3b82f6",
  recovery:   "#8b5cf6",
  support:    "#06b6d4",
};

const PILLAR_BG: Record<Pillar, string> = {
  emotional:  "#f0fdf4",
  resilience: "#eff6ff",
  recovery:   "#f5f3ff",
  support:    "#ecfeff",
};

const PILLAR_ICON: Record<Pillar, React.ReactNode> = {
  emotional:  <Heart  className="h-4 w-4" />,
  resilience: <Zap    className="h-4 w-4" />,
  recovery:   <Shield className="h-4 w-4" />,
  support:    <Users  className="h-4 w-4" />,
};

// Risk level colors (semantic)
const LEVEL_COLOR: Record<PillarLevel, string> = {
  stable:   "#10b981",
  moderate: "#f59e0b",
  elevated: "#8b5cf6",
  high:     "#ef4444",
};
const LEVEL_LABEL: Record<PillarLevel, string> = {
  stable: "Stable", moderate: "Moderate", elevated: "Elevated", high: "High Concern",
};

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];
const PILLAR_COL: Record<Pillar, string> = {
  emotional: "emotional_score", resilience: "resilience_score",
  recovery:  "recovery_score",  support:    "support_score",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type PillarDistribution = Record<PillarLevel, number>;

interface PillarTrend {
  this_week_avg:     number;
  last_week_avg:     number;
  month_avg:         number;
  weekly_change_pct: number;
  direction:         "up" | "down" | "flat";
}

interface AggregateData {
  checkin_rate:       number;
  pillar_averages:    PillarScores;
  pillar_trends:      Record<Pillar, PillarTrend>;
  distribution:       Record<Pillar, PillarDistribution>;
  athlete_count:      number;
  checkins_this_week: number;
}

// ─── Demo data ─────────────────────────────────────────────────────────────────
const DEMO: AggregateData = {
  checkin_rate: 83, athlete_count: 18, checkins_this_week: 15,
  pillar_averages: { emotional: 6.4, resilience: 7.1, recovery: 5.8, support: 6.9 },
  pillar_trends: {
    emotional:  { this_week_avg:6.4, last_week_avg:5.9, month_avg:6.2, weekly_change_pct:8.5,  direction:"up"   },
    resilience: { this_week_avg:7.1, last_week_avg:7.2, month_avg:7.0, weekly_change_pct:-1.4, direction:"flat" },
    recovery:   { this_week_avg:5.8, last_week_avg:6.3, month_avg:6.0, weekly_change_pct:-7.9, direction:"down" },
    support:    { this_week_avg:6.9, last_week_avg:6.5, month_avg:6.7, weekly_change_pct:6.2,  direction:"up"   },
  },
  distribution: {
    emotional:  { stable:11, moderate:4, elevated:2, high:1 },
    resilience: { stable:13, moderate:3, elevated:2, high:0 },
    recovery:   { stable:8,  moderate:5, elevated:4, high:1 },
    support:    { stable:12, moderate:4, elevated:2, high:0 },
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function pillarAvg(rows: Record<string, number>[], p: Pillar) {
  const vals = rows.map(c => c[PILLAR_COL[p]]).filter(v => v != null);
  return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
}
function changePct(cur: number, prev: number) {
  if (!prev) return 0;
  return parseFloat((((cur - prev) / prev) * 100).toFixed(1));
}
function trendDir(pct: number): "up" | "down" | "flat" {
  return pct > 3 ? "up" : pct < -3 ? "down" : "flat";
}

// ─── Trend badge ───────────────────────────────────────────────────────────────
function TrendBadge({ pct, direction }: { pct: number; direction: "up" | "down" | "flat" }) {
  if (direction === "up") return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ color: "#059669", background: "rgba(5,150,105,0.1)" }}
    >
      <TrendingUp className="h-3 w-3" />+{Math.abs(pct)}%
    </span>
  );
  if (direction === "down") return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ color: T.red, background: "rgba(239,68,68,0.1)" }}
    >
      <TrendingDown className="h-3 w-3" />−{Math.abs(pct)}%
    </span>
  );
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color: T.textMuted, background: T.borderSub }}
    >
      <Minus className="h-3 w-3" />Flat
    </span>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function CoachDashboard() {
  const [profile, setProfile]   = useState<{ full_name: string } | null>(null);
  const [teamName, setTeamName] = useState("");
  const [data, setData]         = useState<AggregateData | null>(null);
  const [noTeam, setNoTeam]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [isDemo, setIsDemo]     = useState(false);

  async function load() {
    setLoading(true); setError(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase.from("profiles").select("full_name, team_id").eq("auth_user_id", user.id).single();
      if (prof) {
        setProfile({ full_name: prof.full_name });
        if (prof.team_id) {
          const { data: team } = await supabase.from("teams").select("name").eq("id", prof.team_id).single();
          if (team) setTeamName(team.name);
        }
      }
      const { data: prof2 } = await supabase.from("profiles").select("id, team_id").eq("auth_user_id", user.id).single();
      if (!prof2?.team_id) { setNoTeam(true); setLoading(false); return; }

      const { data: athletes } = await supabase.from("profiles").select("id").eq("team_id", prof2.team_id).eq("role", "athlete");
      const athleteCount = (athletes ?? []).length;

      if (athleteCount < 5) { setData(DEMO); setIsDemo(true); setLoading(false); return; }

      const athleteIds = (athletes ?? []).map((a: { id: string }) => a.id);
      const cutoff = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString();
      const { data: allCheckins } = await supabase
        .from("checkins")
        .select("id, athlete_id, emotional_score, resilience_score, recovery_score, support_score, completed_at")
        .in("athlete_id", athleteIds).eq("mode", "weekly").gte("completed_at", cutoff)
        .order("completed_at", { ascending: false });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (allCheckins ?? []) as any[];
      const now  = Date.now();
      const inW  = (iso: string, from: number, to: number) => { const t = new Date(iso).getTime(); return t >= from && t < to; };

      const thisWeek  = rows.filter(c => inW(c.completed_at, now - 7*86400000, now));
      const lastWeek  = rows.filter(c => inW(c.completed_at, now - 14*86400000, now - 7*86400000));
      const thisMonth = rows.filter(c => inW(c.completed_at, now - 28*86400000, now));

      const seen = new Set<string>();
      const recent: typeof rows = [];
      for (const c of rows) { if (!seen.has(c.athlete_id)) { seen.add(c.athlete_id); recent.push(c); } }

      const pillar_averages: PillarScores = { emotional:5, resilience:5, recovery:5, support:5 };
      const pillar_trends = {} as Record<Pillar, PillarTrend>;
      const dist: Record<Pillar, Record<PillarLevel, number>> = {
        emotional:{stable:0,moderate:0,elevated:0,high:0}, resilience:{stable:0,moderate:0,elevated:0,high:0},
        recovery:{stable:0,moderate:0,elevated:0,high:0},  support:{stable:0,moderate:0,elevated:0,high:0},
      };

      for (const p of PILLARS) {
        const cur = pillarAvg(recent as Record<string, number>[], p);
        const tw  = pillarAvg(thisWeek  as Record<string, number>[], p);
        const lw  = pillarAvg(lastWeek  as Record<string, number>[], p);
        const tm  = pillarAvg(thisMonth as Record<string, number>[], p);
        const wkP = changePct(tw, lw);
        pillar_averages[p] = cur || tw || tm || 5;
        pillar_trends[p]   = { this_week_avg:tw, last_week_avg:lw, month_avg:tm, weekly_change_pct:wkP, direction:trendDir(wkP) };
        const col = PILLAR_COL[p];
        for (const c of recent) dist[p][scoreToPillarLevel(c[col] ?? 5)]++;
      }

      setData({
        checkin_rate: Math.round((recent.length / athleteCount) * 100),
        pillar_averages, pillar_trends, distribution: dist,
        athlete_count: athleteCount, checkins_this_week: thisWeek.length,
      });
      setIsDemo(false);
    } catch { setError(true); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <DashboardLayout role="coach" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.green }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-3xl p-10 text-center"
          style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <p className="mb-3 text-[14px]" style={{ color: T.textMuted }}>Couldn&apos;t load team data.</p>
          <button onClick={load} className="text-[13px] font-semibold" style={{ color: T.green }}>Retry</button>
        </div>
      </div>
    </DashboardLayout>
  );

  if (noTeam) return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-4xl mx-auto">
        <div
          className="rounded-3xl p-16 text-center"
          style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <div
            className="h-16 w-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
            style={{ background: T.raised }}
          >
            <Users className="h-8 w-8" style={{ color: "#cbd5e1" }} />
          </div>
          <p className="font-bold mb-1" style={{ color: T.textSub }}>Not assigned to a team yet</p>
          <p className="text-[13px] max-w-sm mx-auto" style={{ color: T.textMuted }}>
            Contact your administrator to be linked to a roster.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between animate-fade-in">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>Team Dashboard</h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>
              {teamName ? `${teamName} · ` : ""}Aggregate wellness · anonymized
            </p>
          </div>
          {isDemo && (
            <span
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0"
              style={{ background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
            >
              DEMO DATA
            </span>
          )}
        </div>

        {/* Demo notice */}
        {isDemo && (
          <div
            className="rounded-2xl px-4 py-3 text-[12px] animate-fade-in"
            style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" }}
          >
            Sample data shown — at least 5 athletes must check in before real team trends are visible. This protects individual privacy.
          </div>
        )}

        {data && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
              {/* Athletes */}
              <div
                className="rounded-3xl p-5"
                style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                       style={{ background: "#eff6ff" }}>
                    <Users className="h-5 w-5" style={{ color: "#3b82f6" }} />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>Athletes</p>
                </div>
                <p className="text-[38px] font-bold tabular-nums leading-none" style={{ color: T.text }}>
                  {data.athlete_count}
                </p>
              </div>

              {/* Check-In Rate */}
              <div
                className="rounded-3xl p-5"
                style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                       style={{ background: "#d1fae5" }}>
                    <ClipboardCheck className="h-5 w-5" style={{ color: T.green }} />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>Check-In Rate</p>
                </div>
                <p className="text-[38px] font-bold tabular-nums leading-none" style={{ color: T.text }}>
                  {data.checkin_rate}%
                </p>
                <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: T.borderSub }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${data.checkin_rate}%`,
                      background: "linear-gradient(to right, #065f46, #10b981)",
                      transition: "width 1s ease",
                    }}
                  />
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: T.textMuted }}>
                  {data.checkins_this_week} of {data.athlete_count} this week
                </p>
              </div>
            </div>

            {/* Pillar cards */}
            <div className="grid grid-cols-2 gap-3">
              {PILLARS.map((pillar, i) => {
                const avg   = data.pillar_averages[pillar];
                const trnd  = data.pillar_trends[pillar];
                const pct   = Math.round((avg / 10) * 100);
                const col   = PILLAR_COLOR[pillar];
                return (
                  <div
                    key={pillar}
                    className="rounded-3xl p-4 animate-fade-in-up"
                    style={{
                      background: T.surface,
                      border: `1px solid ${T.border}`,
                      borderTop: `3px solid ${col}`,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      animationDelay: `${i * 60}ms`,
                    }}
                  >
                    {/* Pillar header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5" style={{ color: col }}>
                        {PILLAR_ICON[pillar]}
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
                          {PILLAR_LABELS[pillar]}
                        </span>
                      </div>
                      <TrendBadge pct={Math.abs(trnd.weekly_change_pct)} direction={trnd.direction} />
                    </div>

                    {/* Score */}
                    <p className="text-[36px] font-bold leading-none mb-2 tabular-nums" style={{ color: T.text }}>
                      {avg.toFixed(1)}
                    </p>

                    {/* Progress bar */}
                    <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: T.borderSub }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: col, transition: "width 1s ease" }}
                      />
                    </div>

                    {/* This wk / Last wk / 30d */}
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      {[
                        { label: "This wk", val: trnd.this_week_avg },
                        { label: "Last wk", val: trnd.last_week_avg },
                        { label: "30d avg", val: trnd.month_avg },
                      ].map(({ label, val }) => (
                        <div
                          key={label}
                          className="rounded-xl py-1.5 px-1"
                          style={{ background: PILLAR_BG[pillar] }}
                        >
                          <p className="text-[9px] uppercase tracking-wide leading-tight" style={{ color: T.textMuted }}>{label}</p>
                          <p className="text-[12px] font-bold tabular-nums" style={{ color: col }}>
                            {val > 0 ? val.toFixed(1) : "–"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Distribution */}
            <div
              className="rounded-3xl p-5 animate-fade-in"
              style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
            >
              <p className="text-[14px] font-bold mb-0.5" style={{ color: T.textSub }}>Pillar Distribution</p>
              <p className="text-[12px] mb-5" style={{ color: T.textMuted }}>
                Current status per athlete · most recent check-in
              </p>
              <div className="space-y-5">
                {PILLARS.map(pillar => {
                  const dist  = data.distribution[pillar];
                  const total = Object.values(dist).reduce((a, b) => a + b, 0);
                  if (total === 0) return null;
                  const levels: PillarLevel[] = ["stable", "moderate", "elevated", "high"];
                  return (
                    <div key={pillar}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5" style={{ color: PILLAR_COLOR[pillar] }}>
                          {PILLAR_ICON[pillar]}
                          <span className="text-[12px] font-semibold">{PILLAR_LABELS[pillar]}</span>
                        </div>
                        <span className="text-[11px]" style={{ color: T.textMuted }}>{total} athletes</span>
                      </div>
                      {/* Stacked bar */}
                      <div className="flex h-3 rounded-xl overflow-hidden gap-[2px] mb-2">
                        {levels.filter(l => dist[l] > 0).map(l => (
                          <div
                            key={l}
                            title={`${LEVEL_LABEL[l]}: ${dist[l]}`}
                            style={{
                              width: `${(dist[l] / total) * 100}%`,
                              background: LEVEL_COLOR[l],
                              transition: "width 0.8s ease",
                            }}
                          />
                        ))}
                      </div>
                      {/* Legend */}
                      <div className="flex gap-3 flex-wrap">
                        {levels.filter(l => dist[l] > 0).map(l => (
                          <div key={l} className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full" style={{ background: LEVEL_COLOR[l] }} />
                            <span className="text-[10px]" style={{ color: T.textMuted }}>
                              {LEVEL_LABEL[l]} {dist[l]} ({Math.round((dist[l] / total) * 100)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Privacy footer */}
            <div
              className="rounded-2xl px-5 py-4"
              style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
            >
              <p className="text-[12px] text-center leading-relaxed" style={{ color: "#065f46" }}>
                All data is aggregated and anonymized. Individual responses are never visible to coaches.
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
