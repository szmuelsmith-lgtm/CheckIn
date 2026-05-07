"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  AlertTriangle, Users, ClipboardCheck, CalendarCheck,
  PlayCircle, StopCircle, Shield, Activity, ChevronRight,
  TrendingUp,
} from "lucide-react";
import { evaluateRiskLevel } from "@/lib/pillar-scoring";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:        "#f8fafc",
  surface:   "#ffffff",
  raised:    "#f8fafc",
  border:    "#e8edf2",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#059669",
  red:       "#dc2626",
};

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

// Demo data shown when no real athletes exist
const DEMO_STATS: DashboardStats = {
  totalAthletes: 24,
  checkinRate:   78,
  openAlerts:    3,
  redAlerts:     1,
  yellowAlerts:  2,
  greenCount:    14,
  yellowCount:   7,
  redCount:      3,
};

export default function AdminDashboard() {
  const [stats, setStats]               = useState<DashboardStats | null>(null);
  const [profile, setProfile]           = useState<{ full_name: string; role: string; organization_id: string | null } | null>(null);
  const [orgData, setOrgData]           = useState<OrgData | null>(null);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(false);
  const [isDemo, setIsDemo]             = useState(false);

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

      if (prof?.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("id, screening_active")
          .eq("id", prof.organization_id)
          .single();
        if (org) setOrgData(org);
      }

      const { count: athleteCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", prof?.organization_id)
        .eq("role", "athlete");

      // Use demo data if no real athletes
      if (!athleteCount || athleteCount === 0) {
        setStats(DEMO_STATS);
        setIsDemo(true);
        setLoading(false);
        return;
      }

      const { data: openAlertsData } = await supabase
        .from("alerts")
        .select("severity")
        .eq("status", "open");

      const redAlerts    = openAlertsData?.filter(a => a.severity === "red").length    || 0;
      const yellowAlerts = openAlertsData?.filter(a => a.severity === "yellow").length || 0;

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count: recentCheckins } = await supabase
        .from("checkins")
        .select("*", { count: "exact", head: true })
        .gte("completed_at", weekAgo);

      const { data: latestCheckins } = await supabase
        .from("checkins")
        .select("athlete_id, emotional_score, resilience_score, recovery_score, support_score")
        .gte("completed_at", weekAgo);

      const byAthlete = new Map<string, { e: number; rec: number; res: number; sup: number }>();
      latestCheckins?.forEach(c => {
        if (!byAthlete.has(c.athlete_id)) {
          byAthlete.set(c.athlete_id, {
            e: c.emotional_score ?? 5, rec: c.recovery_score ?? 5,
            res: c.resilience_score ?? 5, sup: c.support_score ?? 5,
          });
        }
      });

      let greenCount = 0, yellowCount = 0, redCount = 0;
      byAthlete.forEach(({ e, rec, res, sup }) => {
        const level = evaluateRiskLevel({ emotional: e, resilience: res, recovery: rec, support: sup }, false);
        if (level === 'red')    redCount++;
        else if (level === 'yellow') yellowCount++;
        else                         greenCount++;
      });

      const total       = athleteCount || 0;
      const checkinRate = total > 0 ? Math.round(((recentCheckins || 0) / total) * 100) : 0;

      setStats({
        totalAthletes: total,
        checkinRate:   Math.min(checkinRate, 100),
        openAlerts:    openAlertsData?.length || 0,
        redAlerts, yellowAlerts, greenCount, yellowCount, redCount,
      });
      setIsDemo(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const roleName = profile?.role === "support" ? "Support" : "Admin";
  const totalRisk = (stats?.greenCount || 0) + (stats?.yellowCount || 0) + (stats?.redCount || 0);

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="...">
        <div className="flex items-center justify-center h-64">
          <div className="h-5 w-5 rounded-full border-2 animate-spin"
               style={{ borderColor: T.border, borderTopColor: T.green }} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin" userName="...">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl p-10 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <p className="mb-3 text-[14px]" style={{ color: T.textMuted }}>Couldn&apos;t load dashboard data.</p>
            <button onClick={load} className="text-[13px] font-medium" style={{ color: T.green }}>Retry</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>{roleName} Dashboard</h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>Program overview · athlete wellness status</p>
          </div>
          {isDemo && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
                 style={{ background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
              DEMO DATA
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Athletes */}
          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#dbeafe" }}>
                <Users className="h-[18px] w-[18px]" style={{ color: "#2563eb" }} />
              </div>
              <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>Athletes</p>
            </div>
            <p className="text-[34px] font-bold tabular-nums leading-none" style={{ color: T.text }}>{stats?.totalAthletes}</p>
          </div>

          {/* Check-in rate */}
          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#d1fae5" }}>
                <ClipboardCheck className="h-[18px] w-[18px]" style={{ color: T.green }} />
              </div>
              <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>Check-in Rate</p>
            </div>
            <p className="text-[34px] font-bold tabular-nums leading-none" style={{ color: T.text }}>{stats?.checkinRate}%</p>
            <div className="mt-3 h-[2px] rounded-full overflow-hidden" style={{ background: T.borderSub }}>
              <div className="h-full rounded-full" style={{ width: `${stats?.checkinRate}%`, background: `linear-gradient(135deg,#065f46,${T.green})` }} />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: T.textMuted }}>7-day rolling</p>
          </div>

          {/* Open alerts */}
          <Link href="/admin/alerts">
            <div className="rounded-3xl p-5 transition-shadow hover:shadow-sm cursor-pointer" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#fee2e2" }}>
                  <AlertTriangle className="h-[18px] w-[18px]" style={{ color: T.red }} />
                </div>
                <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>Open Alerts</p>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-[34px] font-bold tabular-nums leading-none" style={{ color: T.text }}>{stats?.openAlerts}</p>
                <ChevronRight className="h-4 w-4 mb-1" style={{ color: T.textMuted }} />
              </div>
              {(stats?.redAlerts || 0) > 0 && (
                <div className="flex gap-2 mt-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#fee2e2", color: T.red }}>{stats?.redAlerts} RED</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#fefce8", color: "#ca8a04" }}>{stats?.yellowAlerts} YELLOW</span>
                </div>
              )}
            </div>
          </Link>

          {/* Wellness snapshot */}
          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                <Activity className="h-[18px] w-[18px]" style={{ color: T.green }} />
              </div>
              <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>Checked In (7d)</p>
            </div>
            <p className="text-[34px] font-bold tabular-nums leading-none" style={{ color: T.text }}>{totalRisk}</p>
          </div>
        </div>

        {/* Team health distribution */}
        <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4" style={{ color: T.textMuted }} />
            <p className="text-[13px] font-semibold" style={{ color: T.textSub }}>Team Wellness Distribution</p>
          </div>
          {totalRisk === 0 ? (
            <p className="text-[13px] text-center py-6" style={{ color: T.textMuted }}>No check-in data yet this week.</p>
          ) : (
            <>
              {/* Stacked bar */}
              <div className="flex h-6 rounded-xl overflow-hidden gap-[2px] mb-4" style={{ background: "#ffffff" }}>
                {(stats?.greenCount || 0) > 0 && (
                  <div className="transition-all" style={{ width: `${((stats?.greenCount || 0) / totalRisk) * 100}%`, background: "#059669" }} />
                )}
                {(stats?.yellowCount || 0) > 0 && (
                  <div className="transition-all" style={{ width: `${((stats?.yellowCount || 0) / totalRisk) * 100}%`, background: "#eab308" }} />
                )}
                {(stats?.redCount || 0) > 0 && (
                  <div className="transition-all" style={{ width: `${((stats?.redCount || 0) / totalRisk) * 100}%`, background: T.red }} />
                )}
              </div>
              {/* Legend */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Stable",           count: stats?.greenCount  || 0, color: "#059669", bg: "#f0fdf4" },
                  { label: "Needs attention",  count: stats?.yellowCount || 0, color: "#ca8a04", bg: "#fefce8" },
                  { label: "Support triggered", count: stats?.redCount   || 0, color: T.red,   bg: "#fee2e2" },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: item.bg }}>
                    <p className="text-[20px] font-bold tabular-nums" style={{ color: item.color }}>{item.count}</p>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: item.color }}>{item.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: item.color, opacity: 0.7 }}>
                      {totalRisk > 0 ? Math.round((item.count / totalRisk) * 100) : 0}%
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Compliance / privacy notice */}
        <div className="rounded-2xl p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 mt-0.5 shrink-0" style={{ color: T.green }} />
            <div>
              <p className="text-[12px] font-semibold mb-1" style={{ color: "#065f46" }}>Privacy & Compliance</p>
              <p className="text-[11px] leading-relaxed" style={{ color: "#047857" }}>
                Coaches see only anonymized team aggregates (FERPA § 99.31). Individual athlete data is protected. Crisis disclosures are covered under FERPA § 99.36 health/safety exception and NCAA 2023 Mental Health Best Practices.
              </p>
            </div>
          </div>
        </div>

        {/* Semester Screening */}
        <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="h-4 w-4" style={{ color: T.green }} />
            <p className="text-[13px] font-semibold" style={{ color: T.textSub }}>Semester Screening</p>
          </div>

          {orgData === null ? (
            <p className="text-[13px]" style={{ color: T.textMuted }}>Loading screening status…</p>
          ) : orgData.screening_active ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: T.green }} />
                  <p className="text-[13px] font-semibold" style={{ color: "#065f46" }}>Screening Active</p>
                </div>
                <p className="text-[12px]" style={{ color: T.textMuted }}>Athletes will see the full semester screening check-in form.</p>
              </div>
              <button
                disabled={screeningLoading}
                onClick={async () => {
                  if (!orgData?.id) return;
                  setScreeningLoading(true);
                  try {
                    const supabase = createClient();
                    await supabase.from("organizations").update({ screening_active: false }).eq("id", orgData.id);
                    setOrgData(prev => prev ? { ...prev, screening_active: false } : prev);
                  } finally { setScreeningLoading(false); }
                }}
                className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold rounded-xl border transition-colors disabled:opacity-50"
                style={{ borderColor: T.border, color: T.textSub, background: T.raised }}
              >
                <StopCircle className="h-4 w-4" />
                {screeningLoading ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-[13px]" style={{ color: T.textMuted }}>
                Activate semester check-in to send a full screening to all athletes.
              </p>
              <button
                disabled={screeningLoading}
                onClick={async () => {
                  setScreeningLoading(true);
                  try {
                    const supabase = createClient();
                    if (orgData?.id) {
                      await supabase.from("organizations").update({ screening_active: true }).eq("id", orgData.id);
                      setOrgData(prev => prev ? { ...prev, screening_active: true } : prev);
                    }
                  } finally { setScreeningLoading(false); }
                }}
                className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold text-white rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}
              >
                <PlayCircle className="h-4 w-4" />
                {screeningLoading ? "Activating…" : "Activate Semester Check-In"}
              </button>
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
