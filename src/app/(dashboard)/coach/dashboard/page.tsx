"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { ErrorState } from "@/components/ui/error-state";
import {
  Users,
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface TeamSnapshot {
  totalAthletes: number;
  checkedInCount: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  noDataCount: number;
  avgMood: number | null;
  avgStress: number | null;
  avgSleep: number | null;
  avgSupport: number | null;
  prevAvgMood: number | null;
  prevAvgStress: number | null;
  prevAvgSleep: number | null;
  prevAvgSupport: number | null;
}

export default function CoachDashboard() {
  const [profile, setProfile] = useState<{ full_name: string; team_id: string | null } | null>(null);
  const [teamName, setTeamName] = useState("");
  const [snapshot, setSnapshot] = useState<TeamSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, team_id, organization_id")
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

      // Get athletes on this team
      const { data: teamAthletes } = await supabase
        .from("profiles")
        .select("id")
        .eq("team_id", prof.team_id)
        .eq("role", "athlete");

      if (!teamAthletes || teamAthletes.length === 0) {
        setSnapshot({
          totalAthletes: 0, checkedInCount: 0,
          greenCount: 0, yellowCount: 0, redCount: 0, noDataCount: 0,
          avgMood: null, avgStress: null, avgSleep: null, avgSupport: null,
          prevAvgMood: null, prevAvgStress: null, prevAvgSleep: null, prevAvgSupport: null,
        });
        setLoading(false);
        return;
      }

      const athleteIds = teamAthletes.map((a) => a.id);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

      // Get all recent check-ins (last 2 weeks for trend comparison)
      const { data: checkins } = await supabase
        .from("checkins")
        .select("athlete_id, risk_level, completed_at, mood_score, stress_score, sleep_score, support_score")
        .in("athlete_id", athleteIds)
        .gte("completed_at", twoWeeksAgo)
        .order("completed_at", { ascending: false });

      // This week's check-ins (latest per athlete)
      const thisWeekLatest = new Map<string, typeof checkins extends (infer T)[] | null ? T : never>();
      const prevWeekScores: { mood: number[]; stress: number[]; sleep: number[]; support: number[] } = {
        mood: [], stress: [], sleep: [], support: [],
      };

      checkins?.forEach((c) => {
        const isThisWeek = new Date(c.completed_at) >= new Date(weekAgo);
        const isPrevWeek = new Date(c.completed_at) >= new Date(twoWeeksAgo) && new Date(c.completed_at) < new Date(weekAgo);

        if (isThisWeek && !thisWeekLatest.has(c.athlete_id)) {
          thisWeekLatest.set(c.athlete_id, c);
        }
        if (isPrevWeek) {
          prevWeekScores.mood.push(c.mood_score);
          prevWeekScores.stress.push(c.stress_score);
          prevWeekScores.sleep.push(c.sleep_score);
          prevWeekScores.support.push(c.support_score);
        }
      });

      // Calculate this week's stats
      let greenCount = 0, yellowCount = 0, redCount = 0;
      const thisWeekMoods: number[] = [];
      const thisWeekStress: number[] = [];
      const thisWeekSleep: number[] = [];
      const thisWeekSupport: number[] = [];

      thisWeekLatest.forEach((c) => {
        if (c.risk_level === "green") greenCount++;
        else if (c.risk_level === "yellow") yellowCount++;
        else if (c.risk_level === "red") redCount++;

        thisWeekMoods.push(c.mood_score);
        thisWeekStress.push(c.stress_score);
        thisWeekSleep.push(c.sleep_score);
        thisWeekSupport.push(c.support_score);
      });

      const avg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : null;

      setSnapshot({
        totalAthletes: teamAthletes.length,
        checkedInCount: thisWeekLatest.size,
        greenCount,
        yellowCount,
        redCount,
        noDataCount: teamAthletes.length - thisWeekLatest.size,
        avgMood: avg(thisWeekMoods),
        avgStress: avg(thisWeekStress),
        avgSleep: avg(thisWeekSleep),
        avgSupport: avg(thisWeekSupport),
        prevAvgMood: avg(prevWeekScores.mood),
        prevAvgStress: avg(prevWeekScores.stress),
        prevAvgSleep: avg(prevWeekScores.sleep),
        prevAvgSupport: avg(prevWeekScores.support),
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <DashboardLayout role="coach" userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="coach" userName="...">
        <ErrorState message="Couldn't load team data. Check your connection and try again." onRetry={load} />
      </DashboardLayout>
    );
  }

  const checkinRate = snapshot && snapshot.totalAthletes > 0
    ? Math.round((snapshot.checkedInCount / snapshot.totalAthletes) * 100)
    : 0;

  const greenPct = snapshot && snapshot.checkedInCount > 0
    ? Math.round((snapshot.greenCount / snapshot.checkedInCount) * 100) : 0;
  const yellowPct = snapshot && snapshot.checkedInCount > 0
    ? Math.round((snapshot.yellowCount / snapshot.checkedInCount) * 100) : 0;
  const redPct = snapshot && snapshot.checkedInCount > 0
    ? Math.round((snapshot.redCount / snapshot.checkedInCount) * 100) : 0;

  function TrendArrow({ current, previous, inverted }: { current: number | null; previous: number | null; inverted?: boolean }) {
    if (current === null || previous === null) return <Minus className="h-4 w-4 text-slate-300" />;
    const diff = current - previous;
    if (Math.abs(diff) < 0.3) return <Minus className="h-4 w-4 text-slate-400" />;
    const isImproving = inverted ? diff < 0 : diff > 0;
    return isImproving
      ? <TrendingUp className="h-4 w-4 text-green-500" />
      : <TrendingDown className="h-4 w-4 text-red-500" />;
  }

  return (
    <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Team Dashboard</h1>
          <p className="text-slate-500 mt-1">
            {teamName ? `${teamName} — ` : ""}Aggregate team wellness overview
          </p>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{snapshot?.totalAthletes}</p>
                  <p className="text-sm text-slate-500">Athletes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{checkinRate}%</p>
                  <p className="text-sm text-slate-500">Checked In</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{greenPct}%</p>
                  <p className="text-sm text-slate-500">Doing Well</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{yellowPct + redPct}%</p>
                  <p className="text-sm text-slate-500">Need Support</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completion Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Check-In Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${checkinRate}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-600 tabular-nums w-16 text-right">
                {snapshot?.checkedInCount}/{snapshot?.totalAthletes}
              </span>
            </div>
            {snapshot && snapshot.noDataCount > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                {snapshot.noDataCount} athlete{snapshot.noDataCount !== 1 ? "s haven't" : " hasn't"} checked in this week
              </p>
            )}
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Team Wellness Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {snapshot && snapshot.checkedInCount > 0 ? (
              <>
                {/* Stacked bar */}
                <div className="h-8 rounded-full overflow-hidden flex mb-4">
                  {greenPct > 0 && (
                    <div
                      className="bg-green-400 transition-all flex items-center justify-center"
                      style={{ width: `${greenPct}%` }}
                    >
                      {greenPct >= 15 && <span className="text-xs font-semibold text-green-900">{greenPct}%</span>}
                    </div>
                  )}
                  {yellowPct > 0 && (
                    <div
                      className="bg-amber-400 transition-all flex items-center justify-center"
                      style={{ width: `${yellowPct}%` }}
                    >
                      {yellowPct >= 15 && <span className="text-xs font-semibold text-amber-900">{yellowPct}%</span>}
                    </div>
                  )}
                  {redPct > 0 && (
                    <div
                      className="bg-red-400 transition-all flex items-center justify-center"
                      style={{ width: `${redPct}%` }}
                    >
                      {redPct >= 15 && <span className="text-xs font-semibold text-red-900">{redPct}%</span>}
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                    <span className="text-slate-600">
                      <strong className="text-slate-900">{greenPct}%</strong> doing well ({snapshot.greenCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="text-slate-600">
                      <strong className="text-slate-900">{yellowPct}%</strong> moderate concern ({snapshot.yellowCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="text-slate-600">
                      <strong className="text-slate-900">{redPct}%</strong> need support ({snapshot.redCount})
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-center py-6">No check-in data this week yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Team Average Scores */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Team Averages This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {snapshot && snapshot.avgMood !== null ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Mood", value: snapshot.avgMood, prev: snapshot.prevAvgMood, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Stress", value: snapshot.avgStress, prev: snapshot.prevAvgStress, color: "text-red-600", bg: "bg-red-50", inverted: true },
                  { label: "Sleep", value: snapshot.avgSleep, prev: snapshot.prevAvgSleep, color: "text-purple-600", bg: "bg-purple-50" },
                  { label: "Support", value: snapshot.avgSupport, prev: snapshot.prevAvgSupport, color: "text-green-600", bg: "bg-green-50" },
                ].map((item) => (
                  <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center`}>
                    <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                    <p className={`text-3xl font-bold ${item.color}`}>
                      {item.value ?? "—"}
                    </p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <TrendArrow current={item.value} previous={item.prev} inverted={item.inverted} />
                      <span className="text-xs text-slate-400">vs last week</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-6">
                Averages will appear once athletes complete check-ins this week.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Privacy note */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
          <p className="text-sm text-emerald-800">
            <strong>Privacy-first:</strong> You see team-level aggregates only. Individual athlete responses, scores, and journal entries are not visible to coaches. Athletes who need support are connected directly with qualified staff.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
