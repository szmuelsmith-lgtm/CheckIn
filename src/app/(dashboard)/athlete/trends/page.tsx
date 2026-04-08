"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendPoint {
  week: string;
  mood: number | null;
  stress: number | null;
  sleep: number | null;
  support: number | null;
  family: number | null;
  social: number | null;
  academic: number | null;
  athletic: number | null;
  spiritual: number | null;
}

const CORE_COLORS = {
  mood: "#059669",
  stress: "#EF4444",
  sleep: "#8B5CF6",
  support: "#22C55E",
};

const LIFE_COLORS = {
  family: "#F59E0B",
  social: "#3B82F6",
  academic: "#6366F1",
  athletic: "#EC4899",
  spiritual: "#A78BFA",
};

export default function AthleteTrendsPage() {
  const [profile, setProfile] = useState<{ full_name: string; id: string } | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLifeDimensions, setShowLifeDimensions] = useState(false);

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

      // Get check-ins for the last 12 weeks
      const twelveWeeksAgo = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000).toISOString();

      const { data: checkins } = await supabase
        .from("checkins")
        .select("mood_score, stress_score, sleep_score, support_score, family_score, social_score, academic_score, athletic_confidence_score, spiritual_score, completed_at")
        .eq("athlete_id", prof.id)
        .gte("completed_at", twelveWeeksAgo)
        .order("completed_at", { ascending: true });

      if (!checkins || checkins.length === 0) {
        setTrendData([]);
        setLoading(false);
        return;
      }

      // Group by week
      type WeekBucket = {
        mood: number[]; stress: number[]; sleep: number[]; support: number[];
        family: number[]; social: number[]; academic: number[]; athletic: number[]; spiritual: number[];
      };
      const weekMap = new Map<string, WeekBucket>();

      checkins.forEach((c) => {
        const date = new Date(c.completed_at);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        const weekKey = monday.toISOString().split("T")[0];

        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, {
            mood: [], stress: [], sleep: [], support: [],
            family: [], social: [], academic: [], athletic: [], spiritual: [],
          });
        }
        const week = weekMap.get(weekKey)!;
        week.mood.push(c.mood_score);
        week.stress.push(c.stress_score);
        week.sleep.push(c.sleep_score);
        week.support.push(c.support_score);
        if (c.family_score != null) week.family.push(c.family_score);
        if (c.social_score != null) week.social.push(c.social_score);
        if (c.academic_score != null) week.academic.push(c.academic_score);
        if (c.athletic_confidence_score != null) week.athletic.push(c.athletic_confidence_score);
        if (c.spiritual_score != null) week.spiritual.push(c.spiritual_score);
      });

      const avg = (arr: number[]) =>
        arr.length > 0 ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : null;

      const trends: TrendPoint[] = Array.from(weekMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekKey, scores]) => {
          const weekDate = new Date(weekKey);
          const label = `${weekDate.getMonth() + 1}/${weekDate.getDate()}`;
          return {
            week: label,
            mood: avg(scores.mood),
            stress: avg(scores.stress),
            sleep: avg(scores.sleep),
            support: avg(scores.support),
            family: avg(scores.family),
            social: avg(scores.social),
            academic: avg(scores.academic),
            athletic: avg(scores.athletic),
            spiritual: avg(scores.spiritual),
          };
        });

      setTrendData(trends);
      setLoading(false);
    }
    load();
  }, []);

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

  // Check if any life dimension data exists
  const hasLifeData = trendData.some(
    (t) => t.family != null || t.social != null || t.academic != null || t.athletic != null || t.spiritual != null
  );

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Your Trends</h1>
          <p className="text-slate-500 mt-1">
            Track how you&apos;re doing over time. Rolling 12-week view.
          </p>
        </div>

        {trendData.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                No trend data yet
              </h2>
              <p className="text-slate-500">
                Complete your first check-in to start tracking trends.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Current scores summary */}
            {latest && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {[
                  { label: "Mood", value: latest.mood, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Stress", value: latest.stress, color: "text-red-600", bg: "bg-red-50" },
                  { label: "Sleep", value: latest.sleep, color: "text-purple-600", bg: "bg-purple-50" },
                  { label: "Support", value: latest.support, color: "text-green-600", bg: "bg-green-50" },
                ].map((item) => (
                  <Card key={item.label} className={`${item.bg} border-0`}>
                    <CardContent className="py-4 text-center">
                      <p className="text-xs text-slate-500">{item.label}</p>
                      <p className={`text-2xl font-bold ${item.color} mt-1`}>
                        {item.value ?? "—"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Life dimensions quick summary */}
            {latest && hasLifeData && (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-8">
                {[
                  { label: "Family", value: latest.family, color: "text-amber-600" },
                  { label: "Social", value: latest.social, color: "text-blue-600" },
                  { label: "Academic", value: latest.academic, color: "text-indigo-600" },
                  { label: "Athletic", value: latest.athletic, color: "text-pink-600" },
                  { label: "Spiritual", value: latest.spiritual, color: "text-violet-600" },
                ]
                  .filter((item) => item.value != null)
                  .map((item) => (
                    <div
                      key={item.label}
                      className="bg-white border border-slate-200 rounded-xl py-3 text-center"
                    >
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{item.label}</p>
                      <p className={`text-xl font-bold ${item.color} mt-0.5`}>
                        {item.value}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            {/* Core metrics chart */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Mind & Body Over Time</CardTitle>
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
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "13px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "13px" }} iconType="circle" />
                      <Line type="monotone" dataKey="mood" stroke={CORE_COLORS.mood} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Mood" />
                      <Line type="monotone" dataKey="stress" stroke={CORE_COLORS.stress} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Stress" />
                      <Line type="monotone" dataKey="sleep" stroke={CORE_COLORS.sleep} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Sleep" />
                      <Line type="monotone" dataKey="support" stroke={CORE_COLORS.support} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Support" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Life dimensions chart */}
            {hasLifeData && (
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">Life Dimensions Over Time</CardTitle>
                  <button
                    onClick={() => setShowLifeDimensions(!showLifeDimensions)}
                    className="text-sm text-emerald-600 hover:underline"
                  >
                    {showLifeDimensions ? "Hide" : "Show"}
                  </button>
                </CardHeader>
                {showLifeDimensions && (
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
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              fontSize: "13px",
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "13px" }} iconType="circle" />
                          <Line type="monotone" dataKey="family" stroke={LIFE_COLORS.family} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Family" />
                          <Line type="monotone" dataKey="social" stroke={LIFE_COLORS.social} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Social" />
                          <Line type="monotone" dataKey="academic" stroke={LIFE_COLORS.academic} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Academic" />
                          <Line type="monotone" dataKey="athletic" stroke={LIFE_COLORS.athletic} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Athletic" />
                          <Line type="monotone" dataKey="spiritual" stroke={LIFE_COLORS.spiritual} strokeWidth={2} dot={{ r: 3 }} connectNulls name="Spiritual" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Interpretation help */}
            <Card>
              <CardContent className="py-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Understanding your trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <p className="text-slate-600">
                      <strong>Mood</strong> — Higher is better. Sustained lows may signal burnout.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500 mt-1 shrink-0" />
                    <p className="text-slate-600">
                      <strong>Stress</strong> — Lower is better. Watch for rising trends during season.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500 mt-1 shrink-0" />
                    <p className="text-slate-600">
                      <strong>Sleep</strong> — Higher is better. Sleep drives recovery and performance.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 mt-1 shrink-0" />
                    <p className="text-slate-600">
                      <strong>Support</strong> — Higher is better. Feeling connected helps everything.
                    </p>
                  </div>
                </div>
                {hasLifeData && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                      Life dimensions (family, social, academic, athletic, spiritual) give you a fuller picture of your well-being beyond the field. Low scores in multiple areas often correlate — addressing one can lift the others.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
