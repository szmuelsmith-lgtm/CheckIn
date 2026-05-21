"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Pillar } from "@/types/database";
import { Activity, Lock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

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

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

const PILLAR_COLOR: Record<Pillar, string> = {
  emotional:  "#059669",
  resilience: "#2563eb",
  recovery:   "#7c3aed",
  support:    "#d97706",
};

interface WeeklyPulse {
  weekLabel: string;
  emotional: number | null;
  resilience: number | null;
  recovery: number | null;
  support: number | null;
  checkinCount: number;
  totalAthletes: number;
}

function PulseChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl p-3 text-[12px]"
         style={{ background:"#ffffff", border:"1px solid #e8edf2", boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>
      <p className="font-semibold mb-1.5" style={{ color:T.textSub }}>Week of {label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-0.5">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span style={{ color: T.textMuted }}>{entry.name}</span>
          </div>
          <span className="font-bold tabular-nums" style={{ color: entry.color }}>
            {entry.value ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

function TrendIndicator({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null || previous === null) return <Minus className="h-3.5 w-3.5" style={{ color: "#cbd5e1" }} />;
  const diff = current - previous;
  if (Math.abs(diff) < 0.3) return <Minus className="h-3.5 w-3.5" style={{ color: T.textMuted }} />;
  return diff > 0
    ? <TrendingUp  className="h-3.5 w-3.5" style={{ color: T.green }} />
    : <TrendingDown className="h-3.5 w-3.5" style={{ color: "#dc2626" }} />;
}

export default function CoachTeamPulsePage() {
  const [profile, setProfile]             = useState<{ full_name: string; team_id: string | null } | null>(null);
  const [teamName, setTeamName]           = useState("");
  const [weeks, setWeeks]                 = useState<WeeklyPulse[]>([]);
  const [totalAthletes, setTotalAthletes] = useState(0);
  const [loading, setLoading]             = useState(true);
  const [insufficientData, setInsufficientData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoadError(null);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof, error: profError } = await supabase
        .from("profiles")
        .select("id, full_name, team_id")
        .eq("auth_user_id", user.id)
        .single();
      if (profError || !prof) { setLoadError("Failed to load your profile. Please try again."); setLoading(false); return; }
      setProfile(prof);

      if (prof.team_id) {
        const { data: team } = await supabase.from("teams").select("name").eq("id", prof.team_id).single();
        if (team) setTeamName(team.name);
      }

      // Route all checkin data through the server-side team-pulse API.
      // Coaches have no direct RLS SELECT on checkins — the API enforces
      // k-anonymity and returns only pre-aggregated weekly buckets.
      const res = await fetch("/api/coach/team-pulse", { method: "POST" });
      if (!res.ok) { setLoadError("Failed to load team data. Please try again."); setLoading(false); return; }

      const json = await res.json() as {
        weeks?: WeeklyPulse[];
        total_athletes?: number;
        insufficient_data?: boolean;
        athlete_count?: number;
        no_team?: boolean;
      };

      if (json.insufficient_data) {
        setTotalAthletes(json.athlete_count ?? 0);
        setInsufficientData(true);
        setLoading(false);
        return;
      }

      setTotalAthletes(json.total_athletes ?? 0);
      setWeeks(json.weeks ?? []);
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <DashboardLayout role="coach" userName="...">
        <div className="flex items-center justify-center h-64">
          <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.green }} />
        </div>
      </DashboardLayout>
    );
  }

  const thStyle: React.CSSProperties = {
    padding: "10px 12px", fontSize: 11, fontWeight: 600,
    textTransform: "uppercase" as const, letterSpacing: "0.05em",
    color: T.textMuted, borderBottom: `1px solid ${T.borderSub}`,
  };

  return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>Team Pulse</h1>
          <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>
            {teamName ? `${teamName} — ` : ""}{totalAthletes} athletes · 8-week rolling view
          </p>
        </div>

        {loadError ? (
          <div className="rounded-3xl p-14 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p className="text-[15px] font-semibold mb-2" style={{ color: "#dc2626" }}>{loadError}</p>
            <button onClick={() => { setLoading(true); }} className="text-[13px] font-semibold" style={{ color: T.green }}>Retry</button>
          </div>
        ) : insufficientData ? (
          <div className="rounded-3xl p-14 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Lock className="h-10 w-10 mx-auto mb-4" style={{ color: "#cbd5e1" }} />
            <h2 className="text-[16px] font-semibold mb-2" style={{ color: T.text }}>Not enough data to display</h2>
            <p className="text-[13px] max-w-sm mx-auto" style={{ color: T.textMuted }}>
              At least 5 athletes must be on your roster before aggregate data is shown. This protects individual athlete privacy.
            </p>
          </div>
        ) : weeks.length === 0 ? (
          <div className="rounded-3xl p-14 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Activity className="h-10 w-10 mx-auto mb-4" style={{ color: "#cbd5e1" }} />
            <h2 className="text-[16px] font-semibold mb-2" style={{ color: T.text }}>No data yet</h2>
            <p className="text-[13px]" style={{ color: T.textMuted }}>Team pulse data will appear once athletes start checking in.</p>
          </div>
        ) : (
          <>
            {/* 8-week pillar chart */}
            <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                <p className="text-[14px] font-semibold" style={{ color: T.textSub }}>8-week pillar trend</p>
              </div>
              <div className="px-4 pt-4 pb-1">
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeks} margin={{ top: 5, right: 8, left: -22, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="weekLabel" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={{ stroke: "#e8edf2" }} />
                      <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <ReferenceLine y={5} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1} />
                      <Tooltip content={<PulseChartTooltip />} />
                      {PILLARS.map(p => (
                        <Line key={p} type="monotone" dataKey={p}
                              stroke={PILLAR_COLOR[p]} strokeWidth={2.5}
                              dot={{ r: 4, fill: PILLAR_COLOR[p], strokeWidth: 0 }}
                              activeDot={{ r: 6, strokeWidth: 0 }}
                              connectNulls
                              name={PILLAR_LABELS[p]} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 mb-3">
                  {PILLARS.map(p => (
                    <div key={p} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: PILLAR_COLOR[p] }} />
                      <span className="text-[11px] font-medium" style={{ color: T.textSub }}>{PILLAR_LABELS[p]}</span>
                    </div>
                  ))}
                  <span className="text-[11px] ml-auto" style={{ color: T.textMuted }}>Shown when 5+ athletes checked in</span>
                </div>
              </div>
            </div>

            {/* Weekly table */}
            <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                <p className="text-[14px] font-semibold" style={{ color: T.textSub }}>Weekly Team Averages</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, textAlign: "left" }}>Week</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Participation</th>
                      {PILLARS.map(p => (
                        <th key={p} style={{ ...thStyle, textAlign: "center", color: PILLAR_COLOR[p] }}>
                          {PILLAR_LABELS[p]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((week, idx) => {
                      const prev = idx > 0 ? weeks[idx - 1] : null;
                      const participation = Math.round((week.checkinCount / week.totalAthletes) * 100);
                      return (
                        <tr key={week.weekLabel} style={{ borderTop: idx > 0 ? `1px solid ${T.borderSub}` : undefined }}>
                          <td className="py-3 px-3 font-semibold" style={{ color: T.text }}>{week.weekLabel}</td>
                          <td className="py-3 px-3 text-center">
                            <span style={{ color: T.textSub }}>{participation}%</span>
                            <span className="text-[11px] ml-1" style={{ color: T.textMuted }}>({week.checkinCount}/{week.totalAthletes})</span>
                          </td>
                          {PILLARS.map(p => (
                            <td key={p} className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-semibold" style={{ color: T.text }}>{week[p] ?? "—"}</span>
                                <TrendIndicator current={week[p]} previous={prev?.[p] ?? null} />
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Legend */}
            <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <h3 className="text-[13px] font-semibold mb-3" style={{ color: T.text }}>Reading your team pulse</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { pillar: "emotional"  as Pillar, desc: "How athletes are feeling overall. Sustained lows may signal burnout." },
                  { pillar: "resilience" as Pillar, desc: "Ability to handle stress. Watch for dips around competition." },
                  { pillar: "recovery"   as Pillar, desc: "Sleep and physical rest. Low scores hurt performance." },
                  { pillar: "support"    as Pillar, desc: "Feeling connected. Low scores may indicate isolation." },
                ].map(({ pillar, desc }) => (
                  <div key={pillar} className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full mt-1 shrink-0" style={{ background: PILLAR_COLOR[pillar] }} />
                    <p className="text-[13px]" style={{ color: T.textSub }}>
                      <strong style={{ color: T.text }}>{PILLAR_LABELS[pillar]}</strong> — {desc}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] mt-3" style={{ color: T.textMuted }}>Scores shown only when 5+ athletes checked in that week.</p>
            </div>

            {/* Privacy notice */}
            <div className="rounded-2xl px-5 py-4 flex items-start gap-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <Lock className="h-4 w-4 shrink-0 mt-0.5" style={{ color: T.green }} />
              <div>
                <p className="text-[13px] font-semibold mb-0.5" style={{ color: T.greenDeep }}>Individual data is protected</p>
                <p className="text-[12px]" style={{ color: "#047857" }}>
                  All numbers are team-level averages. You cannot see individual athlete scores. Athletes needing support are connected with qualified counselors through the platform&apos;s alert system.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
