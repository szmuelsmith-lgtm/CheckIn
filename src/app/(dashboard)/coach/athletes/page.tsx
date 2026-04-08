"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Activity, TrendingUp, TrendingDown, Minus, Lock } from "lucide-react";

interface WeeklyPulse {
  weekLabel: string;
  avgMood: number | null;
  avgStress: number | null;
  avgSleep: number | null;
  avgSupport: number | null;
  checkinCount: number;
  totalAthletes: number;
  greenPct: number;
  yellowPct: number;
  redPct: number;
}

export default function CoachTeamPulsePage() {
  const [profile, setProfile] = useState<{ full_name: string; team_id: string | null } | null>(null);
  const [teamName, setTeamName] = useState("");
  const [weeks, setWeeks] = useState<WeeklyPulse[]>([]);
  const [totalAthletes, setTotalAthletes] = useState(0);
  const [loading, setLoading] = useState(true);

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
          .from("teams")
          .select("name")
          .eq("id", prof.team_id)
          .single();
        if (team) setTeamName(team.name);
      }

      // Get team athletes
      const { data: teamAthletes } = await supabase
        .from("profiles")
        .select("id")
        .eq("team_id", prof.team_id)
        .eq("role", "athlete");

      if (!teamAthletes || teamAthletes.length === 0) {
        setLoading(false);
        return;
      }

      setTotalAthletes(teamAthletes.length);
      const athleteIds = teamAthletes.map((a) => a.id);

      // Get check-ins for last 8 weeks
      const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString();

      const { data: checkins } = await supabase
        .from("checkins")
        .select("athlete_id, risk_level, completed_at, mood_score, stress_score, sleep_score, support_score")
        .in("athlete_id", athleteIds)
        .gte("completed_at", eightWeeksAgo)
        .order("completed_at", { ascending: true });

      if (!checkins || checkins.length === 0) {
        setLoading(false);
        return;
      }

      // Group by week (Monday start)
      const weekMap = new Map<string, {
        mood: number[]; stress: number[]; sleep: number[]; support: number[];
        athletes: Set<string>; green: number; yellow: number; red: number;
      }>();

      checkins.forEach((c) => {
        const date = new Date(c.completed_at);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        const weekKey = monday.toISOString().split("T")[0];

        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, { mood: [], stress: [], sleep: [], support: [], athletes: new Set(), green: 0, yellow: 0, red: 0 });
        }
        const w = weekMap.get(weekKey)!;
        w.mood.push(c.mood_score);
        w.stress.push(c.stress_score);
        w.sleep.push(c.sleep_score);
        w.support.push(c.support_score);
        w.athletes.add(c.athlete_id);
        if (c.risk_level === "green") w.green++;
        else if (c.risk_level === "yellow") w.yellow++;
        else if (c.risk_level === "red") w.red++;
      });

      const avg = (arr: number[]) => arr.length > 0
        ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10
        : null;

      const pulseWeeks: WeeklyPulse[] = Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekKey, data]) => {
          const d = new Date(weekKey);
          const total = data.green + data.yellow + data.red;
          return {
            weekLabel: `${d.getMonth() + 1}/${d.getDate()}`,
            avgMood: avg(data.mood),
            avgStress: avg(data.stress),
            avgSleep: avg(data.sleep),
            avgSupport: avg(data.support),
            checkinCount: data.athletes.size,
            totalAthletes: teamAthletes.length,
            greenPct: total > 0 ? Math.round((data.green / total) * 100) : 0,
            yellowPct: total > 0 ? Math.round((data.yellow / total) * 100) : 0,
            redPct: total > 0 ? Math.round((data.red / total) * 100) : 0,
          };
        });

      setWeeks(pulseWeeks);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="coach" userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading team pulse...</p>
        </div>
      </DashboardLayout>
    );
  }

  function TrendIndicator({ current, previous, inverted }: { current: number | null; previous: number | null; inverted?: boolean }) {
    if (current === null || previous === null) return <Minus className="h-3.5 w-3.5 text-slate-300" />;
    const diff = current - previous;
    if (Math.abs(diff) < 0.3) return <Minus className="h-3.5 w-3.5 text-slate-400" />;
    const isGood = inverted ? diff < 0 : diff > 0;
    return isGood
      ? <TrendingUp className="h-3.5 w-3.5 text-green-500" />
      : <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
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

        {weeks.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">No data yet</h2>
              <p className="text-slate-500">
                Team pulse data will appear once athletes start checking in.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Weekly pulse table */}
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
                        <th className="text-center py-2 px-3 text-emerald-600 font-medium">Mood</th>
                        <th className="text-center py-2 px-3 text-red-600 font-medium">Stress</th>
                        <th className="text-center py-2 px-3 text-purple-600 font-medium">Sleep</th>
                        <th className="text-center py-2 px-3 text-green-600 font-medium">Support</th>
                        <th className="text-center py-2 pl-3 text-slate-500 font-medium">Wellness</th>
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
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-semibold text-slate-900">{week.avgMood ?? "—"}</span>
                                <TrendIndicator current={week.avgMood} previous={prev?.avgMood ?? null} />
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-semibold text-slate-900">{week.avgStress ?? "—"}</span>
                                <TrendIndicator current={week.avgStress} previous={prev?.avgStress ?? null} inverted />
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-semibold text-slate-900">{week.avgSleep ?? "—"}</span>
                                <TrendIndicator current={week.avgSleep} previous={prev?.avgSleep ?? null} />
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-semibold text-slate-900">{week.avgSupport ?? "—"}</span>
                                <TrendIndicator current={week.avgSupport} previous={prev?.avgSupport ?? null} />
                              </div>
                            </td>
                            <td className="py-3 pl-3">
                              {/* Mini stacked bar */}
                              <div className="h-4 rounded-full overflow-hidden flex w-24 mx-auto">
                                {week.greenPct > 0 && (
                                  <div className="bg-green-400" style={{ width: `${week.greenPct}%` }} />
                                )}
                                {week.yellowPct > 0 && (
                                  <div className="bg-amber-400" style={{ width: `${week.yellowPct}%` }} />
                                )}
                                {week.redPct > 0 && (
                                  <div className="bg-red-400" style={{ width: `${week.redPct}%` }} />
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Understanding the data */}
            <Card className="mb-8">
              <CardContent className="py-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Reading your team pulse</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <p className="text-slate-600"><strong>Mood</strong> — Higher is better. Declining team mood may signal broader issues.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500 mt-1 shrink-0" />
                    <p className="text-slate-600"><strong>Stress</strong> — Lower is better. Watch for spikes around exams or competition.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500 mt-1 shrink-0" />
                    <p className="text-slate-600"><strong>Sleep</strong> — Higher is better. Sleep drives recovery and performance.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 mt-1 shrink-0" />
                    <p className="text-slate-600"><strong>Support</strong> — Higher is better. Low support may indicate isolation.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy note */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-3">
              <Lock className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-emerald-800 mb-1">Individual data is protected</p>
                <p className="text-sm text-emerald-700">
                  All numbers shown are team-level averages and percentages. You cannot see which athletes scored what. Athletes who need individual support are connected with qualified counselors through the platform&apos;s alert system.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
