"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Pillar, PillarScores } from "@/types/database";
import type { PillarLevel } from "@/lib/pillar-scoring";
import { ClipboardCheck, Users } from "lucide-react";

type PillarDistribution = Record<PillarLevel, number>;
type DistributionResult = Record<Pillar, PillarDistribution>;

interface AggregateData {
  checkin_rate: number;
  pillar_averages: PillarScores;
  distribution: DistributionResult;
  athlete_count: number;
  checkins_this_week: number;
}

const PILLAR_STYLES: Record<Pillar, { bg: string; text: string; border: string; bar: string }> = {
  emotional:  { bg: "bg-emerald-50",  text: "text-emerald-600",  border: "border-emerald-200",  bar: "bg-emerald-500"  },
  resilience: { bg: "bg-blue-50",     text: "text-blue-600",     border: "border-blue-200",     bar: "bg-blue-500"     },
  recovery:   { bg: "bg-violet-50",   text: "text-violet-600",   border: "border-violet-200",   bar: "bg-violet-500"   },
  support:    { bg: "bg-amber-50",    text: "text-amber-600",    border: "border-amber-200",    bar: "bg-amber-500"    },
};

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

const LEVEL_LABELS: Record<PillarLevel, string> = {
  stable:   "Stable",
  moderate: "Moderate",
  elevated: "Elevated",
  high:     "High Concern",
};

const LEVEL_COLORS: Record<PillarLevel, string> = {
  stable:   "bg-emerald-400",
  moderate: "bg-amber-400",
  elevated: "bg-orange-400",
  high:     "bg-red-400",
};

export default function CoachDashboard() {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [teamName, setTeamName] = useState("");
  const [data, setData] = useState<AggregateData | null>(null);
  const [insufficientData, setInsufficientData] = useState(false);
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
        .select("full_name, team_id")
        .eq("auth_user_id", user.id)
        .single();

      if (prof) {
        setProfile({ full_name: prof.full_name });
        if (prof.team_id) {
          const { data: team } = await supabase
            .from("teams")
            .select("name")
            .eq("id", prof.team_id)
            .single();
          if (team) setTeamName(team.name);
        }
      }

      const res = await fetch("/api/coach/aggregate", { method: "POST" });
      if (!res.ok) {
        setError(true);
        return;
      }
      const json = await res.json();
      if (json.insufficient_data) {
        setInsufficientData(true);
      } else {
        setData(json);
      }
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
      <DashboardLayout role="coach" userName={profile?.full_name || "Coach"}>
        <div className="max-w-5xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-12 text-center">
              <p className="text-red-700 mb-4">Couldn&apos;t load team data. Check your connection and try again.</p>
              <button
                onClick={load}
                className="text-sm text-red-600 hover:underline font-medium"
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
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

        {insufficientData ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-900 mb-2">
                Not enough data yet
              </p>
              <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                At least 5 athletes need to check in before team trends are visible. This protects individual privacy.
              </p>
            </CardContent>
          </Card>
        ) : data ? (
          <>
            {/* Check-in rate */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-emerald-500" />
                  Weekly Check-In Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900 mb-1">
                  {data.checkins_this_week} of {data.athlete_count} athletes
                  <span className="text-lg font-normal text-slate-500 ml-2">checked in this week</span>
                </p>
                <div className="mt-4 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${data.checkin_rate}%` }}
                  />
                </div>
                <p className="text-sm text-slate-500 mt-2">{data.checkin_rate.toFixed(0)}% completion rate</p>
              </CardContent>
            </Card>

            {/* Pillar averages */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {PILLARS.map((pillar) => {
                const style = PILLAR_STYLES[pillar];
                const avg = data.pillar_averages[pillar];
                const pct = Math.round((avg / 10) * 100);
                return (
                  <Card key={pillar} className={`border ${style.border}`}>
                    <CardContent className={`py-5 ${style.bg} rounded-xl`}>
                      <p className={`text-xs uppercase tracking-wide font-medium mb-1 ${style.text}`}>
                        {PILLAR_LABELS[pillar]}
                      </p>
                      <p className={`text-3xl font-bold ${style.text}`}>{avg.toFixed(1)}</p>
                      <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${style.bar}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Team average / 10</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Distribution section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Pillar Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {PILLARS.map((pillar) => {
                    const dist = data.distribution[pillar];
                    const total = Object.values(dist).reduce((a, b) => a + b, 0);
                    const style = PILLAR_STYLES[pillar];
                    return (
                      <div key={pillar}>
                        <p className={`text-sm font-medium mb-2 ${style.text}`}>
                          {PILLAR_LABELS[pillar]}
                        </p>
                        {total > 0 ? (
                          <>
                            <div className="flex h-5 rounded-full overflow-hidden gap-px">
                              {(["stable", "moderate", "elevated", "high"] as PillarLevel[]).map((level) => {
                                const count = dist[level];
                                const pct = total > 0 ? (count / total) * 100 : 0;
                                if (pct === 0) return null;
                                return (
                                  <div
                                    key={level}
                                    className={`${LEVEL_COLORS[level]} transition-all`}
                                    style={{ width: `${pct}%` }}
                                    title={`${LEVEL_LABELS[level]}: ${count}`}
                                  />
                                );
                              })}
                            </div>
                            <div className="flex flex-wrap gap-4 mt-2">
                              {(["stable", "moderate", "elevated", "high"] as PillarLevel[]).map((level) => (
                                <div key={level} className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <div className={`h-2.5 w-2.5 rounded-full ${LEVEL_COLORS[level]}`} />
                                  <span>{LEVEL_LABELS[level]}: {dist[level]}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-slate-400">No data yet</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
              <p className="text-sm text-emerald-800">
                <strong>Privacy-first:</strong> All data is anonymized. Individual responses are never visible to coaches.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
