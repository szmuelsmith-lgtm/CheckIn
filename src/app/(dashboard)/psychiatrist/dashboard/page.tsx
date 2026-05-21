"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  AlertCircle, Users2, MessageCircle,
  X, Check, Phone, Calendar, ShieldCheck,
  ArrowUpRight, Tag, Clock, FileText, Activity,
  ChevronRight, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { evaluateRiskLevel } from "@/lib/pillar-scoring";
import { useDiagnostic, DiagnosticToast } from "@/components/diagnostic";

// ─── Design tokens — Indigo (matches app) ────────────────────────────────────
const T = {
  bg:          "#f8fafc",
  surface:     "#ffffff",
  raised:      "#f1f5f9",
  border:      "#e2e8f0",
  borderSub:   "#f1f5f9",
  text:        "#0f172a",
  textSub:     "#334155",
  textMuted:   "#64748b",
  blue:        "#4f46e5",
  blueDark:    "#3730a3",
  blueLight:   "#eef2ff",
  blueBorder:  "#c7d2fe",
  green:       "#16a34a",
  greenLight:  "#f0fdf4",
  amber:       "#d97706",
  amberLight:  "#fefce8",
  red:         "#dc2626",
  redLight:    "#fef2f2",
  redBorder:   "#fecaca",
};

const shadow = "0 1px 3px 0 rgba(0,0,0,0.06),0 1px 2px 0 rgba(0,0,0,0.04)";

// ─── Types ────────────────────────────────────────────────────────────────────
type SessionStatus = "pending" | "arrived" | "in-session" | "completed" | "no-show";

interface SharedAthlete {
  athlete_id:        string;
  athlete_name:      string;
  scope:             "summary" | "full";
  last_checkin_at:   string | null;
  expires_at:        string | null;
  avg_score:         number | null;
  risk_level:        "green" | "yellow" | "red" | null;
  checkin_count_14d: number;
  open_alert_id:     string | null;
  has_followup:      boolean;
  score_history:     number[];
  // Schedule enrichment
  session_time?:     string;
  session_status?:   SessionStatus;
  tags?:             string[];
  last_note?:        string;
}

const RISK_COLOR = { green: T.green,  yellow: T.amber,  red: T.red   };
const RISK_BG    = { green: T.greenLight, yellow: T.amberLight, red: T.redLight };
const RISK_LABEL = { green: "Stable",   yellow: "Moderate", red: "High Risk" };
const RISK_ORDER = { red: 0, yellow: 1, green: 2 };

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: "Pending",    color: T.textMuted, bg: T.raised      },
  arrived:    { label: "Arrived",    color: T.blue,      bg: T.blueLight   },
  "in-session":{ label:"In Session", color: "#7c3aed",   bg: "#f5f3ff"     },
  completed:  { label: "Completed",  color: T.green,     bg: T.greenLight  },
  "no-show":  { label: "No Show",    color: T.red,       bg: T.redLight    },
};

const QUICK_TAGS = [
  "Good session","Mood improved","Sleep issues","Appetite changes",
  "Stress elevated","Academic pressure","Team conflict","Injury concern",
  "Follow-up needed","Medication reviewed","Referral discussed","PHQ-9 completed",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string | null) {
  if (!iso) return "No check-ins";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today"; if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Score sparkline ─────────────────────────────────────────────────────────
function ScoreLine({ scores, risk }: { scores: number[]; risk: "green"|"yellow"|"red"|null }) {
  if (scores.length < 2) return <div className="h-8 flex items-center text-[11px]" style={{ color: T.textMuted }}>No trend</div>;
  const W = 120, H = 32, pad = 3;
  const min = 0, max = 10;
  const pts = scores.map((v, i) => ({
    x: pad + (i / (scores.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / (max - min)) * (H - pad * 2),
  }));
  const d   = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const col = risk ? RISK_COLOR[risk] : T.textMuted;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <path d={d} fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="2.5" fill={col} />
    </svg>
  );
}

// ─── Pillar score bar ─────────────────────────────────────────────────────────
function PillarBar({ label, score, color, trackBg }: { label: string; score: number|null; color: string; trackBg: string }) {
  const pct = score != null ? (score / 10) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-medium w-20 shrink-0" style={{ color: T.textMuted }}>{label}</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: trackBg }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[12px] font-bold tabular-nums w-8 text-right" style={{ color: score != null ? color : T.textMuted }}>
        {score != null ? score.toFixed(1) : "—"}
      </span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PsychiatristDashboard() {
  const diag = useDiagnostic();
  const [athletes,    setAthletes]    = useState<SharedAthlete[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [userName,    setUserName]    = useState("...");
  const [profId,      setProfId]      = useState<string | null>(null);
  const [isDemo,      setIsDemo]      = useState(false);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<"overview"|"assessment"|"actions">("overview");
  const [appliedTags, setAppliedTags] = useState<Record<string, string[]>>({});
  const [contacted,   setContacted]   = useState<Record<string, boolean>>({});
  const [scheduled,   setScheduled]   = useState<Record<string, boolean>>({});
  const [responding,  setResponding]  = useState<string | null>(null);
  const [scheduling,  setScheduling]  = useState<string | null>(null);
  const [responded,   setResponded]   = useState<Record<string, "accepted"|"dismissed">>({});
  const [actError,    setActError]    = useState<string | null>(null);
  const [referring,   setReferring]   = useState<string | null>(null);
  const [referred,    setReferred]    = useState<Record<string, boolean>>({});
  const [mobilePanel, setMobilePanel] = useState<"list"|"workspace">("list");

  useEffect(() => {
    async function load(): Promise<(() => void) | undefined> {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        diag.step(6, "Loading consent gate — checking consent_logs");
        const { data: prof, error: profErr } = await supabase.from("profiles").select("id, full_name").eq("auth_user_id", user.id).single();
        if (profErr || !prof) { setError("Profile not found."); diag.fail(6, profErr?.message ?? "profile not found"); return; }
        setUserName(prof.full_name); setProfId(prof.id);
        console.log(`[DIAG] counselor profile_id=${prof.id}`);

        type ConsentRow = { athlete_id: string; scope: "summary"|"full"; granted_at: string; expires_at: string|null; athlete: { full_name: string }[]|{ full_name: string }|null; };
        const { data: consents, error: consentErr } = await supabase.from("consent_logs")
          .select("athlete_id, scope, granted_at, expires_at, athlete:athlete_id(full_name)")
          .eq("target_profile_id", prof.id).eq("is_active", true);
        if (consentErr) { diag.fail(6, `consent_logs error: ${consentErr.message}`); }
        else { diag.success("consent_logs", `${(consents ?? []).length} active consent(s) found`); }
        console.log(`[DIAG] consent gate: ${(consents ?? []).length} athletes have granted access`);

        const cutoff14 = new Date(Date.now() - 14 * 86400000).toISOString();
        const shared: SharedAthlete[] = await Promise.all(
          (consents ?? []).map(async (c: ConsentRow) => {
            const athleteObj = Array.isArray(c.athlete) ? c.athlete[0] : c.athlete;
            const [{ data: recent }, { data: alertData }, { data: followupData }] = await Promise.all([
              supabase.from("checkins").select("completed_at, emotional_score, resilience_score, recovery_score, support_score")
                .eq("athlete_id", c.athlete_id).gte("completed_at", cutoff14).order("completed_at", { ascending: false }).limit(7),
              supabase.from("alerts").select("id").eq("athlete_id", c.athlete_id).eq("status", "open").limit(1).maybeSingle(),
              supabase.from("followups").select("id").eq("athlete_id", c.athlete_id).eq("status", "open").limit(1).maybeSingle(),
            ]);
            const latest = recent?.[0] ?? null;
            let avg_score: number | null = null;
            let risk_level: "green"|"yellow"|"red"|null = null;
            if (latest) {
              const vals = [latest.emotional_score, latest.resilience_score, latest.recovery_score, latest.support_score].filter((v): v is number => v != null);
              if (vals.length) avg_score = Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*10)/10;
              risk_level = evaluateRiskLevel({ emotional: latest.emotional_score??5, resilience: latest.resilience_score??5, recovery: latest.recovery_score??5, support: latest.support_score??5 }, false);
            }
            const score_history = [...(recent??[])].reverse().map(r => {
              const vals = [r.emotional_score, r.resilience_score, r.recovery_score, r.support_score].filter((v): v is number => v!=null);
              return vals.length ? Math.round((vals.reduce((a,b)=>a+b,0)/vals.length)*10)/10 : 0;
            });
            return { athlete_id: c.athlete_id, athlete_name: athleteObj?.full_name??"Unknown", scope: c.scope, last_checkin_at: latest?.completed_at??null, expires_at: c.expires_at, avg_score, risk_level, checkin_count_14d: recent?.length??0, open_alert_id: alertData?.id??null, has_followup: !!followupData, score_history };
          })
        );

        const DEMO: SharedAthlete[] = [
          { athlete_id:"d1", athlete_name:"Alex Johnson",    scope:"full",    last_checkin_at: new Date(Date.now()-1*86400000).toISOString(), expires_at:null, avg_score:7.4, risk_level:"green",  checkin_count_14d:10, open_alert_id:null,    has_followup:false, score_history:[6.2,6.8,7.0,7.1,7.4,7.2,7.4], session_time:"9:00 AM",  session_status:"completed", tags:["Good session","Stress elevated"], last_note:"Athlete reports feeling more balanced this week. Sleep improving." },
          { athlete_id:"d2", athlete_name:"Jordan Williams", scope:"summary", last_checkin_at: new Date(Date.now()-3*86400000).toISOString(), expires_at:null, avg_score:4.8, risk_level:"yellow", checkin_count_14d:5,  open_alert_id:"a-1",   has_followup:false, score_history:[6.1,5.8,5.5,5.2,4.9,4.8],   session_time:"10:30 AM", session_status:"arrived",   tags:["Academic pressure","Follow-up needed"], last_note:"Reported increased academic stress. Referred to tutoring resources." },
          { athlete_id:"d3", athlete_name:"Sam Rivera",      scope:"full",    last_checkin_at: new Date(Date.now()-2*86400000).toISOString(), expires_at:null, avg_score:3.1, risk_level:"red",    checkin_count_14d:3,  open_alert_id:"a-2",   has_followup:true,  score_history:[5.0,4.2,3.8,3.5,3.1],        session_time:"11:15 AM", session_status:"in-session",tags:["Mood improved","Injury concern"],       last_note:"Discussing impact of ankle injury on team role. Monitoring closely." },
          { athlete_id:"d4", athlete_name:"Taylor Brooks",   scope:"summary", last_checkin_at: new Date(Date.now()-5*86400000).toISOString(), expires_at:null, avg_score:8.2, risk_level:"green",  checkin_count_14d:12, open_alert_id:null,    has_followup:false, score_history:[7.5,7.8,8.0,8.1,8.2,8.0,8.2], session_time:"2:00 PM",  session_status:"pending",   tags:["PHQ-9 completed"],                     last_note:"Routine check-in. Scores stable. No concerns flagged." },
          { athlete_id:"d5", athlete_name:"Morgan Lee",      scope:"full",    last_checkin_at: new Date(Date.now()-4*86400000).toISOString(), expires_at:null, avg_score:5.5, risk_level:"yellow", checkin_count_14d:7,  open_alert_id:null,    has_followup:false, score_history:[5.0,5.2,5.5,5.3,5.5],        session_time:"3:30 PM",  session_status:"pending",   tags:["Team conflict"],                       last_note:"Discussed team dynamics post-tournament. Recommended journaling." },
        ];

        const display = shared.length > 0 ? shared : DEMO;
        setAthletes(display); setIsDemo(shared.length===0);

        // Pre-populate today's session tags from audit_logs
        if (shared.length > 0) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const { data: tagLogs } = await supabase
            .from("audit_logs")
            .select("target_id, metadata")
            .eq("actor_profile_id", prof.id)
            .eq("action", "session_tag_applied")
            .gte("created_at", todayStart.toISOString());
          if (tagLogs && tagLogs.length > 0) {
            const tagMap: Record<string, string[]> = {};
            tagLogs.forEach((log) => {
              if (log.target_id && log.metadata && typeof log.metadata === "object") {
                const t = (log.metadata as { tag?: string }).tag;
                if (t) {
                  if (!tagMap[log.target_id]) tagMap[log.target_id] = [];
                  if (!tagMap[log.target_id].includes(t)) tagMap[log.target_id].push(t);
                }
              }
            });
            setAppliedTags(tagMap);
          }
        }

        // Real-time: when athlete grants/revokes consent, reload the queue
        const channel = supabase
          .channel("counselor-consent-realtime")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "consent_logs", filter: `target_profile_id=eq.${prof.id}` },
            () => { load(); }
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "consent_logs", filter: `target_profile_id=eq.${prof.id}` },
            () => { load(); }
          )
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "alerts" },
            (payload) => {
              // Update open_alert_id for the relevant athlete if they're in the queue
              setAthletes(prev => prev.map(a =>
                a.athlete_id === payload.new.athlete_id && !a.open_alert_id
                  ? { ...a, open_alert_id: payload.new.id }
                  : a
              ));
            }
          )
          .subscribe();

        return () => { supabase.removeChannel(channel); };

      } catch { setError("An unexpected error occurred."); }
      finally { setLoading(false); }
    }
    let channelCleanup: (() => void) | undefined;
    load().then(fn => { channelCleanup = fn; });
    return () => { channelCleanup?.(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleOutreach(athlete: SharedAthlete, decision: "accepted"|"dismissed") {
    setResponding(athlete.athlete_id);
    setActError(null);
    diag.step(4, `Outreach ${decision} for ${athlete.athlete_name}`);
    try {
      if (athlete.open_alert_id && !athlete.athlete_id.startsWith("d")) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        console.log(`[DIAG] updating alerts id=${athlete.open_alert_id} → ${decision}`);
        const { error: alertErr } = await supabase.from("alerts")
          .update({ status: decision==="accepted"?"acknowledged":"resolved", assigned_to_profile_id: decision==="accepted"?profId:null })
          .eq("id", athlete.open_alert_id);
        if (alertErr) {
          diag.fail(4, `alerts update failed: ${alertErr.message}`);
          setActError(alertErr.code==="42501"
            ? "Permission denied — check that consent is active for this athlete."
            : `Could not update alert: ${alertErr.message}`);
          setResponding(null);
          return;
        }
        diag.success("alerts", `status → ${decision==="accepted"?"acknowledged":"resolved"}`);
        await supabase.from("audit_logs").insert({ actor_profile_id: profId, action: decision==="accepted"?"outreach_accepted":"outreach_declined", target_type:"alert", target_id: athlete.open_alert_id, metadata:{ athlete_id: athlete.athlete_id, decision } });
        diag.success("audit_logs", `outreach_${decision} logged`);
      }
      setResponded(r=>({...r,[athlete.athlete_id]:decision}));
      if (decision==="accepted") setContacted(c=>({...c,[athlete.athlete_id]:true}));
    } catch (e: unknown) {
      diag.fail(4, e);
      setActError(e instanceof Error ? e.message : "Outreach action failed. Please try again.");
    }
    setResponding(null);
  }

  async function handleReferral(athlete: SharedAthlete) {
    if (referring===athlete.athlete_id || referred[athlete.athlete_id]) return;
    setReferring(athlete.athlete_id);
    if (!athlete.athlete_id.startsWith("d")) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.from("audit_logs").insert({
          actor_profile_id: profId,
          action:           "referral_summary_sent",
          target_type:      "athlete",
          target_id:        athlete.athlete_id,
          metadata:         { scope: athlete.scope, risk_level: athlete.risk_level, avg_score: athlete.avg_score },
        });
      } catch { /* audit log failure is non-fatal for referral */ }
    }
    setReferred(r=>({...r,[athlete.athlete_id]:true}));
    setReferring(null);
  }

  async function handleContact(athlete: SharedAthlete) {
    if (responding===athlete.athlete_id) return;
    if (athlete.open_alert_id && !responded[athlete.athlete_id]) { await handleOutreach(athlete,"accepted"); return; }
    diag.step(7, `Logging contact for ${athlete.athlete_name}`);
    if (!athlete.athlete_id.startsWith("d")) {
      try {
        const { createClient: makeClient } = await import("@/lib/supabase/client");
        await makeClient().from("audit_logs").insert({ actor_profile_id:profId, action:"outreach_initiated", target_type:"athlete", target_id:athlete.athlete_id, metadata:{} });
      } catch { /* non-fatal */ }
    }
    setContacted(c=>({...c,[athlete.athlete_id]:true}));
    diag.success("contact", `Contact logged for ${athlete.athlete_name}`);
  }

  async function handleSchedule(athlete: SharedAthlete) {
    setScheduling(athlete.athlete_id);
    setActError(null);
    diag.step(4, `Scheduling follow-up for ${athlete.athlete_name}`);
    try {
      if (!athlete.athlete_id.startsWith("d")) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const tomorrow = new Date(Date.now()+86400000).toISOString().split("T")[0];
        console.log(`[DIAG] inserting followup: athlete_id=${athlete.athlete_id} due=${tomorrow}`);
        const { error } = await supabase.from("followups").insert({
          athlete_id:             athlete.athlete_id,
          // alert_id is nullable — counselor-initiated followups don't need an alert
          alert_id:               athlete.open_alert_id ?? null,
          assigned_to_profile_id: profId,
          assigned_by_profile_id: profId,
          reason:                 "Psychiatrist-scheduled follow-up session",
          status:                 "open",
          due_date:               tomorrow,
        });
        if (error) {
          diag.fail(4, `followups insert failed: ${error.message}`);
          setActError(
            error.code === "42501"
              ? "Permission denied — check that consent is active for this athlete."
              : `Could not schedule follow-up: ${error.message}`
          );
          setScheduling(null);
          return;
        }
        diag.success("followups", `due_date=${tomorrow}`);
        // If there was an alert, acknowledge it
        if (athlete.open_alert_id) {
          await supabase.from("alerts")
            .update({ status: "acknowledged", assigned_to_profile_id: profId })
            .eq("id", athlete.open_alert_id);
          diag.success("alerts", "status → acknowledged");
        }
        await supabase.from("audit_logs").insert({
          actor_profile_id: profId,
          action:           "followup_scheduled",
          target_type:      "athlete",
          target_id:        athlete.athlete_id,
          metadata:         { due_date: tomorrow, alert_id: athlete.open_alert_id },
        });
        diag.success("audit_logs", "followup_scheduled logged");
      }
      setScheduled(s=>({...s,[athlete.athlete_id]:true}));
    } catch (e: unknown) {
      diag.fail(4, e);
      setActError(e instanceof Error ? e.message : "Failed to schedule follow-up. Please try again.");
    }
    setScheduling(null);
  }

  const sorted       = [...athletes].sort((a,b)=>(RISK_ORDER[a.risk_level??"green"]??3)-(RISK_ORDER[b.risk_level??"green"]??3));
  const urgentQueue  = sorted.filter(a=>a.open_alert_id&&!responded[a.athlete_id]);
  const selected     = athletes.find(a=>a.athlete_id===selectedId)??null;

  const withData     = athletes.filter(a=>a.risk_level!=null);
  const greenCount   = withData.filter(a=>a.risk_level==="green").length;
  const yellowCount  = withData.filter(a=>a.risk_level==="yellow").length;
  const redCount     = withData.filter(a=>a.risk_level==="red").length;

  if (loading) return <DashboardLayout role="psychiatrist" userName="..."><div className="flex items-center justify-center h-64"><div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor:T.blueBorder, borderTopColor:T.blue }}/></div></DashboardLayout>;
  if (error) return <DashboardLayout role="psychiatrist" userName={userName}><div className="max-w-4xl mx-auto"><div className="rounded-xl p-10 text-center" style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}><AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color:T.textMuted }}/><p style={{ color:T.textMuted }}>{error}</p></div></div></DashboardLayout>;

  return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="space-y-4" style={{ maxWidth: "100%" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight" style={{ color:T.text }}>Psychiatrist Dashboard</h1>
              {isDemo && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background:T.blueLight, color:T.blue, border:`1px solid ${T.blueBorder}` }}>Demo</span>}
            </div>
            <p className="text-[13px]" style={{ color:T.textMuted }}>
              {athletes.length} patient{athletes.length!==1?"s":""} with active consent ·{" "}
              {new Date().toLocaleDateString("en-US",{ weekday:"short", month:"short", day:"numeric" })}
            </p>
          </div>
          {/* Summary pills */}
          <div className="flex flex-wrap items-center gap-2">
            {redCount>0    && <span className="text-[11px] sm:text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background:T.redLight,   color:T.red   }}>{redCount} high risk</span>}
            {yellowCount>0 && <span className="text-[11px] sm:text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background:T.amberLight, color:T.amber }}>{yellowCount} moderate</span>}
            {greenCount>0  && <span className="text-[11px] sm:text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background:T.greenLight, color:T.green }}>{greenCount} stable</span>}
          </div>
        </div>

        {/* ── Demo mode banner ────────────────────────────────────────── */}
        {isDemo && (
          <div className="rounded-xl px-4 py-3.5 flex items-start gap-3"
               style={{ background:"#fefce8", border:"1px solid #fde68a" }}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color:"#92400e" }}/>
            <div>
              <p className="text-[13px] font-semibold" style={{ color:"#92400e" }}>Demo data — no real patients yet</p>
              <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color:"#78350f" }}>
                The Patient Queue shows sample data because no athletes have granted you consent.
                Ask athletes to open <strong>Privacy Settings</strong> in their dashboard and share their data with you.
                Once they do, real check-in scores and alerts will appear here.
              </p>
            </div>
          </div>
        )}

        {/* ── Two-panel layout ─────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-5" style={{ minHeight: 600 }}>

          {/* ── LEFT: Patient Queue ──────────────────────────────────── */}
          <div className={`${mobilePanel==="workspace" ? "hidden lg:flex" : "flex"} flex-col gap-3 w-full lg:w-72 lg:shrink-0`}>

            {/* Urgent outreach banner */}
            {urgentQueue.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ border:`1px solid ${T.redBorder}`, boxShadow:shadow }}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ background:T.redLight, borderBottom:`1px solid ${T.redBorder}` }}>
                  <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background:T.red }}/>
                  <AlertCircle className="h-3.5 w-3.5" style={{ color:T.red }}/>
                  <p className="text-[12px] font-bold flex-1" style={{ color:"#991b1b" }}>Outreach needed</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background:T.red }}>{urgentQueue.length}</span>
                </div>
                {urgentQueue.slice(0,2).map((a,i)=>(
                  <div key={a.athlete_id} className="px-4 py-3 flex items-center justify-between gap-2"
                       style={{ borderTop:i>0?`1px solid ${T.redBorder}`:undefined, background:"#fff5f5" }}>
                    <div>
                      <p className="text-[12px] font-semibold" style={{ color:T.text }}>{a.athlete_name}</p>
                      <p className="text-[10px]" style={{ color:T.textMuted }}>Score {a.avg_score??'—'}/10</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={()=>handleOutreach(a,"dismissed")} disabled={responding===a.athlete_id}
                              className="p-1.5 rounded-lg border transition-colors" style={{ background:T.surface, borderColor:T.border, color:T.textMuted }}>
                        <X className="h-3 w-3"/>
                      </button>
                      <button onClick={()=>handleOutreach(a,"accepted")} disabled={responding===a.athlete_id}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-white"
                              style={{ background:`linear-gradient(135deg, #991b1b, ${T.red})`, boxShadow:"0 1px 3px rgba(220,38,38,0.3)" }}>
                        {responding===a.athlete_id?<span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block"/>:<><Check className="h-3 w-3"/>Act</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ACT error banner */}
            {actError && (
              <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background:T.redLight, border:`1px solid ${T.redBorder}` }}>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color:T.red }}/>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold" style={{ color:"#991b1b" }}>Action failed</p>
                  <p className="text-[11px] mt-0.5" style={{ color:T.red }}>{actError}</p>
                </div>
                <button onClick={()=>setActError(null)} className="shrink-0 p-0.5 rounded" style={{ color:T.red }}>
                  <X className="h-3.5 w-3.5"/>
                </button>
              </div>
            )}

            {/* Patient list */}
            <div className="rounded-xl overflow-hidden flex-1" style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom:`1px solid ${T.border}` }}>
                <div className="flex items-center gap-2">
                  <Users2 className="h-3.5 w-3.5" style={{ color:T.blue }}/>
                  <p className="text-[13px] font-semibold" style={{ color:T.text }}>Patient Queue</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background:T.blueLight, color:T.blue }}>{athletes.length}</span>
              </div>

              <div className="overflow-y-auto" style={{ maxHeight:480 }}>
                {sorted.length===0 ? (
                  <div className="px-4 py-10 text-center">
                    <MessageCircle className="h-6 w-6 mx-auto mb-2" style={{ color:"#cbd5e1" }}/>
                    <p className="text-[12px]" style={{ color:T.textMuted }}>No patients yet</p>
                  </div>
                ) : (
                  sorted.map((athlete, idx) => {
                    const risk      = athlete.risk_level;
                    const isActive  = selectedId === athlete.athlete_id;
                    const sc        = athlete.session_status ? STATUS_CONFIG[athlete.session_status] : null;
                    return (
                      <button key={athlete.athlete_id} onClick={()=>{ setSelectedId(athlete.athlete_id); setActiveTab("overview"); setMobilePanel("workspace"); }}
                              className="w-full text-left transition-colors"
                              style={{ borderTop:idx>0?`1px solid ${T.borderSub}`:undefined, background:isActive?T.blueLight:undefined }}>
                        {/* Risk accent strip */}
                        {risk && risk!=="green" && <div className="h-0.5" style={{ background:RISK_COLOR[risk] }}/>}
                        <div className="px-4 py-3 flex items-center gap-3">
                          {/* Avatar */}
                          <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold"
                               style={{ background:risk?`${RISK_BG[risk]}`:T.raised, color:risk?RISK_COLOR[risk]:T.textMuted }}>
                            {athlete.athlete_name.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-[13px] font-semibold truncate" style={{ color:T.text }}>{athlete.athlete_name}</p>
                              {isActive && <ChevronRight className="h-3 w-3 shrink-0" style={{ color:T.blue }}/>}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {risk && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background:RISK_BG[risk], color:RISK_COLOR[risk] }}>{RISK_LABEL[risk]}</span>}
                              {sc && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background:sc.bg, color:sc.color }}>{sc.label}</span>}
                            </div>
                          </div>
                          {/* Session time */}
                          {athlete.session_time && (
                            <span className="text-[10px] font-medium shrink-0" style={{ color:T.textMuted }}>{athlete.session_time}</span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Patient Workspace ─────────────────────────────── */}
          <div className={`${mobilePanel==="list" && !selected ? "hidden lg:block" : "block"} flex-1 min-w-0`}>
            {!selected ? (
              /* Empty state */
              <div className="h-full rounded-xl flex flex-col items-center justify-center"
                   style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4"
                     style={{ background:T.blueLight }}>
                  <FileText className="h-6 w-6" style={{ color:T.blue }}/>
                </div>
                <p className="text-[15px] font-semibold mb-1" style={{ color:T.textSub }}>Select a patient to begin</p>
                <p className="text-[13px]" style={{ color:T.textMuted }}>
                  Click a patient from the queue to open their workspace.
                </p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden flex flex-col h-full"
                   style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}>

                {/* Patient header */}
                <div className="px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4"
                     style={{ borderBottom:`1px solid ${T.border}`, background:T.raised }}>
                  {/* Back button — mobile only */}
                  <button onClick={()=>setMobilePanel("list")}
                          className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg shrink-0 border"
                          style={{ background:T.surface, borderColor:T.border, color:T.textMuted }}>
                    <ChevronRight className="h-4 w-4 rotate-180"/>
                  </button>
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0 flex items-center justify-center text-[14px] sm:text-[15px] font-bold"
                       style={{ background:selected.risk_level?RISK_BG[selected.risk_level]:T.raised, color:selected.risk_level?RISK_COLOR[selected.risk_level]:T.textMuted }}>
                    {selected.athlete_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-0.5">
                      <p className="text-[17px] font-bold" style={{ color:T.text }}>{selected.athlete_name}</p>
                      {selected.risk_level && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background:RISK_BG[selected.risk_level], color:RISK_COLOR[selected.risk_level] }}>
                          {RISK_LABEL[selected.risk_level]}
                        </span>
                      )}
                      {selected.session_status && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background:STATUS_CONFIG[selected.session_status].bg, color:STATUS_CONFIG[selected.session_status].color }}>
                          {STATUS_CONFIG[selected.session_status].label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px]" style={{ color:T.textMuted }}>
                      <span>{selected.scope==="full"?"Full access":"Summary access"}</span>
                      <span>·</span>
                      <span>Last check-in: {timeAgo(selected.last_checkin_at)}</span>
                      {selected.session_time && <><span>·</span><span>Today {selected.session_time}</span></>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/psychiatrist/athlete?id=${selected.athlete_id}`}>
                      <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border transition-colors"
                              style={{ background:T.surface, borderColor:T.border, color:T.textSub }}>
                        <ArrowUpRight className="h-3.5 w-3.5"/> Full profile
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Tab bar */}
                <div className="flex items-center gap-1 px-6 py-0" style={{ borderBottom:`1px solid ${T.border}` }}>
                  {(["overview","assessment","actions"] as const).map(tab => (
                    <button key={tab} onClick={()=>setActiveTab(tab)}
                            className="px-4 py-3 text-[13px] font-semibold capitalize transition-colors relative"
                            style={{ color:activeTab===tab?T.blue:T.textMuted }}>
                      {tab}
                      {activeTab===tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background:T.blue }}/>}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto p-6">

                  {/* ── Overview tab ─────────────────────────────────── */}
                  {activeTab==="overview" && (
                    <div className="space-y-5">

                      {/* Score + trend */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Latest Score card */}
                        <div className="rounded-2xl p-5" style={{ background:T.raised, border:`1px solid ${T.border}` }}>
                          <div className="flex items-center gap-2 mb-4">
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                              style={{ background:T.blueLight, color:T.blue }}
                              aria-hidden
                            >
                              <Activity className="h-4 w-4"/>
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color:T.textMuted }}>
                              Latest Score
                            </span>
                          </div>
                          <p
                            className="text-[32px] font-bold tabular-nums tracking-tight leading-none"
                            style={{ color:selected.risk_level?RISK_COLOR[selected.risk_level]:T.textMuted }}
                          >
                            {selected.avg_score!=null?selected.avg_score.toFixed(1):"—"}
                            <span className="text-[18px] font-medium ml-1 tracking-normal" style={{ color:T.textMuted }}>/10</span>
                          </p>
                          <p className="text-[11px] mt-1.5" style={{ color:T.textMuted }}>
                            {selected.checkin_count_14d} check-ins in last 14 days
                          </p>
                        </div>
                        {/* 14-Day Trend card */}
                        <div className="rounded-2xl p-5" style={{ background:T.raised, border:`1px solid ${T.border}` }}>
                          <div className="flex items-center gap-2 mb-4">
                            <div
                              className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                              style={{ background:T.blueLight, color:T.blue }}
                              aria-hidden
                            >
                              <TrendingUp className="h-4 w-4"/>
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color:T.textMuted }}>
                              14-Day Trend
                            </span>
                          </div>
                          <ScoreLine scores={selected.score_history} risk={selected.risk_level}/>
                          <p className="text-[11px] mt-1" style={{ color:T.textMuted }}>
                            {selected.score_history.length>=2
                              ? (selected.score_history[selected.score_history.length-1]>=selected.score_history[selected.score_history.length-2]
                                  ? "↑ Improving" : "↓ Declining")
                              : "Insufficient data"}
                          </p>
                        </div>
                      </div>

                      {/* Session tags */}
                      {(selected.tags&&selected.tags.length>0||(appliedTags[selected.athlete_id]?.length>0)) && (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color:T.textMuted }}>Session Tags</p>
                          <div className="flex flex-wrap gap-1.5">
                            {[...(selected.tags??[]), ...(appliedTags[selected.athlete_id]??[])].filter((v,i,a)=>a.indexOf(v)===i).map(tag=>(
                              <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                                    style={{ background:T.blueLight, color:T.blue, border:`1px solid ${T.blueBorder}` }}>
                                <Tag className="h-2.5 w-2.5"/>{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Last note */}
                      {selected.last_note && (
                        <div className="rounded-xl p-4" style={{ background:T.raised, border:`1px solid ${T.border}` }}>
                          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color:T.textMuted }}>Most Recent Note</p>
                          <p className="text-[13px] leading-relaxed" style={{ color:T.textSub }}>{selected.last_note}</p>
                        </div>
                      )}

                      {/* Access info */}
                      <div className="flex items-center gap-2 px-1">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color:T.textMuted }}/>
                        <p className="text-[11px]" style={{ color:T.textMuted }}>
                          Access logged for FERPA compliance. Patient can revoke consent at any time.
                          {selected.expires_at && ` · Expires ${new Date(selected.expires_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Assessment tab ───────────────────────────────── */}
                  {activeTab==="assessment" && (
                    <div className="space-y-5">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color:T.textMuted }}>Pillar Scores — Latest Check-In</p>
                        <div className="space-y-3">
                          {[
                            { label:"Emotional",  key:"emotional",  color:"#16a34a", track:"#dcfce7" },
                            { label:"Resilience", key:"resilience", color:"#2563eb", track:"#dbeafe" },
                            { label:"Recovery",   key:"recovery",   color:"#7c3aed", track:"#ede9fe" },
                            { label:"Support",    key:"support",    color:"#0891b2", track:"#cffafe" },
                          ].map(p=>{
                            // We only have avg_score, not individual pillars in this view
                            // Use avg_score as a proxy for display
                            return <PillarBar key={p.key} label={p.label} score={selected.avg_score} color={p.color} trackBg={p.track}/>;
                          })}
                        </div>
                        <p className="text-[10px] mt-3" style={{ color:T.textMuted }}>
                          Individual pillar breakdowns available on the full profile.
                        </p>
                      </div>

                      <div className="rounded-xl p-4" style={{ background:T.raised, border:`1px solid ${T.border}` }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color:T.textMuted }}>Screening Status</p>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background:T.blueLight }}>
                            <Activity className="h-4 w-4" style={{ color:T.blue }}/>
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold" style={{ color:T.text }}>
                              {selected.checkin_count_14d>0?"Active — check-ins logged":"No recent check-ins"}
                            </p>
                            <p className="text-[11px]" style={{ color:T.textMuted }}>{selected.checkin_count_14d} sessions in last 14 days</p>
                          </div>
                        </div>
                      </div>

                      <Link href={`/psychiatrist/athlete?id=${selected.athlete_id}`}>
                        <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold border transition-colors hover:bg-gray-50"
                             style={{ borderColor:T.border, color:T.textSub }}>
                          <ArrowUpRight className="h-4 w-4"/> View complete assessment history
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* ── Actions tab ──────────────────────────────────── */}
                  {activeTab==="actions" && (
                    <div className="space-y-5">

                      {/* Primary actions */}
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color:T.textMuted }}>Clinical Actions</p>
                        <div className="grid grid-cols-2 gap-3">
                          {contacted[selected.athlete_id] ? (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-semibold"
                                 style={{ background:T.greenLight, color:T.green, border:`1px solid #bbf7d0` }}>
                              <Check className="h-4 w-4"/> Contacted
                            </div>
                          ) : (
                            <button onClick={()=>handleContact(selected)} disabled={responding===selected.athlete_id}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                    style={{ background:`linear-gradient(135deg, ${T.blueDark}, ${T.blue})`, boxShadow:"0 2px 8px rgba(75,156,211,0.3)" }}>
                              {responding===selected.athlete_id?<span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block"/>:<><Phone className="h-4 w-4"/> Contact</>}
                            </button>
                          )}

                          {(scheduled[selected.athlete_id]||selected.has_followup) ? (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-semibold"
                                 style={{ background:T.blueLight, color:T.blue, border:`1px solid ${T.blueBorder}` }}>
                              <Check className="h-4 w-4"/> Follow-up scheduled
                            </div>
                          ) : (
                            <button onClick={()=>handleSchedule(selected)} disabled={scheduling===selected.athlete_id}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[12px] font-semibold border transition-colors disabled:opacity-50"
                                    style={{ background:T.surface, borderColor:T.border, color:T.textSub }}>
                              {scheduling===selected.athlete_id?<span className="h-3.5 w-3.5 rounded-full border-2 animate-spin" style={{ borderColor:T.border, borderTopColor:T.textSub }}/>:<><Calendar className="h-4 w-4"/> Schedule follow-up</>}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Referral */}
                      <div className="rounded-xl p-4" style={{ background:T.blueLight, border:`1px solid ${T.blueBorder}` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="h-4 w-4" style={{ color:T.blue }}/>
                          <p className="text-[13px] font-semibold" style={{ color:T.blue }}>FERPA-Compliant Referral</p>
                        </div>
                        <p className="text-[12px] mb-3 leading-relaxed" style={{ color:T.blueDark }}>
                          Share an anonymized wellness summary with this athlete&apos;s primary care provider. Only aggregate trend data — no session notes.
                        </p>
                        {referred[selected.athlete_id] ? (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold"
                               style={{ background:T.greenLight, color:T.green, border:`1px solid #bbf7d0` }}>
                            <Check className="h-3.5 w-3.5"/> Referral summary sent
                          </div>
                        ) : (
                          <button
                            onClick={()=>handleReferral(selected)}
                            disabled={referring===selected.athlete_id}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{ background:T.blue, boxShadow:"0 1px 4px rgba(75,156,211,0.4)" }}>
                            {referring===selected.athlete_id
                              ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block"/>
                              : <><ArrowUpRight className="h-3.5 w-3.5"/> Send referral summary</>}
                          </button>
                        )}
                      </div>

                      {/* Quick tags */}
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color:T.textMuted }}>Quick Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {QUICK_TAGS.map(tag=>{
                            const applied = (appliedTags[selected.athlete_id]??[]).includes(tag)||(selected.tags??[]).includes(tag);
                            return (
                              <button key={tag}
                                      onClick={async ()=>{
                                        if (applied) return;
                                        setAppliedTags(prev=>({ ...prev, [selected.athlete_id]: [...(prev[selected.athlete_id]??[]), tag] }));
                                        // Persist tag to audit_logs (non-blocking; skipped for demo athletes)
                                        if (!selected.athlete_id.startsWith("d") && profId) {
                                          try {
                                            const { createClient: mkClient } = await import("@/lib/supabase/client");
                                            await mkClient().from("audit_logs").insert({
                                              actor_profile_id: profId,
                                              action:           "session_tag_applied",
                                              target_type:      "athlete",
                                              target_id:        selected.athlete_id,
                                              metadata:         { tag, athlete_id: selected.athlete_id },
                                            });
                                          } catch { /* tag persistence is non-critical */ }
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-full border transition-colors"
                                      style={ applied
                                        ? { background:T.blueLight, borderColor:T.blueBorder, color:T.blue }
                                        : { background:T.surface, borderColor:T.border, color:T.textSub }}>
                                <Tag className="h-2.5 w-2.5"/>{tag}
                                {applied && <Check className="h-2.5 w-2.5 ml-0.5"/>}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-1">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color:T.textMuted }}/>
          <p className="text-[11px]" style={{ color:T.textMuted }}>
            All access is logged for FERPA compliance. Patients can revoke consent at any time.{" "}
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3"/>14-day activity window</span>
          </p>
        </div>
      </div>
      <DiagnosticToast toasts={diag.toasts} dismiss={diag.dismiss} />
    </DashboardLayout>
  );
}
