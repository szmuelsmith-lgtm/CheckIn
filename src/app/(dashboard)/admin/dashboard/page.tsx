"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  AlertTriangle, PlayCircle, StopCircle, Shield,
  TrendingUp, TrendingDown, Minus,
  ChevronRight, Activity, Users2, Zap, Bell,
  FileText, UserCheck, Download, Check,
} from "lucide-react";
import { evaluateRiskLevel } from "@/lib/pillar-scoring";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:           "#f9fafb",
  surface:      "#ffffff",
  raised:       "#f8fafc",
  border:       "#e5e7eb",
  borderSub:    "#f3f4f6",
  text:         "#111827",
  textSub:      "#374151",
  textMuted:    "#6b7280",
  indigo:       "#4f46e5",
  indigoDark:   "#3730a3",
  indigoLight:  "#eef2ff",
  indigoBorder: "#c7d2fe",
  red:          "#dc2626",
  redLight:     "#fef2f2",
  redBorder:    "#fecaca",
  amber:        "#d97706",
  amberLight:   "#fefce8",
  amberBorder:  "#fde68a",
  green:        "#16a34a",
  greenLight:   "#f0fdf4",
  greenBorder:  "#bbf7d0",
};

const shadow   = "0 1px 3px 0 rgba(0,0,0,0.07),0 1px 2px 0 rgba(0,0,0,0.04)";
const shadowMd = "0 4px 6px -1px rgba(0,0,0,0.07),0 2px 4px -2px rgba(0,0,0,0.04)";

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface AlertFeedItem {
  id:         string;
  severity:   "red" | "yellow";
  athlete_id: string;
  created_at: string;
}

interface AuditLogItem {
  id:         string;
  action:     string;
  actor_name: string;
  created_at: string;
}

interface ProviderLoad {
  id:        string;
  name:      string;
  role:      string;
  caseload:  number;
  capacity:  number;
}

interface WeeklyTrend {
  week:        string;
  emotional:   number;
  resilience:  number;
  recovery:    number;
  support:     number;
}

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_STATS: OrgStats = {
  totalAthletes: 24,  checkinRate7d: 78, checkinRateMoM: 12,
  activeThis30d: 21,  activeLast30d: 19, openAlerts: 3,
  redAlerts: 1,       yellowAlerts: 2,   greenCount: 14,
  yellowCount: 7,     redCount: 3,
};

const DEMO_TEAMS: TeamStat[] = [
  { id:"t1", name:"Men's Basketball",  athleteCount:12, checkinRate7d:83, greenCount:8,  yellowCount:3, redCount:1, alertCount:1 },
  { id:"t2", name:"Women's Soccer",    athleteCount:18, checkinRate7d:72, greenCount:11, yellowCount:5, redCount:2, alertCount:2 },
  { id:"t3", name:"Swimming & Diving", athleteCount:14, checkinRate7d:93, greenCount:12, yellowCount:2, redCount:0, alertCount:0 },
  { id:"t4", name:"Track & Field",     athleteCount:22, checkinRate7d:64, greenCount:13, yellowCount:7, redCount:2, alertCount:1 },
];

const DEMO_ALERTS: AlertFeedItem[] = [
  { id:"a1", severity:"red",    athlete_id:"x", created_at: new Date(Date.now() - 2  * 3600000).toISOString() },
  { id:"a2", severity:"yellow", athlete_id:"x", created_at: new Date(Date.now() - 6  * 3600000).toISOString() },
  { id:"a3", severity:"yellow", athlete_id:"x", created_at: new Date(Date.now() - 18 * 3600000).toISOString() },
];

const DEMO_AUDIT: AuditLogItem[] = [
  { id:"l1", action:"checkin_submitted",   actor_name:"Alex Johnson",   created_at: new Date(Date.now()-15*60000).toISOString()    },
  { id:"l2", action:"alert_acknowledged",  actor_name:"Dr. Sarah Chen", created_at: new Date(Date.now()-42*60000).toISOString()    },
  { id:"l3", action:"outreach_accepted",   actor_name:"Dr. Sarah Chen", created_at: new Date(Date.now()-1.5*3600000).toISOString() },
  { id:"l4", action:"followup_scheduled",  actor_name:"Coach Williams", created_at: new Date(Date.now()-3*3600000).toISOString()   },
  { id:"l5", action:"checkin_submitted",   actor_name:"Jordan Williams",created_at: new Date(Date.now()-4*3600000).toISOString()   },
  { id:"l6", action:"alert_resolved",      actor_name:"Coach Martinez", created_at: new Date(Date.now()-2*86400000).toISOString()  },
];

const DEMO_PROVIDERS: ProviderLoad[] = [
  { id:"p1", name:"Dr. Sarah Chen",    role:"psychiatrist", caseload:8,  capacity:12 },
  { id:"p2", name:"Coach Williams",    role:"coach",        caseload:18, capacity:20 },
  { id:"p3", name:"Coach Martinez",    role:"coach",        caseload:15, capacity:20 },
  { id:"p4", name:"Dr. M. Thompson",   role:"psychiatrist", caseload:5,  capacity:12 },
];

function buildDemoTrends(): WeeklyTrend[] {
  const weeks: WeeklyTrend[] = [];
  const now = Date.now();
  for (let w = 7; w >= 0; w--) {
    const d = new Date(now - w * 7 * 86400000);
    weeks.push({
      week: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      emotional:  5.5 + Math.random() * 2.5 - (w * 0.05),
      resilience: 6.0 + Math.random() * 2.0 - (w * 0.03),
      recovery:   5.0 + Math.random() * 2.5 + (w * 0.05),
      support:    6.5 + Math.random() * 1.5 - (w * 0.02),
    });
  }
  return weeks.map(w => ({
    ...w,
    emotional:  Math.round(w.emotional  * 10) / 10,
    resilience: Math.round(w.resilience * 10) / 10,
    recovery:   Math.round(w.recovery   * 10) / 10,
    support:    Math.round(w.support    * 10) / 10,
  }));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function actionLabel(action: string): string {
  const map: Record<string, string> = {
    checkin_submitted:    "submitted a check-in",
    alert_acknowledged:   "acknowledged alert",
    alert_resolved:       "resolved alert",
    outreach_accepted:    "accepted outreach",
    outreach_declined:    "declined outreach",
    outreach_initiated:   "initiated outreach",
    followup_scheduled:   "scheduled follow-up",
    screening_activated:  "activated semester screening",
    report_generated:     "generated a report",
  };
  return map[action] ?? action.replace(/_/g, " ");
}

function actionColor(action: string): { color: string; bg: string } {
  if (action.includes("alert"))    return { color: T.red,    bg: T.redLight    };
  if (action.includes("followup")) return { color: T.amber,  bg: T.amberLight  };
  if (action.includes("report"))   return { color: T.indigo, bg: T.indigoLight };
  return { color: T.green, bg: T.greenLight };
}

function Delta({ pct }: { pct: number }) {
  if (pct === 0) return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium" style={{ color: T.textMuted }}>
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

function timeAgoShort(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1)  return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Custom Recharts tooltip ──────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2.5 text-[12px]"
         style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadowMd }}>
      <p className="font-semibold mb-1.5" style={{ color: T.textMuted }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: T.textSub }}>{p.name}</span>
          <span className="font-bold ml-auto pl-3" style={{ color: T.text }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,            setStats]            = useState<OrgStats | null>(null);
  const [teams,            setTeams]            = useState<TeamStat[]>([]);
  const [profile,          setProfile]          = useState<{ full_name: string; role: string; organization_id: string | null } | null>(null);
  const [orgData,          setOrgData]          = useState<OrgData | null>(null);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState(false);
  const [isDemo,           setIsDemo]           = useState(false);
  const [trends,           setTrends]           = useState<WeeklyTrend[]>([]);
  const [alertFeed,        setAlertFeed]        = useState<AlertFeedItem[]>([]);
  const [auditLog,         setAuditLog]         = useState<AuditLogItem[]>([]);
  const [providers,        setProviders]        = useState<ProviderLoad[]>([]);
  const [profId,           setProfId]           = useState<string | null>(null);
  const [reportState,      setReportState]      = useState<"idle"|"loading"|"done">("idle");

  const demoTrends = useMemo(() => buildDemoTrends(), []);

  async function load() {
    setLoading(true); setError(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles").select("id, full_name, role, organization_id")
        .eq("auth_user_id", user.id).single();
      if (prof) { setProfile(prof); setProfId(prof.id); }

      const orgId = prof?.organization_id;
      if (!orgId) {
        setStats(DEMO_STATS); setTeams(DEMO_TEAMS); setTrends(demoTrends);
        setAlertFeed(DEMO_ALERTS); setAuditLog(DEMO_AUDIT); setProviders(DEMO_PROVIDERS);
        setIsDemo(true); setLoading(false); return;
      }

      const [{ data: org }, { data: teamsData }, { data: athleteProfiles }] = await Promise.all([
        supabase.from("organizations").select("id, name, screening_active").eq("id", orgId).single(),
        supabase.from("teams").select("id, name").eq("organization_id", orgId),
        supabase.from("profiles").select("id, team_id").eq("organization_id", orgId).eq("role", "athlete"),
      ]);

      if (org) setOrgData(org as OrgData);

      const totalAthletes = athleteProfiles?.length ?? 0;
      if (totalAthletes === 0) {
        setStats(DEMO_STATS); setTeams(DEMO_TEAMS); setTrends(demoTrends);
        setAlertFeed(DEMO_ALERTS); setAuditLog(DEMO_AUDIT); setProviders(DEMO_PROVIDERS);
        setIsDemo(true); setLoading(false); return;
      }

      const athleteIds = (athleteProfiles ?? []).map(p => p.id);
      const now  = Date.now();
      const d7   = new Date(now - 7  * 86400000).toISOString();
      const d30  = new Date(now - 30 * 86400000).toISOString();
      const d60  = new Date(now - 60 * 86400000).toISOString();
      const d84  = new Date(now - 84 * 86400000).toISOString();

      const [{ data: checkins84 }, { data: checkinsPrev }, { data: alertsData }, { data: auditData }, { data: consentData }] = await Promise.all([
        supabase.from("checkins")
          .select("athlete_id, completed_at, emotional_score, resilience_score, recovery_score, support_score")
          .in("athlete_id", athleteIds).gte("completed_at", d84).order("completed_at", { ascending: false }),
        supabase.from("checkins").select("athlete_id")
          .in("athlete_id", athleteIds).gte("completed_at", d60).lt("completed_at", d30),
        supabase.from("alerts").select("id, athlete_id, severity, created_at")
          .eq("status", "open").order("created_at", { ascending: false }).limit(20),
        supabase.from("audit_logs")
          .select("id, action, created_at, actor:actor_profile_id(full_name)")
          .order("created_at", { ascending: false }).limit(10),
        supabase.from("consent_logs")
          .select("target_profile_id, provider:target_profile_id(full_name, role)")
          .eq("is_active", true),
      ]);

      // ── KPI ──
      const checkins30    = (checkins84 ?? []).filter(c => c.completed_at >= d30);
      const checked7d     = new Set((checkins30 ?? []).filter(c => c.completed_at >= d7).map(c => c.athlete_id)).size;
      const checkinRate7d = totalAthletes > 0 ? Math.round((checked7d / totalAthletes) * 100) : 0;
      const activeThis30d = new Set(checkins30.map(c => c.athlete_id)).size;
      const activeLast30d = new Set((checkinsPrev ?? []).map(c => c.athlete_id)).size;
      const checkinRateMoM = activeLast30d > 0
        ? Math.round(((activeThis30d - activeLast30d) / activeLast30d) * 100) : 0;

      type CheckinRow = {
        athlete_id: string; completed_at: string;
        emotional_score: number | null; resilience_score: number | null;
        recovery_score: number | null; support_score: number | null;
      };
      const latestByAthlete = new Map<string, CheckinRow>();
      checkins30.forEach(c => { if (!latestByAthlete.has(c.athlete_id)) latestByAthlete.set(c.athlete_id, c as CheckinRow); });
      let greenCount = 0, yellowCount = 0, redCount = 0;
      latestByAthlete.forEach(c => {
        const lvl = evaluateRiskLevel({ emotional: c.emotional_score ?? 5, resilience: c.resilience_score ?? 5, recovery: c.recovery_score ?? 5, support: c.support_score ?? 5 }, false);
        if (lvl === "red") redCount++; else if (lvl === "yellow") yellowCount++; else greenCount++;
      });

      const openAlerts   = alertsData?.length ?? 0;
      const redAlerts    = (alertsData ?? []).filter(a => a.severity === "red").length;
      const yellowAlerts = (alertsData ?? []).filter(a => a.severity === "yellow").length;

      setStats({ totalAthletes, checkinRate7d, checkinRateMoM, activeThis30d, activeLast30d, openAlerts, redAlerts, yellowAlerts, greenCount, yellowCount, redCount });

      // ── Weekly trends ──
      const weeklyTrends: WeeklyTrend[] = [];
      for (let w = 7; w >= 0; w--) {
        const wStart = new Date(now - (w + 1) * 7 * 86400000).toISOString();
        const wEnd   = new Date(now - w * 7 * 86400000).toISOString();
        const wRows  = (checkins84 ?? []).filter(c => c.completed_at >= wStart && c.completed_at < wEnd) as CheckinRow[];
        const avg = (key: keyof CheckinRow) => {
          const vals = wRows.map(r => r[key] as number | null).filter((v): v is number => v != null);
          return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
        };
        const label = new Date(wEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        weeklyTrends.push({ week: label, emotional: avg("emotional_score"), resilience: avg("resilience_score"), recovery: avg("recovery_score"), support: avg("support_score") });
      }
      setTrends(weeklyTrends);

      // ── Alert feed ──
      setAlertFeed((alertsData ?? []).slice(0, 6) as AlertFeedItem[]);

      // ── Audit log ──
      type AuditRaw = { id: string; action: string; created_at: string; actor: { full_name: string }[]|{ full_name: string }|null };
      const auditItems: AuditLogItem[] = (auditData ?? []).map((row: AuditRaw) => {
        const actorObj = Array.isArray(row.actor) ? row.actor[0] : row.actor;
        return { id: row.id, action: row.action, actor_name: actorObj?.full_name ?? "System", created_at: row.created_at };
      });
      setAuditLog(auditItems.length > 0 ? auditItems : DEMO_AUDIT);

      // ── Provider load ──
      type ConsentRaw = { target_profile_id: string; provider: { full_name: string; role: string }[]|{ full_name: string; role: string }|null };
      const provMap = new Map<string, { name: string; role: string; count: number }>();
      (consentData ?? []).forEach((c: ConsentRaw) => {
        const p = Array.isArray(c.provider) ? c.provider[0] : c.provider;
        if (!p) return;
        const cur = provMap.get(c.target_profile_id) ?? { name: p.full_name, role: p.role, count: 0 };
        provMap.set(c.target_profile_id, { ...cur, count: cur.count + 1 });
      });
      const CAPACITY: Record<string, number> = { psychiatrist: 12, coach: 20, support: 25 };
      const provRows: ProviderLoad[] = Array.from(provMap.entries()).map(([id, v]) => ({
        id, name: v.name, role: v.role, caseload: v.count, capacity: CAPACITY[v.role] ?? 20,
      })).sort((a, b) => (b.caseload / b.capacity) - (a.caseload / a.capacity));
      setProviders(provRows.length > 0 ? provRows : DEMO_PROVIDERS);

      // ── Teams ──
      const alertsByAthlete = new Map<string, number>();
      (alertsData ?? []).forEach(a => alertsByAthlete.set(a.athlete_id, (alertsByAthlete.get(a.athlete_id) ?? 0) + 1));
      const teamRows: TeamStat[] = (teamsData ?? []).map(team => {
        const teamIds = (athleteProfiles ?? []).filter(p => p.team_id === team.id).map(p => p.id);
        if (teamIds.length === 0) return null;
        const tc7 = checkins30.filter(c => teamIds.includes(c.athlete_id) && c.completed_at >= d7);
        const ltByTeam = new Map<string, CheckinRow>();
        tc7.forEach(c => { if (!ltByTeam.has(c.athlete_id)) ltByTeam.set(c.athlete_id, c as CheckinRow); });
        let tG = 0, tY = 0, tR = 0;
        ltByTeam.forEach(c => {
          const lvl = evaluateRiskLevel({ emotional: c.emotional_score ?? 5, resilience: c.resilience_score ?? 5, recovery: c.recovery_score ?? 5, support: c.support_score ?? 5 }, false);
          if (lvl === "red") tR++; else if (lvl === "yellow") tY++; else tG++;
        });
        return { id: team.id, name: team.name, athleteCount: teamIds.length, checkinRate7d: Math.round((new Set(tc7.map(c => c.athlete_id)).size / teamIds.length) * 100), greenCount: tG, yellowCount: tY, redCount: tR, alertCount: teamIds.reduce((s, id) => s + (alertsByAthlete.get(id) ?? 0), 0) };
      }).filter((t): t is TeamStat => t !== null);
      setTeams(teamRows);
      setIsDemo(false);
    } catch { setError(true); }
    finally   { setLoading(false); }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerateReport() {
    setReportState("loading");
    try {
      if (profId && !isDemo) {
        const supabase = createClient();
        await supabase.from("audit_logs").insert({
          actor_profile_id: profId,
          action: "report_generated",
          target_type: "organization",
          target_id: orgData?.id ?? null,
          metadata: { report_type: "wellness_summary", generated_at: new Date().toISOString() },
        });
      }
      await new Promise(r => setTimeout(r, 800));
      setReportState("done");
      setTimeout(() => setReportState("idle"), 3000);
    } catch { setReportState("idle"); }
  }

  const roleName = profile?.role === "support" ? "Support" : "Admin";

  if (loading) return (
    <DashboardLayout role="admin" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin"
             style={{ borderColor: T.indigoBorder, borderTopColor: T.indigo }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="admin" userName="...">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-xl p-10 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
          <p className="text-[14px] mb-3" style={{ color: T.textMuted }}>Couldn&apos;t load dashboard data.</p>
          <button onClick={load} className="text-[13px] font-semibold" style={{ color: T.indigo }}>Try again</button>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-[22px] font-bold tracking-tight" style={{ color: T.text }}>
                {orgData?.name ?? "Program Overview"}
              </h1>
              {isDemo && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: T.indigoLight, color: T.indigo, border: `1px solid ${T.indigoBorder}` }}>
                  Demo
                </span>
              )}
            </div>
            <p className="text-[13px]" style={{ color: T.textMuted }}>
              {roleName} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            {/* Screening status pill */}
            <div className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full"
                 style={{ background: orgData?.screening_active ? T.greenLight : T.borderSub, color: orgData?.screening_active ? T.green : T.textMuted, border: `1px solid ${orgData?.screening_active ? T.greenBorder : T.border}` }}>
              <div className="h-1.5 w-1.5 rounded-full" style={{ background: orgData?.screening_active ? T.green : T.textMuted }} />
              {orgData?.screening_active ? "Screening active" : "Weekly check-ins"}
            </div>
            {/* Generate Report */}
            <button
              onClick={handleGenerateReport}
              disabled={reportState === "loading"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: reportState === "done" ? T.green : `linear-gradient(135deg, ${T.indigoDark}, ${T.indigo})`, boxShadow: "0 1px 4px rgba(79,70,229,0.3)" }}>
              {reportState === "loading" ? (
                <><span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block"/>Generating…</>
              ) : reportState === "done" ? (
                <><Check className="h-3 w-3"/>Report ready</>
              ) : (
                <><Download className="h-3 w-3"/>Generate Report</>
              )}
            </button>
          </div>
        </div>

        {/* ── KPI strip ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">

          <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center mb-4" style={{ background: T.indigoLight }}>
              <Users2 className="h-4 w-4" style={{ color: T.indigo }} />
            </div>
            <p className="text-[30px] font-bold tabular-nums leading-none mb-1" style={{ color: T.text }}>{stats?.totalAthletes ?? "—"}</p>
            <p className="text-[12px] font-medium" style={{ color: T.textMuted }}>Total athletes</p>
          </div>

          <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
            <div className="flex items-center justify-between mb-4">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: T.indigoLight }}>
                <Zap className="h-4 w-4" style={{ color: T.indigo }} />
              </div>
              <Delta pct={stats?.checkinRateMoM ?? 0} />
            </div>
            <p className="text-[30px] font-bold tabular-nums leading-none mb-1" style={{ color: T.text }}>
              {stats?.checkinRate7d ?? "—"}<span className="text-[16px] font-medium ml-0.5" style={{ color: T.textMuted }}>%</span>
            </p>
            <p className="text-[12px] font-medium mb-3" style={{ color: T.textMuted }}>7-day check-in rate</p>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: T.borderSub }}>
              <div className="h-full rounded-full" style={{ width: `${stats?.checkinRate7d ?? 0}%`, background: `linear-gradient(90deg, ${T.indigo}, #7c3aed)` }} />
            </div>
          </div>

          <Link href="/admin/alerts" className="block rounded-xl p-5 group transition-shadow hover:shadow-md"
                style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
            <div className="flex items-center justify-between mb-4">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                   style={{ background: (stats?.openAlerts ?? 0) > 0 ? T.redLight : T.borderSub }}>
                <AlertTriangle className="h-4 w-4" style={{ color: (stats?.openAlerts ?? 0) > 0 ? T.red : T.textMuted }} />
              </div>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" style={{ color: T.textMuted }} />
            </div>
            <p className="text-[30px] font-bold tabular-nums leading-none mb-1"
               style={{ color: (stats?.openAlerts ?? 0) > 0 ? T.red : T.text }}>
              {stats?.openAlerts ?? "—"}
            </p>
            <p className="text-[12px] font-medium mb-2" style={{ color: T.textMuted }}>Open alerts</p>
            {(stats?.openAlerts ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {(stats?.redAlerts ?? 0) > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: T.redLight, color: T.red }}>
                    {stats?.redAlerts} high
                  </span>
                )}
                {(stats?.yellowAlerts ?? 0) > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: T.amberLight, color: T.amber }}>
                    {stats?.yellowAlerts} moderate
                  </span>
                )}
              </div>
            )}
          </Link>

          <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
            <div className="flex items-center justify-between mb-4">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: T.greenLight }}>
                <UserCheck className="h-4 w-4" style={{ color: T.green }} />
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: T.greenLight, color: T.green }}>
                {providers.filter(p => p.caseload < p.capacity).length} available
              </span>
            </div>
            <p className="text-[30px] font-bold tabular-nums leading-none mb-1" style={{ color: T.text }}>
              {providers.length}
            </p>
            <p className="text-[12px] font-medium" style={{ color: T.textMuted }}>Active providers</p>
          </div>
        </div>

        {/* ── Body: left content + right sidebar ──────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">

          {/* ── Left 2/3 ─────────────────────────────────────────────────── */}
          <div className="col-span-2 space-y-4">

            {/* Pillar trend chart */}
            <div className="rounded-xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: T.text }}>Pillar Trends</p>
                  <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>Weekly averages · 8 weeks</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-semibold">
                  {[
                    { color:"#4f46e5", label:"Emotional"  },
                    { color:"#7c3aed", label:"Resilience" },
                    { color:"#0d9488", label:"Recovery"   },
                    { color:"#d97706", label:"Support"    },
                  ].map(p => (
                    <div key={p.label} className="flex items-center gap-1">
                      <div className="h-2 w-4 rounded-full" style={{ background: p.color }} />
                      <span style={{ color: T.textMuted }}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.borderSub} vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: T.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: T.textMuted }} axisLine={false} tickLine={false} ticks={[0, 2.5, 5, 7.5, 10]} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="emotional"  name="Emotional"  stroke="#4f46e5" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="resilience" name="Resilience" stroke="#7c3aed" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="recovery"   name="Recovery"   stroke="#0d9488" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="support"    name="Support"    stroke="#d97706" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Team breakdown */}
            {teams.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
                <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <p className="text-[14px] font-semibold" style={{ color: T.text }}>Team Breakdown</p>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: T.borderSub, color: T.textMuted }}>
                    7-day window
                  </span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: T.raised, borderBottom: `1px solid ${T.border}` }}>
                      {["Team","Athletes","Check-In","Wellness","Alerts"].map(h => (
                        <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((team, i) => {
                      const total = team.greenCount + team.yellowCount + team.redCount;
                      return (
                        <tr key={team.id} className="group hover:bg-gray-50/70 transition-colors"
                            style={{ borderTop: i > 0 ? `1px solid ${T.borderSub}` : undefined }}>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-[13px]" style={{ color: T.text }}>{team.name}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[13px] font-medium tabular-nums" style={{ color: T.textSub }}>{team.athleteCount}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: T.borderSub }}>
                                <div className="h-full rounded-full"
                                     style={{ width: `${team.checkinRate7d}%`, background: team.checkinRate7d >= 70 ? T.green : team.checkinRate7d >= 50 ? T.amber : T.red }} />
                              </div>
                              <span className="text-[12px] font-bold tabular-nums"
                                    style={{ color: team.checkinRate7d >= 70 ? T.green : team.checkinRate7d >= 50 ? T.amber : T.red }}>
                                {team.checkinRate7d}%
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 w-48">
                            <div className="flex items-center gap-2">
                              <div className="flex h-1.5 rounded-full overflow-hidden flex-1 gap-px">
                                {team.greenCount  > 0 && <div style={{ width:`${(team.greenCount/total)*100}%`,  background:T.green }} />}
                                {team.yellowCount > 0 && <div style={{ width:`${(team.yellowCount/total)*100}%`, background:T.amber }} />}
                                {team.redCount    > 0 && <div style={{ width:`${(team.redCount/total)*100}%`,    background:T.red   }} />}
                              </div>
                              <span className="text-[10px] font-medium shrink-0" style={{ color: T.textMuted }}>
                                {team.greenCount}/{team.athleteCount}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            {team.alertCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg"
                                    style={{ background: T.redLight, color: T.red }}>
                                <AlertTriangle className="h-3 w-3" />{team.alertCount}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg"
                                    style={{ background: T.greenLight, color: T.green }}>Clear</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Right 1/3 ────────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Alert feed */}
            <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
              <div className="px-4 py-3.5 flex items-center justify-between"
                   style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5" style={{ color: alertFeed.length > 0 ? T.red : T.textMuted }} />
                  <p className="text-[13px] font-semibold" style={{ color: T.text }}>Alerts</p>
                </div>
                <Link href="/admin/alerts">
                  <span className="text-[11px] font-semibold" style={{ color: T.indigo }}>See all →</span>
                </Link>
              </div>
              {alertFeed.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-[12px]" style={{ color: T.textMuted }}>No open alerts</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: T.borderSub }}>
                  {alertFeed.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 px-4 py-3 relative">
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
                           style={{ background: alert.severity === "red" ? T.red : T.amber }} />
                      <div className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                           style={{ background: alert.severity === "red" ? T.redLight : T.amberLight }}>
                        <AlertTriangle className="h-3 w-3" style={{ color: alert.severity === "red" ? T.red : T.amber }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded"
                                style={{ background: alert.severity === "red" ? T.redLight : T.amberLight, color: alert.severity === "red" ? T.red : T.amber }}>
                            {alert.severity === "red" ? "High" : "Moderate"}
                          </span>
                          <span className="text-[10px] shrink-0" style={{ color: T.textMuted }}>
                            {timeAgoShort(alert.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] mt-1 font-mono truncate" style={{ color: T.textMuted }}>
                          athlete #{alert.athlete_id.slice(-4)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity feed */}
            <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
              <div className="px-4 py-3.5 flex items-center justify-between"
                   style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" style={{ color: T.indigo }} />
                  <p className="text-[13px] font-semibold" style={{ color: T.text }}>Activity</p>
                </div>
                <Link href="/admin/audit-logs">
                  <span className="text-[11px] font-semibold" style={{ color: T.indigo }}>Logs →</span>
                </Link>
              </div>
              <div className="divide-y" style={{ borderColor: T.borderSub }}>
                {auditLog.slice(0, 6).map(item => {
                  const ac = actionColor(item.action);
                  return (
                    <div key={item.id} className="px-4 py-2.5 flex items-start gap-2.5">
                      <div className="h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                           style={{ background: ac.bg }}>
                        <FileText className="h-2.5 w-2.5" style={{ color: ac.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] leading-snug" style={{ color: T.textSub }}>
                          <span className="font-semibold">{item.actor_name}</span>{" "}
                          {actionLabel(item.action)}
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: T.textMuted }}>{timeAgoShort(item.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Counselor load balancer */}
            <div className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
              <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-3.5 w-3.5" style={{ color: T.indigo }} />
                  <p className="text-[13px] font-semibold" style={{ color: T.text }}>Provider Load</p>
                </div>
              </div>
              <div className="p-4 space-y-3.5">
                {providers.map(prov => {
                  const pct  = Math.min((prov.caseload / prov.capacity) * 100, 100);
                  const barColor = pct >= 90 ? T.red : pct >= 70 ? T.amber : T.indigo;
                  return (
                    <div key={prov.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-[12px] font-semibold truncate" style={{ color: T.text }}>{prov.name}</p>
                          <p className="text-[10px] capitalize" style={{ color: T.textMuted }}>{prov.role}</p>
                        </div>
                        <span className="text-[11px] font-bold tabular-nums shrink-0 ml-2"
                              style={{ color: barColor }}>
                          {prov.caseload}/{prov.capacity}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.borderSub }}>
                        <div className="h-full rounded-full transition-all"
                             style={{ width: `${pct}%`, background: barColor }} />
                      </div>
                    </div>
                  );
                })}
                {providers.length === 0 && (
                  <p className="text-[12px] text-center py-2" style={{ color: T.textMuted }}>No providers yet</p>
                )}
              </div>
            </div>

            {/* Semester screening */}
            <div className="rounded-xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
              <p className="text-[13px] font-semibold mb-3" style={{ color: T.text }}>Semester Screening</p>
              {orgData?.screening_active ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: T.green }} />
                    <p className="text-[12px] font-semibold" style={{ color: T.green }}>Screening is live</p>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: T.textMuted }}>
                    Athletes see the full semester screening form.
                  </p>
                  <button
                    disabled={screeningLoading}
                    onClick={async () => {
                      if (!orgData?.id) return;
                      setScreeningLoading(true);
                      try {
                        await createClient().from("organizations").update({ screening_active: false }).eq("id", orgData.id);
                        setOrgData(prev => prev ? { ...prev, screening_active: false } : prev);
                      } finally { setScreeningLoading(false); }
                    }}
                    className="w-full flex items-center justify-center gap-2 h-9 text-[12px] font-semibold rounded-lg border transition-colors disabled:opacity-50"
                    style={{ borderColor: T.border, color: T.textSub, background: T.raised }}>
                    <StopCircle className="h-3.5 w-3.5" />
                    {screeningLoading ? "Deactivating…" : "Deactivate"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] leading-relaxed" style={{ color: T.textMuted }}>
                    Push a full wellness screening to all athletes.
                  </p>
                  <button
                    disabled={screeningLoading}
                    onClick={async () => {
                      setScreeningLoading(true);
                      try {
                        if (orgData?.id) {
                          await createClient().from("organizations").update({ screening_active: true }).eq("id", orgData.id);
                          setOrgData(prev => prev ? { ...prev, screening_active: true } : prev);
                        }
                      } finally { setScreeningLoading(false); }
                    }}
                    className="w-full flex items-center justify-center gap-2 h-9 text-[12px] font-semibold text-white rounded-lg transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${T.indigoDark}, ${T.indigo})`, boxShadow: shadowMd }}>
                    <PlayCircle className="h-3.5 w-3.5" />
                    {screeningLoading ? "Activating…" : "Activate Screening"}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Compliance footer ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-2 px-1">
          <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: T.textMuted }} />
          <p className="text-[11px] leading-relaxed" style={{ color: T.textMuted }}>
            Coaches see only anonymized team aggregates (FERPA § 99.31). Individual athlete data is protected.
            Crisis disclosures are covered under FERPA § 99.36 health/safety exception and NCAA 2023 Mental Health Best Practices.
            All admin actions are logged in the audit trail.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
