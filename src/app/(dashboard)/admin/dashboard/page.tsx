"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  AlertTriangle, Users, ClipboardCheck, CalendarCheck,
  PlayCircle, StopCircle, Shield, TrendingUp, TrendingDown,
  Minus, ChevronRight, BarChart3, Activity,
} from "lucide-react";
import { evaluateRiskLevel } from "@/lib/pillar-scoring";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:        "#f4f7f5",
  surface:   "#ffffff",
  raised:    "#f8fafc",
  border:    "#e2e8f0",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#1e293b",
  textMuted: "#64748b",
  // Brand palette — dark green primary, navy secondary, charcoal text
  green:     "#059669",
  greenDeep: "#065f46",
  greenLight:"#d1fae5",
  navy:      "#1e3a5f",
  navyMid:   "#2563eb",
  charcoal:  "#1e293b",
  red:       "#dc2626",
  redLight:  "#fee2e2",
  amber:     "#d97706",
  amberLight:"#fef3c7",
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface OrgStats {
  totalAthletes:   number;
  checkinRate7d:   number;
  checkinRateMoM:  number;   // % change vs last 30d
  activeThis30d:   number;   // unique athletes who checked in last 30d
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
function TrendBadge({ pct }: { pct: number }) {
  if (pct === 0) return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: T.raised, color: T.textMuted }}>
      <Minus className="h-2.5 w-2.5" /> 0%
    </span>
  );
  const up = pct > 0;
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: up ? "#dcfce7" : "#fee2e2", color: up ? "#16a34a" : T.red }}>
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {up ? "+" : ""}{pct}%
    </span>
  );
}

function MiniWellnessBar({ green, yellow, red }: { green: number; yellow: number; red: number }) {
  const total = green + yellow + red;
  if (total === 0) return <div className="h-1.5 rounded-full w-full" style={{ background: T.borderSub }} />;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden gap-px" style={{ background: T.borderSub }}>
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

      const athleteIds     = (athleteProfiles ?? []).map(p => p.id);
      const now            = Date.now();
      const d7             = new Date(now - 7  * 86400000).toISOString();
      const d30            = new Date(now - 30 * 86400000).toISOString();
      const d60            = new Date(now - 60 * 86400000).toISOString();

      const [{ data: checkins30 }, { data: checkinsPrev }, { data: alertsData }] = await Promise.all([
        supabase.from("checkins")
          .select("athlete_id, completed_at, emotional_score, resilience_score, recovery_score, support_score")
          .in("athlete_id", athleteIds).gte("completed_at", d30).order("completed_at", { ascending: false }),
        supabase.from("checkins")
          .select("athlete_id")
          .in("athlete_id", athleteIds).gte("completed_at", d60).lt("completed_at", d30),
        supabase.from("alerts").select("athlete_id, severity").eq("status", "open"),
      ]);

      // ── 7-day check-in rate ──────────────────────────────────────────────────
      const checked7d    = new Set((checkins30 ?? []).filter(c => c.completed_at >= d7).map(c => c.athlete_id)).size;
      const checkinRate7d = totalAthletes > 0 ? Math.round((checked7d / totalAthletes) * 100) : 0;

      // ── Month-over-month ─────────────────────────────────────────────────────
      const activeThis30d = new Set((checkins30 ?? []).map(c => c.athlete_id)).size;
      const activeLast30d = new Set((checkinsPrev ?? []).map(c => c.athlete_id)).size;
      const checkinRateMoM = activeLast30d > 0
        ? Math.round(((activeThis30d - activeLast30d) / activeLast30d) * 100) : 0;

      // ── Org-level risk distribution ──────────────────────────────────────────
      type CheckinRow = { athlete_id: string; completed_at: string; emotional_score: number | null; resilience_score: number | null; recovery_score: number | null; support_score: number | null };
      const latestByAthlete = new Map<string, CheckinRow>();
      (checkins30 ?? []).forEach(c => { if (!latestByAthlete.has(c.athlete_id)) latestByAthlete.set(c.athlete_id, c as CheckinRow); });
      let greenCount = 0, yellowCount = 0, redCount = 0;
      latestByAthlete.forEach(c => {
        const lvl = evaluateRiskLevel({ emotional: c.emotional_score ?? 5, resilience: c.resilience_score ?? 5, recovery: c.recovery_score ?? 5, support: c.support_score ?? 5 }, false);
        if (lvl === "red") redCount++; else if (lvl === "yellow") yellowCount++; else greenCount++;
      });

      // ── Alerts ──────────────────────────────────────────────────────────────
      const redAlerts    = (alertsData ?? []).filter(a => a.severity === "red").length;
      const yellowAlerts = (alertsData ?? []).filter(a => a.severity === "yellow").length;

      setStats({ totalAthletes, checkinRate7d, checkinRateMoM, activeThis30d, activeLast30d, openAlerts: alertsData?.length ?? 0, redAlerts, yellowAlerts, greenCount, yellowCount, redCount });
      setIsDemo(false);

      // ── Per-team breakdown ───────────────────────────────────────────────────
      const athleteTeamMap = new Map<string, string | null>();
      (athleteProfiles ?? []).forEach(a => athleteTeamMap.set(a.id, a.team_id ?? null));

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
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl p-10 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <p className="text-[14px] mb-3" style={{ color: T.textMuted }}>Couldn&apos;t load dashboard data.</p>
          <button onClick={load} className="text-[13px] font-semibold" style={{ color: T.greenDeep }}>Retry</button>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="rounded-3xl px-6 py-5"
             style={{ background: `linear-gradient(135deg, ${T.navy}, #0f2d52)`, boxShadow: "0 4px 20px rgba(15,45,82,0.18)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                {roleName} Dashboard
              </p>
              <h1 className="text-[22px] font-bold text-white tracking-tight">
                {orgData?.name ?? "Program Overview"}
              </h1>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                Athlete wellness · {new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {isDemo && (
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
                  Demo Data
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full"
                     style={{ background: orgData?.screening_active ? "#34d399" : "rgba(255,255,255,0.3)" }} />
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {orgData?.screening_active ? "Screening active" : "Weekly check-ins"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">

          {/* Athletes */}
          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                   style={{ background: "#dbeafe" }}>
                <Users className="h-[18px] w-[18px]" style={{ color: T.navyMid }} />
              </div>
              <TrendBadge pct={0} />
            </div>
            <p className="text-[32px] font-bold tabular-nums leading-none" style={{ color: T.text }}>
              {stats?.totalAthletes}
            </p>
            <p className="text-[11px] mt-1.5 font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>
              Total Athletes
            </p>
          </div>

          {/* Check-in Rate */}
          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                   style={{ background: T.greenLight }}>
                <ClipboardCheck className="h-[18px] w-[18px]" style={{ color: T.green }} />
              </div>
              <TrendBadge pct={stats?.checkinRateMoM ?? 0} />
            </div>
            <p className="text-[32px] font-bold tabular-nums leading-none" style={{ color: T.text }}>
              {stats?.checkinRate7d}%
            </p>
            <div className="mt-2.5 h-[3px] rounded-full overflow-hidden" style={{ background: T.borderSub }}>
              <div className="h-full rounded-full transition-all"
                   style={{ width: `${stats?.checkinRate7d ?? 0}%`, background: `linear-gradient(90deg, ${T.greenDeep}, ${T.green})` }} />
            </div>
            <p className="text-[11px] mt-1.5 font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>
              7-Day Check-In Rate
            </p>
          </div>

          {/* Open Alerts */}
          <Link href="/admin/alerts">
            <div className="rounded-3xl p-5 cursor-pointer transition-shadow hover:shadow-md"
                 style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                     style={{ background: T.redLight }}>
                  <AlertTriangle className="h-[18px] w-[18px]" style={{ color: T.red }} />
                </div>
                <ChevronRight className="h-4 w-4" style={{ color: T.textMuted }} />
              </div>
              <p className="text-[32px] font-bold tabular-nums leading-none" style={{ color: T.text }}>
                {stats?.openAlerts}
              </p>
              {(stats?.openAlerts ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  {(stats?.redAlerts ?? 0) > 0 && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                          style={{ background: T.redLight, color: T.red }}>
                      {stats?.redAlerts} Red
                    </span>
                  )}
                  {(stats?.yellowAlerts ?? 0) > 0 && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase"
                          style={{ background: T.amberLight, color: T.amber }}>
                      {stats?.yellowAlerts} Yellow
                    </span>
                  )}
                </div>
              )}
              <p className="text-[11px] mt-1.5 font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>
                Open Alerts
              </p>
            </div>
          </Link>

          {/* Active Users */}
          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                   style={{ background: "#f0fdf4" }}>
                <Activity className="h-[18px] w-[18px]" style={{ color: T.greenDeep }} />
              </div>
              <TrendBadge pct={stats?.checkinRateMoM ?? 0} />
            </div>
            <p className="text-[32px] font-bold tabular-nums leading-none" style={{ color: T.text }}>
              {stats?.activeThis30d ?? 0}
            </p>
            <p className="text-[11px] mt-1.5" style={{ color: T.textMuted }}>
              <span className="font-semibold uppercase tracking-wide">Active This Month</span>
              {(stats?.activeLast30d ?? 0) > 0 && (
                <span className="ml-1">vs {stats?.activeLast30d} last mo.</span>
              )}
            </p>
          </div>
        </div>

        {/* ── Team Breakdown ───────────────────────────────────────────────────── */}
        {teams.length > 0 && (
          <div className="rounded-3xl overflow-hidden"
               style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="px-5 py-4 flex items-center gap-2"
                 style={{ borderBottom: `1px solid ${T.border}`, background: T.raised }}>
              <BarChart3 className="h-4 w-4" style={{ color: T.charcoal }} />
              <p className="text-[13px] font-bold" style={{ color: T.charcoal }}>Team Breakdown</p>
              <span className="ml-auto text-[11px] font-medium" style={{ color: T.textMuted }}>7-day window</span>
            </div>

            {/* Table header */}
            <div className="px-5 py-2 grid items-center gap-3"
                 style={{ gridTemplateColumns: "1fr 56px 60px 80px 36px", borderBottom: `1px solid ${T.borderSub}`, background: "#fafbfc" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>Team</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: T.textMuted }}>Athletes</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: T.textMuted }}>Check-In</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: T.textMuted }}>Wellness</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: T.textMuted }}>Alerts</p>
            </div>

            {teams.map((team, i) => (
              <div key={team.id}
                   className="px-5 py-3.5 grid items-center gap-3"
                   style={{
                     gridTemplateColumns: "1fr 56px 60px 80px 36px",
                     borderTop: i > 0 ? `1px solid ${T.borderSub}` : undefined,
                   }}>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{team.name}</p>
                  <div className="mt-1.5 w-full">
                    <MiniWellnessBar green={team.greenCount} yellow={team.yellowCount} red={team.redCount} />
                  </div>
                </div>
                <p className="text-[14px] font-bold tabular-nums text-right" style={{ color: T.textSub }}>{team.athleteCount}</p>
                <p className="text-[14px] font-bold tabular-nums text-right"
                   style={{ color: team.checkinRate7d >= 70 ? T.green : team.checkinRate7d >= 50 ? T.amber : T.red }}>
                  {team.checkinRate7d}%
                </p>
                <div className="flex justify-center gap-1">
                  {team.greenCount  > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#16a34a" }}>{team.greenCount}</span>}
                  {team.yellowCount > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: T.amberLight, color: T.amber }}>{team.yellowCount}</span>}
                  {team.redCount    > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: T.redLight, color: T.red }}>{team.redCount}</span>}
                </div>
                <div className="flex justify-end">
                  {team.alertCount > 0 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: T.redLight, color: T.red }}>
                      {team.alertCount}
                    </span>
                  ) : (
                    <span className="text-[10px]" style={{ color: T.textMuted }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Org Wellness Distribution ─────────────────────────────────────── */}
        <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4" style={{ color: T.charcoal }} />
            <p className="text-[13px] font-bold" style={{ color: T.charcoal }}>Program Wellness Distribution</p>
            <span className="ml-auto text-[11px]" style={{ color: T.textMuted }}>
              {totalRisk} athletes with recent data
            </span>
          </div>

          {totalRisk === 0 ? (
            <p className="text-[13px] text-center py-6" style={{ color: T.textMuted }}>
              No check-in data this week.
            </p>
          ) : (
            <>
              <div className="flex h-5 rounded-xl overflow-hidden gap-[2px] mb-4" style={{ background: T.borderSub }}>
                {(stats?.greenCount  ?? 0) > 0 && <div style={{ width:`${((stats?.greenCount  ?? 0)/totalRisk)*100}%`, background: T.green  }} />}
                {(stats?.yellowCount ?? 0) > 0 && <div style={{ width:`${((stats?.yellowCount ?? 0)/totalRisk)*100}%`, background: T.amber  }} />}
                {(stats?.redCount    ?? 0) > 0 && <div style={{ width:`${((stats?.redCount    ?? 0)/totalRisk)*100}%`, background: T.red    }} />}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label:"Stable",           count: stats?.greenCount  ?? 0, color:"#16a34a", bg:"#dcfce7" },
                  { label:"Needs Attention",  count: stats?.yellowCount ?? 0, color: T.amber,  bg: T.amberLight },
                  { label:"Support Triggered",count: stats?.redCount    ?? 0, color: T.red,    bg: T.redLight },
                ].map(item => (
                  <div key={item.label} className="rounded-2xl p-3.5 text-center" style={{ background: item.bg }}>
                    <p className="text-[22px] font-bold tabular-nums" style={{ color: item.color }}>{item.count}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: item.color }}>{item.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: item.color, opacity: 0.7 }}>
                      {totalRisk > 0 ? Math.round((item.count / totalRisk) * 100) : 0}%
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Semester Screening ───────────────────────────────────────────────── */}
        <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-4">
            <CalendarCheck className="h-4 w-4" style={{ color: T.greenDeep }} />
            <p className="text-[13px] font-bold" style={{ color: T.charcoal }}>Semester Screening</p>
          </div>

          {orgData === null ? (
            <p className="text-[13px]" style={{ color: T.textMuted }}>Loading…</p>
          ) : orgData.screening_active ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: T.green }} />
                  <p className="text-[13px] font-semibold" style={{ color: T.greenDeep }}>Screening Active</p>
                </div>
                <p className="text-[12px]" style={{ color: T.textMuted }}>
                  Athletes see the full semester screening form.
                </p>
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
                Send a full wellness screening to all athletes.
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
                style={{ background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})` }}
              >
                <PlayCircle className="h-4 w-4" />
                {screeningLoading ? "Activating…" : "Activate Semester Check-In"}
              </button>
            </div>
          )}
        </div>

        {/* ── Compliance notice ────────────────────────────────────────────────── */}
        <div className="rounded-2xl p-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 mt-0.5 shrink-0" style={{ color: T.green }} />
            <p className="text-[11px] leading-relaxed" style={{ color: "#047857" }}>
              Coaches see only anonymized team aggregates (FERPA § 99.31). Individual athlete data is protected. Crisis disclosures are covered under FERPA § 99.36 health/safety exception and NCAA 2023 Mental Health Best Practices.
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
