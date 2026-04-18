"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Pillar } from "@/types/database";
import { Activity, Lock, TrendingUp, TrendingDown, Minus } from "lucide-react";

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

const PILLAR_COLORS: Record<Pillar, string> = {
  emotional:  "text-emerald-600",
  resilience: "text-blue-600",
  recovery:   "text-violet-600",
  support:    "text-amber-600",
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
  if (current === null || previous === null) return <Minus className="h-3.5 w-3.5 text-slate-300" />;
  const diff = current - previous;
  if (Math.abs(diff) < 0.3) return <Minus className="h-3.5 w-3.5 text-slate-400" />;
  return diff > 0
    ? <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
    : <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
}

export default function CoachTeamPulsePage() {
  const [profile, setProfile] = useState<{ full_name: string; team_id: string | null } | null>(null);
  const [teamName, setTeamName] = useState("");
  const [weeks, setWeeks] = useState<WeeklyPulse[]>([]);
  const [totalAthletes, setTotalAthletes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [insufficientData, setInsufficientData] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, team_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!prof) return;
      setProfile(prof);

      if (prof.team_id) {
        const { data: team } = await supabase
          .from("teams").select("name").eq("id", prof.team_id).single();
        if (team) setTeamName(team.name);
      }

      const { data: teamAthletes } = await supabase
        .from("profiles")
        .select("id")
        .eq("team_id", prof.team_id)
        .eq("role", "athlete");

      if (!teamAthletes || teamAthletes.length === 0) { setLoading(false); return; }
      setTotalAthletes(teamAthletes.length);

      // k-anonymity: require at least 5 athletes
      if (teamAthletes.length < 5) { setInsufficientData(true); setLoading(false); return; }

      const athleteIds = teamAthletes.map((a) => a.id);
      const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString();

      const { data: checkins } = await supabase
        .from("checkins")
        .select("athlete_id, emotional_score, resilience_score, recovery_score, support_score, completed_at")
        .in("athlete_id", athleteIds)
        .gte("completed_at", eightWeeksAgo)
        .order("completed_at", { ascending: true });

      if (!checkins || checkins.length === 0) { setLoading(false); return; }

      type WeekBucket = {
        emotional: number[]; resilience: number[]; recovery: number[]; support: number[];
        athletes: Set<string>;
      };
      const weekMap = new Map<string, WeekBucket>();

      checkins.forEach((c) => {
        const date = new Date(c.completed_at);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        const weekKey = monday.toISOString().split("T")[0];

        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, { emotional: [], resilience: [], recovery: [], support: [], athletes: new Set() });
        }
        const w = weekMap.get(weekKey)!;
        if (c.emotional_score != null)  w.emotional.push(c.emotional_score);
        if (c.resilience_score != null) w.resilience.push(c.resilience_score);
        if (c.recovery_score != null)   w.recovery.push(c.recovery_score);
        if (c.support_score != null)    w.support.push(c.support_score);
        w.athletes.add(c.athlete_id);
      });

      const avg = (arr: number[]) =>
        arr.length >= 5 ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : null;

      const pulseWeeks: WeeklyPulse[] = Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekKey, data]) => {
          const d = new Date(weekKey);
          return {
            weekLabel: `${d.getMonth() + 1}/${d.getDate()}`,
            emotional:  avg(data.emotional),
            resilience: avg(data.resilience),
            recovery:   avg(data.recovery),
            support:    avg(data.support),
            checkinCount: data.athletes.size,
            totalAthletes: teamAthletes.length,
          };
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
          <p className="text-slate-500">Loading team pulse...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Team Pulse</h1>
          <p className="text-slate-500 mt-1">
            {teamName ? `${teamName} — ` : ""}{totalAthletes} athletes · 8-week rolling view
          </p>
        </div>

        {insufficientData ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Lock className="h-10 w-10 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Not enough data to display</h2>
              <p className="text-slate-500 max-w-sm mx-auto">
                At least 5 athletes must be on your roster before aggregate data is shown. This protects individual athlete privacy.
              </p>
            </CardContent>
          </Card>
        ) : weeks.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">No data yet</h2>
              <p className="text-slate-500">Team pulse data will appear once athletes start checking in.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Weekly Team Averages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 pr-4 text-slate-500 font-medium">Week</th>
                        <th className="text-center py-2 px-3 text-slate-500 font-medium">Participation</th>
                        {PILLARS.map(p => (
                          <th key={p} className={`text-center py-2 px-3 font-medium ${PILLAR_COLORS[p]}`}>
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
                          <tr key={week.weekLabel} className="border-b border-slate-100 last:border-0">
                            <td className="py-3 pr-4 font-medium text-slate-900">{week.weekLabel}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="text-slate-600">{participation}%</span>
                              <span className="text-slate-400 text-xs ml-1">({week.checkinCount}/{week.totalAthletes})</span>
                            </td>
                            {PILLARS.map(p => (
                              <td key={p} className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="font-semibold text-slate-900">{week[p] ?? "—"}</span>
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
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardContent className="py-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Reading your team pulse</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <p className="text-slate-600"><strong>Emotional</strong> — How athletes are feeling overall. Sustained lows may signal burnout.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <p className="text-slate-600"><strong>Resilience</strong> — Ability to handle stress. Watch for dips around competition.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-violet-500 mt-1 shrink-0" />
                    <p className="text-slate-600"><strong>Recovery</strong> — Sleep and physical rest. Low scores hurt performance.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500 mt-1 shrink-0" />
                    <p className="text-slate-600"><strong>Support</strong> — Feeling connected. Low scores may indicate isolation.</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3">Scores shown only when 5+ athletes checked in that week.</p>
              </CardContent>
            </Card>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3">
              <Lock className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800 mb-1">Individual data is protected</p>
                <p className="text-sm text-emerald-700">
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
