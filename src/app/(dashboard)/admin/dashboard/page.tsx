"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  AlertTriangle, CalendarCheck,
  PlayCircle, StopCircle, Shield, TrendingUp, TrendingDown,
  Minus, ChevronRight, Activity,
} from "lucide-react";
import { evaluateRiskLevel } from "@/lib/pillar-scoring";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:        "#f8fafc",
  surface:   "#ffffff",
  raised:    "#f8fafc",
  border:    "#e2e8f0",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#059669",
  greenDeep: "#065f46",
  greenLight:"#d1fae5",
  red:       "#dc2626",
  redLight:  "#fee2e2",
  amber:     "#d97706",
  amberLight:"#fef3c7",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface OrgStats {
  totalAthletes:   number;
  checkinRate7d:   number;
  checkinRateMoM:  number;
  activeThis30d:   number;
  activeLast30d:   number;
  openAlerts:      number;
  redAlerts:       number;
  yellowAlerts:    number;
  greenCount:      number;
  yellowCount:     number;
  redCount:        number;
}

interface TeamStat {
  id:            string;
  name:          string;
  athleteCount:  number;
  checkinRate7d: number;
  greenCount:    number;
  yellowCount:   number;
  redCount:      number;
  alertCount:    number;
}

interface OrgData {
  id:               string;
  name:             string;
  screening_active: boolean;
}

// ─── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_STATS: OrgStats = {
  totalAthletes:  24,
  checkinRate7d:  78,
  checkinRateMoM: 12,
  activeThis30d:  21,
  activeLast30d:  19,
  openAlerts:     3,
  redAlerts:      1,
  yellowAlerts:   2,
  greenCount:     14,
  yellowCount:    7,
  redCount:       3,
};

const DEMO_TEAMS: TeamStat[] = [
  { id:"t1", name:"Men's Basketball",  athleteCount:12, checkinRate7d:83, greenCount:8,  yellowCount:3, redCount:1, alertCount:1 },
  { id:"t2", name:"Women's Soccer",    athleteCount:18, checkinRate7d:72, greenCount:11, yellowCount:5, redCount:2, alertCount:2 },
  { id:"t3", name:"Swimming & Diving", athleteCount:14, checkinRate7d:93, greenCount:12, yellowCount:2, redCount:0, alertCount:0 },
  { id:"t4", name:"Track & Field",     athleteCount:22, checkinRate7d:64, greenCount:13, yellowCount:7, redCount:2, alertCount:1 },
];

// ─── Helper components ─────────────────────────────────────────────────────────
function Delta({ pct }: { pct: number }) {
  if (pct === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[11px]" style={{ color: T.textMuted }}>
      <Minus className="h-3 w-3" />0%
    </span>
  );
  const up = pct > 0;
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
          style={{ color: up ? T.green : T.red }}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}{pct}%
    </span>
  );
}

function WellnessBar({ green, yellow, red }: { green: number; yellow: number; red: number }) {
  const total = green + yellow + red;
  if (total === 0) return <div className="h-1.5 rounded-full w-full" style={{ background: T.borderSub }} />;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden gap-px w-full" style={{ background: T.borderSub }}>
      {green  > 0 && <div style={{ width:`${(green/total)*100}%`,  background: T.green }} />}
      {yellow > 0 && <div style={{ width:`${(yellow/total)*100}%`, background: T.amber }} />}
      {red    > 0 && <div style={{ width:`${(red/total)*100}%`,    background: T.red   }} />}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,           setStats]           = useState<OrgStats | null>(null);
  const [teams,           setTeams]           = useState<TeamStat[]>([]);
  const [profile,         setProfile]         = useState<{ full_name: string; role: string; organization_id: string | null } | null>(null);
  const [orgData,         setOrgData]         = useState<OrgData | null>(null);
  const [screeningLoading,setScreeningLoading]= useState(false);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(false);
  const [isDemo,          setIsDemo]          = useState(false);

  async function load() {
    setLoading(true); setError(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles").select("full_name, role, organization_id")
        .eq("auth_user_id", user.id).single();
      if (prof) setProfile(prof);

      const orgId = prof?.organization_id;
      if (!orgId) { setStats(DEMO_STATS); setTeams(DEMO_TEAMS); setIsDemo(true); setLoading(false); return; }

      const [{ data: org }, { data: teamsData }, { data: athleteProfiles }] = await Promise.all([
        supabase.from("organizations").select("id, name, screening_active").eq("id", orgId).single(),
        supabase.from("teams").select("id, name").eq("organization_id", orgId),
        supabase.from("profiles").select("id, team_id").eq("organization_id", orgId).eq("role", "athlete"),
      ]);

      if (org) setOrgData(org as OrgData);

      const totalAthletes = athleteProfiles?.length ?? 0;
      if (totalAthletes === 0) {
        setStats(DEMO_STATS); setTeams(DEMO_TEAMS); setIsDemo(true); setLoading(false); return;
      }

      const athleteIds = (athleteProfiles ?? []).map(p => p.id);
      const now        = Date.now();
      const d7         = new Date(now - 7  * 86400000).toISOString();
      const d30        = new Date(now - 30 * 86400000).toISOString();
      const d60        = new Date(now - 60 * 86400000).toISOString();

      const [{ data: checkins30 }, { data: checkinsPrev }, { data: alertsData }] = await Promise.all([
        supabase.from("checkins")
          .select("athlete_id, completed_at, emotional_score, resilience_score, recovery_score, support_score")
          .in("athlete_id", athleteIds).gte("completed_at", d30).order("completed_at", { ascending: false }),
        supabase.from("checkins")
          .select("athlete_id")
          .in("athlete_id", athleteIds).gte("completed_at", d60).lt("completed_at", d30),
        supabase.from("alerts").select("athlete_id, severity").eq("status", "open"),
      ]);

      const checked7d     = new Set((checkins30 ?? []).filter(c => c.completed_at >= d7).map(c => c.athlete_id)).size;
      const checkinRate7d = totalAthletes > 0 ? Math.round((checked7d / totalAthletes) * 100) : 0;
      const activeThis30d = new Set((checkins30 ?? []).map(c => c.athlete_id)).size;
      const activeLast30d = new Set((checkinsPrev ?? []).map(c => c.athlete_id)).size;
      const checkinRateMoM = activeLast30d > 0
        ? Math.round(((activeThis30d - activeLast30d) / activeLast30d) * 100) : 0;

      type CheckinRow = { athlete_id: string; completed_at: string; emotional_score: number | null; resilience_score: number | null; recovery_score: number | null; support_score: number | null };
      const latestByAthlete = new Map<string, CheckinRow>();
      (checkins30 ?? []).forEach(c => { if (!latestByAthlete.has(c.athlete_id)) latestByAthlete.set(c.athlete_id, c as CheckinRow); });
      let greenCount = 0, yellowCount = 0, redCount = 0;
      latestByAthlete.forEach(c => {
        const lvl = evaluateRiskLevel({ emotional: c.emotional_score ?? 5, resilience: c.resilience_score ?? 5, recovery: c.recovery_score ?? 5, support: c.support_score ?? 5 }, false);
        if (lvl === "red") redCount++; else if (lvl === "yellow") yellowCount++; else greenCount++;
      });

      const redAlerts    = (alertsData ?? []).filter(a => a.severity === "red").length;
      const yellowAlerts = (alertsData ?? []).filter(a => a.severity === "yellow").length;

      setStats({ totalAthletes, checkinRate7d, checkinRateMoM, activeThis30d, activeLast30d, openAlerts: alertsData?.length ?? 0, redAlerts, yellowAlerts, greenCount, yellowCount, redCount });
      setIsDemo(false);

      const alertsByAthlete = new Map<string, number>();
      (alertsData ?? []).forEach(a => alertsByAthlete.set(a.athlete_id, (alertsByAthlete.get(a.athlete_id) ?? 0) + 1));

      const teamRows: TeamStat[] = (teamsData ?? []).map(team => {
        const teamIds = (athleteProfiles ?? []).filter(p => p.team_id === team.id).map(p => p.id);
        if (teamIds.length === 0) return null;
        const teamCheckins7d = (checkins30 ?? []).filter(c => teamIds.includes(c.athlete_id) && c.completed_at >= d7);
        const latestByTeamAthlete = new Map<string, CheckinRow>();
        teamCheckins7d.forEach(c => { if (!latestByTeamAthlete.has(c.athlete_id)) latestByTeamAthlete.set(c.athlete_id, c); });
        let tGreen = 0, tYellow = 0, tRed = 0;
        latestByTeamAthlete.forEach(c => {
          const lvl = evaluateRiskLevel({ emotional: c.emotional_score ?? 5, resilience: c.resilience_score ?? 5, recovery: c.recovery_score ?? 5, support: c.support_score ?? 5 }, false);
          if (lvl === "red") tRed++; else if (lvl === "yellow") tYellow++; else tGreen++;
        });
        const checked7dTeam = new Set(teamCheckins7d.map(c => c.athlete_id)).size;
        const alertCount = teamIds.reduce((sum, id) => sum + (alertsByAthlete.get(id) ?? 0), 0);
        return { id: team.id, name: team.name, athleteCount: teamIds.length, checkinRate7d: Math.round((checked7dTeam / teamIds.length) * 100), greenCount: tGreen, yellowCount: tYellow, redCount: tRed, alertCount };
      }).filter((t): t is TeamStat => t !== null);

      setTeams(teamRows);
    } catch { setError(true); }
    finally   { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const roleName  = profile?.role === "support" ? "Support" : "Admin";
  const totalRisk = (stats?.greenCount ?? 0) + (stats?.yellowCount ?? 0) + (stats?.redCount ?? 0);

  if (loading) return (
    <DashboardLayout role="admin" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin"
             style={{ borderColor: T.border, borderTopColor: T.greenDeep }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="admin" userName="...">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-xl p-10 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <p className="text-[14px] mb-3" style={{ color: T.textMuted }}>Couldn&apos;t load dashboard data.</p>
          <button onClick={load} className="text-[13px] font-semibold" style={{ color: T.greenDeep }}>Retry</button>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Page header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ color: T.text }}>
              {orgData?.name ?? "Program Overview"}
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>
              {roleName} · {new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isDemo && (
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
                    style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                Demo data
              </span>
            )}
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: T.textMuted }}>
              <div className="h-2 w-2 rounded-full"
                   style={{ background: orgData?.screening_active ? T.green : T.border }} />
              {orgData?.screening_active ? "Screening active" : "Weekly check-ins"}
            </div>
          </div>
        </div>

        {/* ── KPI strip ───────────────────────────────────────────────────────── */}
        <div className="rounded-xl overflow-hidden"
             style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="grid grid-cols-4 divide-x" style={{ borderColor: T.border }}>

            {/* Athletes */}
            <div className="px-5 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                 style={{ color: T.textMuted }}>Athletes</p>
              <p className="text-[32px] font-bold tabular-nums leading-none" style={{ color: T.text }}>
                {stats?.totalAthletes ?? "—"}
              </p>
            </div>

            {/* 7-day check-in rate */}
            <div className="px-5 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider"
                   style={{ color: T.textMuted }}>7-Day Check-In</p>
                <Delta pct={stats?.checkinRateMoM ?? 0} />
              </div>
              <p className="text-[32px] font-bold tabular-nums leading-none" style={{ color: T.text }}>
                {stats?.checkinRate7d ?? "—"}<span className="text-[18px] font-medium ml-0.5" style={{ color: T.textMuted }}>%</span>
              </p>
              <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: T.borderSub }}>
                <div className="h-full rounded-full"
                     style={{ width:`${stats?.checkinRate7d ?? 0}%`, background: T.green }} />
              </div>
            </div>

            {/* Open alerts */}
            <Link href="/admin/alerts" className="block">
              <div className="px-5 py-5 h-full hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider"
                     style={{ color: T.textMuted }}>Open Alerts</p>
                  <ChevronRight className="h-3.5 w-3.5" style={{ color: T.textMuted }} />
                </div>
                <p className="text-[32px] font-bold tabular-nums leading-none"
                   style={{ color: (stats?.openAlerts ?? 0) > 0 ? T.red : T.text }}>
                  {stats?.openAlerts ?? "—"}
                </p>
                {(stats?.openAlerts ?? 0) > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {(stats?.redAlerts ?? 0) > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: T.redLight, color: T.red }}>
                        {stats?.redAlerts} high
                      </span>
                    )}
                    {(stats?.yellowAlerts ?? 0) > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: T.amberLight, color: T.amber }}>
                        {stats?.yellowAlerts} moderate
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>

            {/* Active this month */}
            <div className="px-5 py-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider"
                   style={{ color: T.textMuted }}>Active / 30d</p>
                <Delta pct={stats?.checkinRateMoM ?? 0} />
              </div>
              <p className="text-[32px] font-bold tabular-nums leading-none" style={{ color: T.text }}>
                {stats?.activeThis30d ?? "—"}
              </p>
              {(stats?.activeLast30d ?? 0) > 0 && (
                <p className="text-[11px] mt-2" style={{ color: T.textMuted }}>
                  vs {stats?.activeLast30d} last month
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Main content grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-5">

          {/* Team breakdown — spans 2 cols */}
          {teams.length > 0 && (
            <div className="col-span-2 rounded-xl overflow-hidden"
                 style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="px-5 py-3.5 flex items-center justify-between"
                   style={{ borderBottom: `1px solid ${T.border}` }}>
                <p className="text-[13px] font-semibold" style={{ color: T.text }}>Team Breakdown</p>
                <p className="text-[11px]" style={{ color: T.textMuted }}>7-day window</p>
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.borderSub}` }}>
                    {["Team", "Athletes", "Check-In %", "Wellness", "Alerts"].map(h => (
                      <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                          style={{ color: T.textMuted }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teams.map((team, i) => (
                    <tr key={team.id}
                        style={{ borderTop: i > 0 ? `1px solid ${T.borderSub}` : undefined }}>
                      <td className="px-5 py-3.5">
                        <p className="font-medium" style={{ color: T.text }}>{team.name}</p>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums font-medium" style={{ color: T.textSub }}>
                        {team.athleteCount}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: T.borderSub }}>
                            <div className="h-full rounded-full"
                                 style={{ width:`${team.checkinRate7d}%`, background: team.checkinRate7d >= 70 ? T.green : team.checkinRate7d >= 50 ? T.amber : T.red }} />
                          </div>
                          <span className="tabular-nums font-semibold text-[12px]"
                                style={{ color: team.checkinRate7d >= 70 ? T.green : team.checkinRate7d >= 50 ? T.amber : T.red }}>
                            {team.checkinRate7d}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <WellnessBar green={team.greenCount} yellow={team.yellowCount} red={team.redCount} />
                          <div className="flex items-center gap-1 shrink-0">
                            {team.greenCount  > 0 && <span className="text-[10px] font-bold" style={{ color: T.green  }}>{team.greenCount}</span>}
                            {team.yellowCount > 0 && <><span className="text-[10px]" style={{ color: T.border }}>·</span><span className="text-[10px] font-bold" style={{ color: T.amber  }}>{team.yellowCount}</span></>}
                            {team.redCount    > 0 && <><span className="text-[10px]" style={{ color: T.border }}>·</span><span className="text-[10px] font-bold" style={{ color: T.red    }}>{team.redCount}</span></>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {team.alertCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded"
                                style={{ background: T.redLight, color: T.red }}>
                            <AlertTriangle className="h-3 w-3" />{team.alertCount}
                          </span>
                        ) : (
                          <span className="text-[11px]" style={{ color: T.textMuted }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Right column */}
          <div className="space-y-5">

            {/* Wellness distribution */}
            <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <p className="text-[13px] font-semibold mb-4" style={{ color: T.text }}>Wellness Distribution</p>
              {totalRisk === 0 ? (
                <p className="text-[12px] text-center py-4" style={{ color: T.textMuted }}>No recent data</p>
              ) : (
                <>
                  <div className="flex h-3 rounded-lg overflow-hidden mb-4">
                    {(stats?.greenCount  ?? 0) > 0 && <div style={{ width:`${((stats?.greenCount  ?? 0)/totalRisk)*100}%`, background: T.green  }} />}
                    {(stats?.yellowCount ?? 0) > 0 && <div style={{ width:`${((stats?.yellowCount ?? 0)/totalRisk)*100}%`, background: T.amber  }} />}
                    {(stats?.redCount    ?? 0) > 0 && <div style={{ width:`${((stats?.redCount    ?? 0)/totalRisk)*100}%`, background: T.red    }} />}
                  </div>
                  <div className="space-y-2">
                    {[
                      { label:"Stable",           count: stats?.greenCount  ?? 0, color: T.green },
                      { label:"Needs Attention",  count: stats?.yellowCount ?? 0, color: T.amber },
                      { label:"High Concern",     count: stats?.redCount    ?? 0, color: T.red   },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                          <span className="text-[12px]" style={{ color: T.textSub }}>{row.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold tabular-nums" style={{ color: T.text }}>{row.count}</span>
                          <span className="text-[11px]" style={{ color: T.textMuted }}>
                            ({totalRisk > 0 ? Math.round((row.count / totalRisk) * 100) : 0}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Semester screening */}
            <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-2 mb-4">
                <CalendarCheck className="h-4 w-4" style={{ color: T.textMuted }} />
                <p className="text-[13px] font-semibold" style={{ color: T.text }}>Semester Screening</p>
              </div>
              {orgData?.screening_active ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: T.green }} />
                    <p className="text-[12px] font-medium" style={{ color: T.greenDeep }}>Screening active</p>
                  </div>
                  <p className="text-[11px]" style={{ color: T.textMuted }}>
                    Athletes see the full semester screening form.
                  </p>
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
                    className="w-full flex items-center justify-center gap-2 h-9 text-[12px] font-semibold rounded-lg border transition-colors disabled:opacity-50"
                    style={{ borderColor: T.border, color: T.textSub, background: T.raised }}
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                    {screeningLoading ? "Deactivating…" : "Deactivate"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px]" style={{ color: T.textMuted }}>
                    Send a full wellness screening to all athletes this semester.
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
                    className="w-full flex items-center justify-center gap-2 h-9 text-[12px] font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})` }}
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    {screeningLoading ? "Activating…" : "Activate Semester Check-In"}
                  </button>
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              {[
                { href:"/admin/alerts",    icon:<AlertTriangle className="h-4 w-4" />, label:"Alerts",    color:T.red   },
                { href:"/admin/followups", icon:<Activity      className="h-4 w-4" />, label:"Follow-ups", color:T.amber },
                { href:"/admin/audit-logs",icon:<Shield        className="h-4 w-4" />, label:"Audit Logs", color:T.textMuted },
              ].map(({ href, icon, label, color }, i) => (
                <Link key={href} href={href}>
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                       style={{ borderTop: i > 0 ? `1px solid ${T.borderSub}` : undefined }}>
                    <div className="flex items-center gap-3" style={{ color }}>
                      {icon}
                      <span className="text-[13px] font-medium" style={{ color: T.textSub }}>{label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4" style={{ color: T.textMuted }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Compliance footer ───────────────────────────────────────────────── */}
        <div className="flex items-start gap-2.5 px-1">
          <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: T.textMuted }} />
          <p className="text-[11px] leading-relaxed" style={{ color: T.textMuted }}>
            Coaches see only anonymized team aggregates (FERPA § 99.31). Individual athlete data is protected. Crisis disclosures are covered under FERPA § 99.36 health/safety exception and NCAA 2023 Mental Health Best Practices.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
