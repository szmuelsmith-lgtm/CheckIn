"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import { AlertTriangle, Users, ClipboardCheck, TrendingUp, CalendarCheck, PlayCircle, StopCircle } from "lucide-react";

interface DashboardStats {
  totalAthletes: number;
  checkinRate: number;
  openAlerts: number;
  redAlerts: number;
  yellowAlerts: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
}

interface OrgData {
  id: string;
  screening_active: boolean;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [profile, setProfile] = useState<{ full_name: string; role: string; organization_id: string | null } | null>(null);
  const [orgData, setOrgData] = useState<OrgData | null>(null);
  const [screeningLoading, setScreeningLoading] = useState(false);
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
        .select("full_name, role, organization_id")
        .eq("auth_user_id", user.id)
        .single();

      if (prof) setProfile(prof);

      // Get org screening state
      if (prof?.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("id, screening_active")
          .eq("id", prof.organization_id)
          .single();
        if (org) setOrgData(org);
      }

      // Get athletes in org
      const { count: athleteCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", prof?.organization_id)
        .eq("role", "athlete");

      // Get open alerts
      const { data: openAlertsData } = await supabase
        .from("alerts")
        .select("severity")
        .eq("status", "open");

      const redAlerts = openAlertsData?.filter((a) => a.severity === "red").length || 0;
      const yellowAlerts = openAlertsData?.filter((a) => a.severity === "yellow").length || 0;

      // Get latest check-ins (last 7 days) for rate calculation
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: recentCheckins } = await supabase
        .from("checkins")
        .select("*", { count: "exact", head: true })
        .gte("completed_at", weekAgo);

      // Risk distribution from latest check-ins
      const { data: latestCheckins } = await supabase
        .from("checkins")
        .select("risk_level, athlete_id")
        .gte("completed_at", weekAgo);

      // Dedupe by athlete (latest only)
      const byAthlete = new Map<string, string>();
      latestCheckins?.forEach((c) => {
        if (!byAthlete.has(c.athlete_id)) {
          byAthlete.set(c.athlete_id, c.risk_level);
        }
      });

      let greenCount = 0, yellowCount = 0, redCount = 0;
      byAthlete.forEach((level) => {
        if (level === "green") greenCount++;
        else if (level === "yellow") yellowCount++;
        else if (level === "red") redCount++;
      });

      const total = athleteCount || 0;
      const checkinRate = total > 0 ? Math.round(((recentCheckins || 0) / total) * 100) : 0;

      setStats({
        totalAthletes: total,
        checkinRate: Math.min(checkinRate, 100),
        openAlerts: (openAlertsData?.length || 0),
        redAlerts,
        yellowAlerts,
        greenCount,
        yellowCount,
        redCount,
      });

    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const roleName = profile?.role === "support" ? "Support" : "Admin";

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin" userName="...">
        <ErrorState message="Couldn't load dashboard data. Check your connection and try again." onRetry={load} />
      </DashboardLayout>
    );
  }

  const totalRisk = (stats?.greenCount || 0) + (stats?.yellowCount || 0) + (stats?.redCount || 0);

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{roleName} Dashboard</h1>
          <p className="text-slate-500 mt-1">Program overview and athlete wellness status</p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.totalAthletes}</p>
                  <p className="text-sm text-slate-500">Athletes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats?.checkinRate}%</p>
                  <p className="text-sm text-slate-500">Check-in Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Link href="/admin/alerts">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-5">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats?.openAlerts}</p>
                    <p className="text-sm text-slate-500">Open Alerts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalRisk}</p>
                  <p className="text-sm text-slate-500">Checked In (7d)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Health */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Team Health Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {totalRisk === 0 ? (
              <p className="text-slate-500 text-center py-8">No check-in data yet this week.</p>
            ) : (
              <div className="space-y-4">
                {/* Bar */}
                <div className="flex h-8 rounded-lg overflow-hidden">
                  {stats && stats.greenCount > 0 && (
                    <div
                      className="bg-green-400 transition-all"
                      style={{ width: `${(stats.greenCount / totalRisk) * 100}%` }}
                    />
                  )}
                  {stats && stats.yellowCount > 0 && (
                    <div
                      className="bg-amber-400 transition-all"
                      style={{ width: `${(stats.yellowCount / totalRisk) * 100}%` }}
                    />
                  )}
                  {stats && stats.redCount > 0 && (
                    <div
                      className="bg-red-400 transition-all"
                      style={{ width: `${(stats.redCount / totalRisk) * 100}%` }}
                    />
                  )}
                </div>
                {/* Legend */}
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                    <span className="text-slate-600">
                      Green: {stats?.greenCount} ({totalRisk > 0 ? Math.round(((stats?.greenCount || 0) / totalRisk) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="text-slate-600">
                      Yellow: {stats?.yellowCount} ({totalRisk > 0 ? Math.round(((stats?.yellowCount || 0) / totalRisk) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="text-slate-600">
                      Red: {stats?.redCount} ({totalRisk > 0 ? Math.round(((stats?.redCount || 0) / totalRisk) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alert breakdown */}
        {(stats?.redAlerts || 0) > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Urgent Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                  {stats?.redAlerts} RED
                </Badge>
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                  {stats?.yellowAlerts} YELLOW
                </Badge>
                <Link href="/admin/alerts" className="text-sm text-emerald-600 hover:underline ml-auto">
                  View all alerts &rarr;
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Semester Screening */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-emerald-500" />
              Semester Screening
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orgData === null ? (
              <p className="text-slate-400 text-sm">Loading screening status...</p>
            ) : orgData.screening_active ? (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-sm px-3 py-1">
                    Screening Active
                  </Badge>
                  <p className="text-sm text-slate-500">
                    Athletes will see the full semester screening check-in form.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-600 hover:bg-slate-50"
                  disabled={screeningLoading}
                  onClick={async () => {
                    if (!orgData?.id) return;
                    setScreeningLoading(true);
                    try {
                      const supabase = createClient();
                      await supabase
                        .from("organizations")
                        .update({ screening_active: false })
                        .eq("id", orgData.id);
                      setOrgData((prev) => prev ? { ...prev, screening_active: false } : prev);
                    } finally {
                      setScreeningLoading(false);
                    }
                  }}
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  {screeningLoading ? "Deactivating..." : "Deactivate"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <p className="text-sm text-slate-500">
                  Activate semester check-in to send a full screening to all athletes.
                </p>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={screeningLoading}
                  onClick={async () => {
                    setScreeningLoading(true);
                    try {
                      const res = await fetch("/api/screening/trigger", { method: "POST" });
                      if (res.ok && orgData?.id) {
                        setOrgData((prev) => prev ? { ...prev, screening_active: true } : prev);
                      }
                    } finally {
                      setScreeningLoading(false);
                    }
                  }}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  {screeningLoading ? "Activating..." : "Activate Semester Check-In"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
