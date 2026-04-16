"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS, scoreToPillarLevel } from "@/lib/pillar-scoring";
import type { Pillar, PillarScores } from "@/types/database";
import type { PillarLevel } from "@/lib/pillar-scoring";
import { ClipboardCheck, Users, TrendingUp, TrendingDown, Minus } from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const OB = {
  bg:        "#f8fafc",
  surface:   "#ffffff",
  raised:    "#f8fafc",
  border:    "#e2e8f0",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#047857",
  red:       "#dc2626",
};

const PILLAR_TOP: Record<Pillar, string> = {
  emotional:  "#059669",
  resilience: "#2563eb",
  recovery:   "#7c3aed",
  support:    "#0891b2",
};

const PILLAR_BG: Record<Pillar, string> = {
  emotional:  "#f0fdf4",
  resilience: "#eff6ff",
  recovery:   "#f5f3ff",
  support:    "#ecfeff",
};

const LEVEL_HEX: Record<PillarLevel, string> = {
  stable:   "#059669",  // green
  moderate: "#eab308",  // yellow
  elevated: "#8b5cf6",  // violet
  high:     "#dc2626",  // red
};

const LEVEL_LABELS: Record<PillarLevel, string> = {
  stable: "Stable", moderate: "Moderate", elevated: "Elevated", high: "High Concern",
};

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];
const PILLAR_COLS: Record<Pillar, string> = {
  emotional: "emotional_score", resilience: "resilience_score",
  recovery:  "recovery_score",  support:    "support_score",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type PillarDistribution = Record<PillarLevel, number>;

interface PillarTrend {
  this_week_avg:     number;
  last_week_avg:     number;
  month_avg:         number;
  weekly_change_pct: number;
  direction:         "up" | "down" | "flat";
}

interface AggregateData {
  checkin_rate:    number;
  pillar_averages: PillarScores;
  pillar_trends:   Record<Pillar, PillarTrend>;
  distribution:    Record<Pillar, PillarDistribution>;
  athlete_count:   number;
  checkins_this_week: number;
}

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_DATA: AggregateData = {
  checkin_rate:       83,
  athlete_count:      18,
  checkins_this_week: 15,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pillarAvg(rows: Record<string, number>[], p: Pillar) {
  const vals = rows.map(c => c[PILLAR_COLS[p]]).filter(v => v != null);
  return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
}
function changePct(cur: number, prev: number) {
  if (!prev) return 0;
  return parseFloat((((cur - prev) / prev) * 100).toFixed(1));
}
function trendDir(pct: number): "up" | "down" | "flat" {
  return pct > 3 ? "up" : pct < -3 ? "down" : "flat";
}

function TrendBadge({ pct, direction }: { pct: number; direction: "up" | "down" | "flat" }) {
  if (direction === "up") return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ color: "#059669", background: "rgba(5,150,105,0.1)" }}>
      <TrendingUp className="h-3 w-3" />+{Math.abs(pct)}%
    </span>
  );
  if (direction === "down") return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ color: OB.red, background: "rgba(220,38,38,0.1)" }}>
      <TrendingDown className="h-3 w-3" />−{Math.abs(pct)}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ color: OB.textMuted, background: OB.borderSub }}>
      <Minus className="h-3 w-3" />Flat
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
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

      if (athleteCount < 5) {
        setData(DEMO_DATA); setIsDemo(true); setLoading(false); return;
      }

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

      const thisWeek   = rows.filter(c => inW(c.completed_at, now - 7*86400000, now));
      const lastWeek   = rows.filter(c => inW(c.completed_at, now - 14*86400000, now - 7*86400000));
      const thisMonth  = rows.filter(c => inW(c.completed_at, now - 28*86400000, now));

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
        const col = PILLAR_COLS[p];
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
        <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: OB.border, borderTopColor: OB.green }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl p-10 text-center" style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
          <p className="mb-3 text-[14px]" style={{ color: OB.textMuted }}>Couldn&apos;t load team data.</p>
          <button onClick={load} className="text-[13px] font-medium" style={{ color: OB.green }}>Retry</button>
        </div>
      </div>
    </DashboardLayout>
  );

  if (noTeam) return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl p-16 text-center" style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
          <Users className="h-10 w-10 mx-auto mb-4" style={{ color: OB.textMuted }} />
          <p className="font-semibold mb-1" style={{ color: OB.textSub }}>Not assigned to a team yet</p>
          <p className="text-[13px] max-w-sm mx-auto" style={{ color: OB.textMuted }}>Contact your administrator to be linked to a roster.</p>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: OB.text }}>Team Dashboard</h1>
            <p className="text-[13px] mt-0.5" style={{ color: OB.textMuted }}>
              {teamName ? `${teamName} · ` : ""}Aggregate wellness · anonymized
            </p>
          </div>
          {isDemo && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
                 style={{ background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
              DEMO DATA
            </div>
          )}
        </div>

        {/* Demo notice */}
        {isDemo && (
          <div className="rounded-xl px-4 py-3 text-[12px]" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" }}>
            Sample data shown — at least 5 athletes must check in before real team trends are visible. This protects individual privacy.
          </div>
        )}

        {/* Stat cards */}
        {data && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-5" style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#dbeafe" }}>
                    <Users className="h-4 w-4" style={{ color: "#2563eb" }} />
                  </div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: OB.textMuted }}>Athletes</p>
                </div>
                <p className="text-[34px] font-bold tabular-nums leading-none" style={{ color: OB.text }}>{data.athlete_count}</p>
              </div>

              <div className="rounded-2xl p-5" style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#d1fae5" }}>
                    <ClipboardCheck className="h-4 w-4" style={{ color: OB.green }} />
                  </div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: OB.textMuted }}>Check-In Rate</p>
                </div>
                <p className="text-[34px] font-bold tabular-nums leading-none" style={{ color: OB.text }}>{data.checkin_rate}%</p>
                <div className="mt-3 h-[2px] rounded-full overflow-hidden" style={{ background: OB.borderSub }}>
                  <div className="h-full rounded-full" style={{ width: `${data.checkin_rate}%`, background: `linear-gradient(to right,#065f46,${OB.green})` }} />
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: OB.textMuted }}>{data.checkins_this_week} of {data.athlete_count} this week</p>
              </div>
            </div>

            {/* Pillar cards */}
            <div className="grid grid-cols-2 gap-3">
              {PILLARS.map(pillar => {
                const avg   = data.pillar_averages[pillar];
                const trend = data.pillar_trends[pillar];
                const pct   = Math.round((avg / 10) * 100);
                return (
                  <div key={pillar} className="rounded-2xl p-4"
                       style={{ background: OB.surface, border: `1px solid ${OB.border}`, borderTop: `3px solid ${PILLAR_TOP[pillar]}` }}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: OB.textMuted }}>
                        {PILLAR_LABELS[pillar]}
                      </p>
                      <TrendBadge pct={Math.abs(trend.weekly_change_pct)} direction={trend.direction} />
                    </div>
                    <p className="text-[34px] font-bold leading-none mb-2 tabular-nums" style={{ color: OB.text }}>{avg.toFixed(1)}</p>
                    <div className="h-[2px] rounded-full overflow-hidden mb-3" style={{ background: OB.borderSub }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PILLAR_TOP[pillar] }} />
                    </div>
                    {/* This week / last week / 30d */}
                    <div className="grid grid-cols-3 gap-1 text-center">
                      {[
                        { label: "This wk", val: trend.this_week_avg },
                        { label: "Last wk", val: trend.last_week_avg },
                        { label: "30d avg", val: trend.month_avg },
                      ].map(({ label, val }) => (
                        <div key={label} className="rounded-lg py-1.5 px-1" style={{ background: PILLAR_BG[pillar] }}>
                          <p className="text-[10px] uppercase tracking-wide leading-tight" style={{ color: OB.textMuted }}>{label}</p>
                          <p className="text-[12px] font-bold tabular-nums" style={{ color: PILLAR_TOP[pillar] }}>{val > 0 ? val.toFixed(1) : "–"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Distribution — stacked bar per pillar */}
            <div className="rounded-2xl p-5" style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
              <p className="text-[13px] font-semibold mb-1" style={{ color: OB.textSub }}>Pillar Distribution</p>
              <p className="text-[11px] mb-4" style={{ color: OB.textMuted }}>Current status per athlete · most recent check-in</p>
              <div className="space-y-4">
                {PILLARS.map(pillar => {
                  const dist  = data.distribution[pillar];
                  const total = Object.values(dist).reduce((a, b) => a + b, 0);
                  if (total === 0) return null;
                  const levels: PillarLevel[] = ["stable", "moderate", "elevated", "high"];
                  return (
                    <div key={pillar}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-semibold" style={{ color: PILLAR_TOP[pillar] }}>{PILLAR_LABELS[pillar]}</p>
                        <p className="text-[10px]" style={{ color: OB.textMuted }}>{total} athletes</p>
                      </div>
                      {/* Stacked bar */}
                      <div className="flex h-5 rounded-lg overflow-hidden gap-[2px] mb-1.5" style={{ background: "#ffffff" }}>
                        {levels.filter(l => dist[l] > 0).map(l => (
                          <div key={l} style={{ width: `${(dist[l] / total) * 100}%`, background: LEVEL_HEX[l] }}
                               title={`${LEVEL_LABELS[l]}: ${dist[l]}`} />
                        ))}
                      </div>
                      {/* Inline legend */}
                      <div className="flex gap-3 flex-wrap">
                        {levels.filter(l => dist[l] > 0).map(l => (
                          <div key={l} className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full" style={{ background: LEVEL_HEX[l] }} />
                            <span className="text-[10px]" style={{ color: OB.textMuted }}>
                              {LEVEL_LABELS[l]} {dist[l]} ({Math.round((dist[l] / total) * 100)}%)
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
            <div className="rounded-2xl p-4 text-center" style={{ background: OB.raised, border: `1px solid ${OB.border}` }}>
              <p className="text-[11px]" style={{ color: OB.textMuted }}>
                All data is aggregated and anonymized. Individual responses are never visible to coaches.
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
