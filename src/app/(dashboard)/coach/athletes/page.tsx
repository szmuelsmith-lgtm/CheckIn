"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Pillar } from "@/types/database";
import { Activity, Lock, TrendingUp, TrendingDown, Minus } from "lucide-react";

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
      const { data: prof, error: profError } = await supabase.from("profiles").select("id, full_name, team_id").eq("auth_user_id", user.id).single();
      if (profError || !prof) { setLoadError("Failed to load your profile. Please try again."); setLoading(false); return; }
      setProfile(prof);

      if (prof.team_id) {
        const { data: team } = await supabase.from("teams").select("name").eq("id", prof.team_id).single();
        if (team) setTeamName(team.name);
      }

      const { data: teamAthletes, error: teamErr } = await supabase.from("profiles").select("id").eq("team_id", prof.team_id).eq("role", "athlete");
      if (teamErr) { setLoadError("Failed to load team roster. Please try again."); setLoading(false); return; }
      if (!teamAthletes || teamAthletes.length === 0) { setLoading(false); return; }
      setTotalAthletes(teamAthletes.length);

      if (teamAthletes.length < 5) { setInsufficientData(true); setLoading(false); return; }

      const athleteIds = teamAthletes.map((a) => a.id);
      const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString();
      const { data: checkins } = await supabase
        .from("checkins")
        .select("athlete_id, emotional_score, resilience_score, recovery_score, support_score, completed_at")
        .in("athlete_id", athleteIds).gte("completed_at", eightWeeksAgo).order("completed_at", { ascending: true });

      if (!checkins || checkins.length === 0) { setLoading(false); return; }

      type WeekBucket = { emotional: number[]; resilience: number[]; recovery: number[]; support: number[]; athletes: Set<string>; };
      const weekMap = new Map<string, WeekBucket>();
      checkins.forEach((c) => {
        const date = new Date(c.completed_at);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        const weekKey = monday.toISOString().split("T")[0];
        if (!weekMap.has(weekKey)) weekMap.set(weekKey, { emotional: [], resilience: [], recovery: [], support: [], athletes: new Set() });
        const w = weekMap.get(weekKey)!;
        if (c.emotional_score  != null) w.emotional.push(c.emotional_score);
        if (c.resilience_score != null) w.resilience.push(c.resilience_score);
        if (c.recovery_score   != null) w.recovery.push(c.recovery_score);
        if (c.support_score    != null) w.support.push(c.support_score);
        w.athletes.add(c.athlete_id);
      });

      const avg = (arr: number[]) => arr.length >= 5 ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : null;
      const pulseWeeks: WeeklyPulse[] = Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekKey, data]) => {
          const d = new Date(weekKey);
          return { weekLabel: `${d.getMonth() + 1}/${d.getDate()}`, emotional: avg(data.emotional), resilience: avg(data.resilience), recovery: avg(data.recovery), support: avg(data.support), checkinCount: data.athletes.size, totalAthletes: teamAthletes.length };
        });

      setWeeks(pulseWeeks);
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
