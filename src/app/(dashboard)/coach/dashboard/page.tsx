"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import type { Pillar, PillarScores } from "@/types/database";
import type { PillarLevel } from "@/lib/pillar-scoring";
import { ClipboardCheck, Users, TrendingUp, TrendingDown, Minus, Heart, Zap, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:         "#f8fafc",
  surface:    "#ffffff",
  raised:     "#f8fafc",
  border:     "#e8edf2",
  borderSub:  "#f1f5f9",
  text:       "#0f172a",
  textSub:    "#334155",
  textMuted:  "#64748b",
  green:      "#16a34a",
  greenLight: "#f0fdf4",
  greenDeep:  "#065f46",
  amber:      "#d97706",
  amberLight: "#fefce8",
  red:        "#dc2626",
  redLight:   "#fef2f2",
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

const PILLAR_ICON: Record<Pillar, React.ReactNode> = {
  emotional:  <Heart  className="h-3.5 w-3.5" />,
  resilience: <Zap    className="h-3.5 w-3.5" />,
  recovery:   <Shield className="h-3.5 w-3.5" />,
  support:    <Users  className="h-3.5 w-3.5" />,
};

const PILLAR_LABEL: Record<Pillar, string> = {
  emotional:  "Emotional",
  resilience: "Resilience",
  recovery:   "Recovery",
  support:    "Support",
};

const LEVEL_DOT: Record<PillarLevel, string> = {
  stable:   "#16a34a",
  moderate: "#d97706",
  elevated: "#f97316",
  high:     "#dc2626",
};

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];
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

// ─── Traffic light grid ───────────────────────────────────────────────────────
function TrafficLightGrid({ dist }: { dist: PillarDistribution }) {
  const dots: PillarLevel[] = [
    ...Array<PillarLevel>(dist.stable).fill("stable"),
    ...Array<PillarLevel>(dist.moderate).fill("moderate"),
    ...Array<PillarLevel>(dist.elevated).fill("elevated"),
    ...Array<PillarLevel>(dist.high).fill("high"),
  ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {dots.map((level, i) => (
        <div key={i} className="h-3 w-3 rounded-full"
             style={{ background: LEVEL_DOT[level], opacity: 0.85 }} />
      ))}
    </div>
  );
}

// ─── Trend badge ──────────────────────────────────────────────────────────────
function TrendBadge({ pct, direction }: { pct: number; direction: "up" | "down" | "flat" }) {
  if (direction === "up") return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ color: T.green, background: "#dcfce7" }}>
      <TrendingUp className="h-3 w-3" />+{Math.abs(pct).toFixed(1)}%
    </span>
  );
  if (direction === "down") return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ color: T.red, background: T.redLight }}>
      <TrendingDown className="h-3 w-3" />−{Math.abs(pct).toFixed(1)}%
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ color: T.textMuted, background: T.borderSub }}>
      <Minus className="h-3 w-3" />Flat
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CoachDashboard() {
  const [profile,  setProfile]  = useState<{ full_name: string } | null>(null);
  const [teamName, setTeamName] = useState("");
  const [data,     setData]     = useState<AggregateData | null>(null);
  const [noTeam,   setNoTeam]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [isDemo,   setIsDemo]   = useState(false);

  async function load() {
    setLoading(true); setError(false);
    try {
      const supabase = createClient();
      const { data: prof } = await supabase
        .from("profiles").select("full_name, team_id")
        .eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id ?? "").single();

      if (prof) {
        setProfile({ full_name: prof.full_name });
        if (prof.team_id) {
          const { data: team } = await supabase.from("teams").select("name").eq("id", prof.team_id).single();
          if (team) setTeamName(team.name);
        }
      }

      const res  = await fetch("/api/coach/aggregate", { method: "POST" });
      const json = await res.json() as AggregateData & { insufficient_data?: boolean; no_team?: boolean };

      if (json.no_team) { setNoTeam(true); return; }
      if (json.insufficient_data) { setData(DEMO); setIsDemo(true); return; }
      setData(json); setIsDemo(false);
    } catch { setError(true); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <DashboardLayout role="coach" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin"
             style={{ borderColor: T.border, borderTopColor: T.green }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl p-10 text-center"
             style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <p className="text-[14px] mb-3" style={{ color: T.textMuted }}>Couldn&apos;t load team data.</p>
          <button onClick={load} className="text-[13px] font-semibold" style={{ color: T.green }}>Retry</button>
        </div>
      </div>
    </DashboardLayout>
  );

  if (noTeam) return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl p-16 text-center"
             style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
               style={{ background: T.raised }}>
            <Users className="h-7 w-7" style={{ color: "#cbd5e1" }} />
          </div>
          <p className="font-bold mb-1.5" style={{ color: T.textSub }}>Not assigned to a team yet</p>
          <p className="text-[13px] max-w-sm mx-auto" style={{ color: T.textMuted }}>
            Contact your administrator to be linked to a roster.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );

  const dist  = data?.distribution.emotional ?? { stable: 0, moderate: 0, elevated: 0, high: 0 };
  const total = dist.stable + dist.moderate + dist.elevated + dist.high;
  const stableCount   = dist.stable;
  const concernCount  = dist.moderate + dist.elevated;
  const highCount     = dist.high;

  return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ color: T.text }}>Team Dashboard</h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>
              {teamName ? `${teamName} · ` : ""}Aggregate · anonymized
            </p>
          </div>
          {isDemo && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
              Demo
            </span>
          )}
        </div>

        {isDemo && (
          <div className="rounded-xl px-4 py-3 text-[12px]"
               style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" }}>
            Sample data shown — at least 5 athletes must check in before real trends appear. This protects individual privacy.
          </div>
        )}

        {data && (
          <>
            {/* ── Traffic light grid ──────────────────────────────────────── */}
            <div className="rounded-2xl p-5"
                 style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[14px] font-semibold" style={{ color: T.text }}>Team Wellness</p>
                <span className="text-[11px]" style={{ color: T.textMuted }}>
                  Based on emotional scores · {total} athletes
                </span>
              </div>

              <TrafficLightGrid dist={dist} />

              <div className="flex items-center gap-5 mt-4 flex-wrap">
                {stableCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_DOT.stable }} />
                    <span className="text-[12px] font-semibold" style={{ color: T.text }}>{stableCount}</span>
                    <span className="text-[12px]" style={{ color: T.textMuted }}>stable</span>
                  </div>
                )}
                {concernCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_DOT.moderate }} />
                    <span className="text-[12px] font-semibold" style={{ color: T.text }}>{concernCount}</span>
                    <span className="text-[12px]" style={{ color: T.textMuted }}>need attention</span>
                  </div>
                )}
                {highCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: LEVEL_DOT.high }} />
                    <span className="text-[12px] font-semibold" style={{ color: T.red }}>{highCount}</span>
                    <span className="text-[12px]" style={{ color: T.textMuted }}>high concern</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Stats row ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">

              {/* Athletes */}
              <div className="rounded-2xl p-4"
                   style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-3"
                     style={{ background: "#eff6ff" }}>
                  <Users className="h-4 w-4" style={{ color: "#3b82f6" }} />
                </div>
                <p className="text-[28px] font-bold tabular-nums leading-none" style={{ color: T.text }}>
                  {data.athlete_count}
                </p>
                <p className="text-[11px] mt-1 font-medium" style={{ color: T.textMuted }}>Athletes</p>
              </div>

              {/* Check-in rate */}
              <div className="rounded-2xl p-4"
                   style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-3"
                     style={{ background: T.greenLight }}>
                  <ClipboardCheck className="h-4 w-4" style={{ color: T.green }} />
                </div>
                <p className="text-[28px] font-bold tabular-nums leading-none" style={{ color: T.text }}>
                  {data.checkin_rate}%
                </p>
                <p className="text-[11px] mt-1 font-medium" style={{ color: T.textMuted }}>
                  {data.checkins_this_week}/{data.athlete_count} this week
                </p>
                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: T.borderSub }}>
                  <div className="h-full rounded-full" style={{ width: `${data.checkin_rate}%`, background: T.green, transition: "width 0.8s ease" }} />
                </div>
              </div>

              {/* Follow-up queue */}
              <Link href="/coach/followups"
                    className="rounded-2xl p-4 flex flex-col group hover:shadow-md transition-shadow"
                    style={{ background: `linear-gradient(135deg, #065f46, #059669)`, border: "1px solid #059669" }}>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-3"
                     style={{ background: "rgba(255,255,255,0.15)" }}>
                  <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-[15px] font-bold text-white leading-none">Follow-ups</p>
                <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>Review queue</p>
              </Link>
            </div>

            {/* ── Pillar rows ──────────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden"
                 style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
              <div className="px-5 py-3.5 flex items-center justify-between"
                   style={{ borderBottom: `1px solid ${T.border}` }}>
                <p className="text-[14px] font-semibold" style={{ color: T.text }}>Pillar Averages</p>
                <span className="text-[11px]" style={{ color: T.textMuted }}>This week vs last week</span>
              </div>
              <div className="divide-y" style={{ borderColor: T.borderSub }}>
                {PILLARS.map(pillar => {
                  const avg  = data.pillar_averages[pillar];
                  const trnd = data.pillar_trends[pillar];
                  const col  = PILLAR_COLOR[pillar];
                  const pct  = Math.round((avg / 10) * 100);
                  return (
                    <div key={pillar} className="px-5 py-3.5 flex items-center gap-4">

                      {/* Icon + label */}
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <span style={{ color: col }}>{PILLAR_ICON[pillar]}</span>
                        <span className="text-[12px] font-semibold" style={{ color: T.textSub }}>
                          {PILLAR_LABEL[pillar]}
                        </span>
                      </div>

                      {/* Score */}
                      <span className="text-[16px] font-bold tabular-nums w-10 shrink-0" style={{ color: T.text }}>
                        {avg.toFixed(1)}
                      </span>

                      {/* Bar */}
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: PILLAR_TRACK[pillar] }}>
                        <div className="h-full rounded-full transition-all duration-700"
                             style={{ width: `${pct}%`, background: col }} />
                      </div>

                      {/* Trend badge */}
                      <div className="w-20 shrink-0 flex justify-end">
                        <TrendBadge pct={Math.abs(trnd.weekly_change_pct)} direction={trnd.direction} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Privacy footer ────────────────────────────────────────────── */}
            <div className="rounded-xl px-4 py-3.5"
                 style={{ background: T.greenLight, border: "1px solid #bbf7d0" }}>
              <p className="text-[11px] text-center leading-relaxed" style={{ color: T.greenDeep }}>
                All data is aggregated and anonymized. Individual responses are never visible to coaches.
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
