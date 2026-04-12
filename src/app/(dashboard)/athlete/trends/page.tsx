"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Pillar } from "@/types/database";
import { TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
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
  support:    "#F59E0B",
};

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

export default function AthleteTrendsPage() {
  const [profile, setProfile] = useState<{ full_name: string; id: string } | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
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

      // Group by week (Monday-start)
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
          <p className="text-slate-500">Loading trends...</p>
        </div>
      </DashboardLayout>
    );
  }

  const latest = trendData.length > 0 ? trendData[trendData.length - 1] : null;

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Your Trends</h1>
          <p className="text-slate-500 mt-1">Rolling 12-week view of your four wellness pillars.</p>
        </div>

        {trendData.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">No trend data yet</h2>
              <p className="text-slate-500">Complete your first check-in to start tracking trends.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Latest pillar scores */}
            {latest && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {PILLARS.map((pillar) => {
                  const val = latest[pillar];
                  return (
                    <Card key={pillar} className="border-0 bg-slate-50">
                      <CardContent className="py-4 text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wide">{PILLAR_LABELS[pillar]}</p>
                        <p className="text-2xl font-bold mt-1" style={{ color: PILLAR_COLORS[pillar] }}>
                          {val ?? "—"}
                        </p>
                        <p className="text-xs text-slate-400">/ 10</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Pillar Scores Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="week"
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={{ stroke: "#e2e8f0" }}
                      />
                      <YAxis
                        domain={[1, 10]}
                        ticks={[1, 3, 5, 7, 10]}
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={{ stroke: "#e2e8f0" }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "13px" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "13px" }} iconType="circle" />
                      {PILLARS.map(pillar => (
                        <Line
                          key={pillar}
                          type="monotone"
                          dataKey={pillar}
                          stroke={PILLAR_COLORS[pillar]}
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          connectNulls
                          name={PILLAR_LABELS[pillar]}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Key */}
            <Card>
              <CardContent className="py-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Understanding your pillars</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full mt-1 shrink-0" style={{ background: PILLAR_COLORS.emotional }} />
                    <p className="text-slate-600"><strong>Emotional</strong> — How you feel emotionally day to day. Higher is better.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full mt-1 shrink-0" style={{ background: PILLAR_COLORS.resilience }} />
                    <p className="text-slate-600"><strong>Resilience</strong> — Your ability to handle stress and setbacks.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full mt-1 shrink-0" style={{ background: PILLAR_COLORS.recovery }} />
                    <p className="text-slate-600"><strong>Recovery</strong> — Sleep, physical rest, energy levels.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full mt-1 shrink-0" style={{ background: PILLAR_COLORS.support }} />
                    <p className="text-slate-600"><strong>Support</strong> — Feeling connected and supported by others.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
