"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  AlertCircle, Users, CalendarCheck, Heart, MessageCircle,
  X, Check, ChevronRight, Phone, Calendar, Clock,
  ShieldCheck, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { evaluateRiskLevel } from "@/lib/pillar-scoring";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:        "#f4f7f5",
  surface:   "#ffffff",
  raised:    "#f0f9ff",
  border:    "#bae6fd",
  borderSub: "#e0f2fe",
  borderNeutral: "#e2e8f0",
  text:      "#0f172a",
  textSub:   "#1e293b",
  textMuted: "#64748b",
  teal:      "#0d9488",
  tealDeep:  "#134e4a",
  tealLight: "#f0fdfa",
  navy:      "#0369a1",
  charcoal:  "#1e293b",
  red:       "#dc2626",
  redLight:  "#fee2e2",
  amber:     "#d97706",
  amberLight:"#fef3c7",
  green:     "#16a34a",
  greenLight:"#dcfce7",
};

const RISK_COLOR  = { green: T.green,  yellow: T.amber,   red: T.red   };
const RISK_BG     = { green: T.greenLight, yellow: T.amberLight, red: T.redLight };
const RISK_LABEL  = { green: "Stable", yellow: "Needs Attention", red: "High Concern" };
const RISK_ORDER  = { red: 0, yellow: 1, green: 2 };

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SharedAthlete {
  athlete_id:        string;
  athlete_name:      string;
  scope:             "summary" | "full";
  last_checkin_at:   string | null;
  granted_at:        string;
  expires_at:        string | null;
  avg_score:         number | null;
  risk_level:        "green" | "yellow" | "red" | null;
  checkin_count_14d: number;
  open_alert_id:     string | null;
  has_followup:      boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string | null) {
  if (!iso) return "No check-ins yet";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatExpiry(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (d < new Date()) return "Expired";
  return `Expires ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function PsychiatristDashboard() {
  const [athletes,   setAthletes]   = useState<SharedAthlete[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [userName,   setUserName]   = useState("...");
  const [profId,     setProfId]     = useState<string | null>(null);
  const [isDemo,     setIsDemo]     = useState(false);

  // Action states
  const [responded,  setResponded]  = useState<Record<string, "accepted" | "dismissed">>({});
  const [contacted,  setContacted]  = useState<Record<string, boolean>>({});
  const [scheduled,  setScheduled]  = useState<Record<string, boolean>>({});
  const [responding, setResponding] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: prof } = await supabase.from("profiles").select("id, full_name").eq("auth_user_id", user.id).single();
        if (!prof) { setError("Profile not found."); return; }
        setUserName(prof.full_name);
        setProfId(prof.id);

        type ConsentRow = {
          athlete_id: string; scope: "summary" | "full"; granted_at: string; expires_at: string | null;
          athlete: { full_name: string }[] | { full_name: string } | null;
        };

        const { data: consents } = await supabase
          .from("consent_logs")
          .select("athlete_id, scope, granted_at, expires_at, athlete:athlete_id(full_name)")
          .eq("target_profile_id", prof.id).eq("is_active", true);

        const cutoff14 = new Date(Date.now() - 14 * 86400000).toISOString();

        const shared: SharedAthlete[] = await Promise.all(
          (consents ?? []).map(async (c: ConsentRow) => {
            const athleteObj = Array.isArray(c.athlete) ? c.athlete[0] : c.athlete;

            const [{ data: recent }, { data: alertData }, { data: followupData }] = await Promise.all([
              supabase.from("checkins")
                .select("completed_at, emotional_score, resilience_score, recovery_score, support_score")
                .eq("athlete_id", c.athlete_id).gte("completed_at", cutoff14)
                .order("completed_at", { ascending: false }),
              supabase.from("alerts").select("id")
                .eq("athlete_id", c.athlete_id).eq("status", "open").limit(1).maybeSingle(),
              supabase.from("followups").select("id")
                .eq("athlete_id", c.athlete_id).eq("status", "open").limit(1).maybeSingle(),
            ]);

            const latest = recent?.[0] ?? null;
            let avg_score: number | null = null;
            let risk_level: "green" | "yellow" | "red" | null = null;

            if (latest) {
              const vals = [latest.emotional_score, latest.resilience_score, latest.recovery_score, latest.support_score].filter((v): v is number => v != null);
              if (vals.length) avg_score = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
              risk_level = evaluateRiskLevel({
                emotional:  latest.emotional_score  ?? 5,
                resilience: latest.resilience_score ?? 5,
                recovery:   latest.recovery_score   ?? 5,
                support:    latest.support_score    ?? 5,
              }, false);
            }

            return {
              athlete_id:        c.athlete_id,
              athlete_name:      athleteObj?.full_name ?? "Unknown",
              scope:             c.scope,
              last_checkin_at:   latest?.completed_at ?? null,
              granted_at:        c.granted_at,
              expires_at:        c.expires_at,
              avg_score,
              risk_level,
              checkin_count_14d: recent?.length ?? 0,
              open_alert_id:     alertData?.id ?? null,
              has_followup:      !!followupData,
            };
          })
        );

        const display: SharedAthlete[] = shared.length > 0 ? shared : [
          { athlete_id:"demo-1", athlete_name:"Alex Johnson",    scope:"full",    last_checkin_at:new Date(Date.now()-1*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:7.4, risk_level:"green",  checkin_count_14d:3, open_alert_id:null,         has_followup:false },
          { athlete_id:"demo-2", athlete_name:"Jordan Williams", scope:"summary", last_checkin_at:new Date(Date.now()-3*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:4.8, risk_level:"yellow", checkin_count_14d:2, open_alert_id:"demo-alert-1", has_followup:false },
          { athlete_id:"demo-3", athlete_name:"Sam Rivera",      scope:"full",    last_checkin_at:new Date(Date.now()-2*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:3.1, risk_level:"red",    checkin_count_14d:1, open_alert_id:"demo-alert-2", has_followup:true  },
          { athlete_id:"demo-4", athlete_name:"Taylor Brooks",   scope:"summary", last_checkin_at:new Date(Date.now()-5*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:8.2, risk_level:"green",  checkin_count_14d:4, open_alert_id:null,         has_followup:false },
          { athlete_id:"demo-5", athlete_name:"Morgan Lee",      scope:"full",    last_checkin_at:new Date(Date.now()-4*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:5.5, risk_level:"yellow", checkin_count_14d:2, open_alert_id:null,         has_followup:false },
        ];

        setAthletes(display);
        setIsDemo(shared.length === 0);
      } catch { setError("An unexpected error occurred."); }
      finally   { setLoading(false); }
    }
    load();
  }, []);

  // ── Outreach: accept or dismiss an open alert ─────────────────────────────
  async function handleOutreach(athlete: SharedAthlete, decision: "accepted" | "dismissed") {
    setResponding(athlete.athlete_id);
    try {
      if (athlete.open_alert_id && !athlete.athlete_id.startsWith("demo-")) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.from("alerts").update({
          status:                 decision === "accepted" ? "acknowledged" : "resolved",
          assigned_to_profile_id: decision === "accepted" ? profId : null,
        }).eq("id", athlete.open_alert_id);
        await supabase.from("audit_logs").insert({
          actor_profile_id: profId, action: decision === "accepted" ? "outreach_accepted" : "outreach_declined",
          target_type: "alert", target_id: athlete.open_alert_id,
          metadata: { athlete_id: athlete.athlete_id, decision },
        });
      }
      setResponded(r => ({ ...r, [athlete.athlete_id]: decision }));
      if (decision === "accepted") setContacted(c => ({ ...c, [athlete.athlete_id]: true }));
    } catch { /* non-fatal */ }
    setResponding(null);
  }

  // ── Contact: log outreach intent ──────────────────────────────────────────
  async function handleContact(athlete: SharedAthlete) {
    if (responding === athlete.athlete_id) return;
    // If open alert exists, treat as accept outreach
    if (athlete.open_alert_id && !responded[athlete.athlete_id]) {
      await handleOutreach(athlete, "accepted");
      return;
    }
    // Otherwise just log intent
    if (!athlete.athlete_id.startsWith("demo-")) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.from("audit_logs").insert({
          actor_profile_id: profId, action: "outreach_initiated",
          target_type: "athlete", target_id: athlete.athlete_id, metadata: {},
        });
      } catch { /* non-fatal */ }
    }
    setContacted(c => ({ ...c, [athlete.athlete_id]: true }));
  }

  // ── Schedule: create a follow-up for tomorrow ─────────────────────────────
  async function handleSchedule(athlete: SharedAthlete) {
    setScheduling(athlete.athlete_id);
    try {
      if (!athlete.athlete_id.startsWith("demo-")) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        await supabase.from("followups").insert({
          athlete_id: athlete.athlete_id,
          assigned_to_profile_id: profId,
          status: "open",
          due_date: tomorrow,
        });
        await supabase.from("audit_logs").insert({
          actor_profile_id: profId, action: "followup_scheduled",
          target_type: "athlete", target_id: athlete.athlete_id,
          metadata: { due_date: tomorrow },
        });
      }
      setScheduled(s => ({ ...s, [athlete.athlete_id]: true }));
    } catch { /* non-fatal */ }
    setScheduling(null);
  }

  // ── Derived state ─────────────────────────────────────────────────────────
  const sorted       = [...athletes].sort((a, b) =>
    (RISK_ORDER[a.risk_level ?? "green"] ?? 3) - (RISK_ORDER[b.risk_level ?? "green"] ?? 3)
  );
  const withData     = athletes.filter(a => a.risk_level != null);
  const greenCount   = withData.filter(a => a.risk_level === "green").length;
  const yellowCount  = withData.filter(a => a.risk_level === "yellow").length;
  const redCount     = withData.filter(a => a.risk_level === "red").length;
  const totalRisk    = withData.length;
  const checked14    = athletes.filter(a => a.checkin_count_14d > 0).length;
  const checkinRate  = athletes.length > 0 ? Math.round((checked14 / athletes.length) * 100) : 0;

  // Urgent = open alert AND not yet responded
  const urgentQueue = sorted.filter(a => a.open_alert_id && !responded[a.athlete_id]);

  if (loading) return (
    <DashboardLayout role="psychiatrist" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin"
             style={{ borderColor: T.border, borderTopColor: T.teal }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl p-10 text-center"
             style={{ background: T.surface, border: `1px solid ${T.borderNeutral}` }}>
          <AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color: T.textMuted }} />
          <p style={{ color: T.textMuted }}>{error}</p>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ color: T.charcoal }}>
              Counselor Dashboard
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>
              {isDemo ? "Sample data — " : ""}
              {athletes.length} patient{athletes.length !== 1 ? "s" : ""} sharing data with you
            </p>
          </div>
          {isDemo && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase"
                  style={{ background: T.raised, color: T.teal, border: `1px solid ${T.border}` }}>
              Demo Data
            </span>
          )}
        </div>

        {/* ── Urgent Outreach Queue ────────────────────────────────────────────── */}
        {urgentQueue.length > 0 && (
          <div className="rounded-3xl overflow-hidden"
               style={{ border: `2px solid ${T.redLight}` }}>
            {/* Header */}
            <div className="px-5 py-3 flex items-center gap-2"
                 style={{ background: T.redLight, borderBottom: `1px solid #fecaca` }}>
              <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: T.red }} />
              <AlertCircle className="h-4 w-4" style={{ color: T.red }} />
              <p className="text-[13px] font-bold" style={{ color: "#991b1b" }}>
                Outreach Queue — {urgentQueue.length} patient{urgentQueue.length !== 1 ? "s" : ""} may need support
              </p>
            </div>

            {/* Rows */}
            <div style={{ background: T.surface }}>
              {urgentQueue.map((athlete, idx) => (
                <div key={athlete.athlete_id}
                     className="px-5 py-4 flex items-center justify-between gap-4"
                     style={{ borderTop: idx > 0 ? "1px solid #fee2e2" : undefined }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[14px]" style={{ color: T.text }}>{athlete.athlete_name}</p>
                      {athlete.risk_level && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{ background: RISK_BG[athlete.risk_level], color: RISK_COLOR[athlete.risk_level] }}>
                          {RISK_LABEL[athlete.risk_level]}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: T.textMuted }}>
                      Last check-in: {timeAgo(athlete.last_checkin_at)}
                      {athlete.avg_score != null && (
                        <span className="font-semibold ml-2" style={{ color: athlete.risk_level ? RISK_COLOR[athlete.risk_level] : T.textSub }}>
                          {athlete.avg_score}/10
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOutreach(athlete, "dismissed")}
                      disabled={responding === athlete.athlete_id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-colors disabled:opacity-50"
                      style={{ background: T.surface, border: `1px solid ${T.borderNeutral}`, color: T.textMuted }}>
                      <X className="h-3.5 w-3.5" /> Not now
                    </button>
                    <button
                      onClick={() => handleOutreach(athlete, "accepted")}
                      disabled={responding === athlete.athlete_id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, ${T.tealDeep}, ${T.teal})`, color: "#fff" }}>
                      {responding === athlete.athlete_id
                        ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                        : <><Check className="h-3.5 w-3.5" /> I&apos;ll reach out</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stat strip ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <Users className="h-4 w-4" style={{ color: T.teal }} />, bg: T.raised, label: "Patients", value: String(athletes.length) },
            { icon: <CalendarCheck className="h-4 w-4" style={{ color: T.teal }} />, bg: T.tealLight, label: "Check-in Rate", value: `${checkinRate}%` },
            { icon: <AlertCircle className="h-4 w-4" style={{ color: T.red }} />, bg: T.redLight, label: "Need Attention", value: String(yellowCount + redCount) },
            { icon: <Heart className="h-4 w-4" style={{ color: T.green }} />, bg: T.greenLight, label: "Stable", value: String(greenCount) },
          ].map(card => (
            <div key={card.label} className="rounded-2xl p-3.5" style={{ background: T.surface, border: `1px solid ${T.borderNeutral}` }}>
              <div className="h-7 w-7 rounded-lg flex items-center justify-center mb-2" style={{ background: card.bg }}>
                {card.icon}
              </div>
              <p className="text-[22px] font-bold tabular-nums leading-none" style={{ color: T.text }}>{card.value}</p>
              <p className="text-[9px] font-bold uppercase tracking-wide mt-1" style={{ color: T.textMuted }}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* ── Active Permissions ───────────────────────────────────────────────── */}
        <div className="rounded-3xl overflow-hidden"
             style={{ background: T.surface, border: `1px solid ${T.borderNeutral}` }}>

          {/* Section header */}
          <div className="px-5 py-4 flex items-center gap-2"
               style={{ background: T.raised, borderBottom: `1px solid ${T.border}` }}>
            <ShieldCheck className="h-4 w-4" style={{ color: T.teal }} />
            <p className="text-[13px] font-bold" style={{ color: T.charcoal }}>Active Permissions</p>
            <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: T.tealLight, color: T.teal }}>
              {athletes.length} granted
            </span>
            {isDemo && (
              <span className="ml-auto text-[11px]" style={{ color: T.textMuted }}>
                Populated when athletes opt in
              </span>
            )}
          </div>

          {/* Athlete cards — sorted by urgency */}
          <div className="divide-y" style={{ borderColor: T.borderNeutral }}>
            {sorted.map(athlete => {
              const isExpired       = athlete.expires_at ? new Date(athlete.expires_at) < new Date() : false;
              const risk            = athlete.risk_level;
              const isContacted     = contacted[athlete.athlete_id];
              const isScheduled     = scheduled[athlete.athlete_id] || athlete.has_followup;
              const isSchedulingNow = scheduling === athlete.athlete_id;
              const expiryText      = formatExpiry(athlete.expires_at);

              return (
                <div key={athlete.athlete_id}
                     className="px-5 py-4"
                     style={{ opacity: isExpired ? 0.45 : 1 }}>

                  {/* ── Top row: identity + status badges ─────────────────── */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold"
                           style={{ background: risk ? RISK_BG[risk] : T.raised, color: risk ? RISK_COLOR[risk] : T.textMuted }}>
                        {athlete.athlete_name.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-[15px]" style={{ color: T.text }}>
                            {athlete.athlete_name}
                          </p>
                          {/* Scope badge */}
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ background: T.raised, color: T.teal, border: `1px solid ${T.border}` }}>
                            {athlete.scope === "full" ? "Full Access" : "Summary"}
                          </span>
                          {/* Risk badge */}
                          {risk && !isExpired && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                  style={{ background: RISK_BG[risk], color: RISK_COLOR[risk] }}>
                              {RISK_LABEL[risk]}
                            </span>
                          )}
                          {isExpired && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                  style={{ background: "#f1f5f9", color: T.textMuted }}>
                              Expired
                            </span>
                          )}
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px]" style={{ color: T.textMuted }}>
                            <Clock className="h-3 w-3" />
                            {timeAgo(athlete.last_checkin_at)}
                          </span>
                          {athlete.avg_score != null && (
                            <span className="text-[11px] font-semibold tabular-nums"
                                  style={{ color: risk ? RISK_COLOR[risk] : T.textSub }}>
                              {athlete.avg_score}/10 avg
                            </span>
                          )}
                          {expiryText && (
                            <span className="text-[10px]"
                                  style={{ color: expiryText === "Expired" ? T.red : T.textMuted }}>
                              {expiryText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* View report link */}
                    {!isExpired && (
                      <Link href={`/psychiatrist/athlete?id=${athlete.athlete_id}`}>
                        <button className="shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-xl transition-colors"
                                style={{ background: T.raised, color: T.teal, border: `1px solid ${T.border}` }}>
                          View <ArrowUpRight className="h-3 w-3" />
                        </button>
                      </Link>
                    )}
                  </div>

                  {/* ── Action row ─────────────────────────────────────────── */}
                  {!isExpired && (
                    <div className="flex items-center gap-2 pl-12">

                      {/* Contact button */}
                      {isContacted ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-xl"
                              style={{ background: T.tealLight, color: T.teal }}>
                          <Check className="h-3 w-3" /> Outreach confirmed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleContact(athlete)}
                          disabled={responding === athlete.athlete_id}
                          className="flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                          style={{ background: `linear-gradient(135deg, ${T.tealDeep}, ${T.teal})`, color: "#fff" }}>
                          {responding === athlete.athlete_id
                            ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                            : <><Phone className="h-3 w-3" /> Contact</>}
                        </button>
                      )}

                      {/* Schedule button */}
                      {isScheduled ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-xl"
                              style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                          <Check className="h-3 w-3" /> Follow-up scheduled
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSchedule(athlete)}
                          disabled={isSchedulingNow}
                          className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-50"
                          style={{ background: T.surface, border: `1px solid ${T.borderNeutral}`, color: T.textSub }}>
                          {isSchedulingNow
                            ? <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin inline-block" />
                            : <><Calendar className="h-3 w-3" /> Schedule</>}
                        </button>
                      )}

                      {/* Dismissed outreach note */}
                      {responded[athlete.athlete_id] === "dismissed" && (
                        <span className="text-[11px] italic" style={{ color: T.textMuted }}>
                          Outreach deferred
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {athletes.length === 0 && (
              <div className="px-5 py-12 text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-3" style={{ color: T.textMuted }} />
                <p className="text-[13px] font-medium" style={{ color: T.textMuted }}>
                  No active permissions yet
                </p>
                <p className="text-[12px] mt-1" style={{ color: T.textMuted }}>
                  Athletes appear here once they grant you access through the app.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Wellness distribution ────────────────────────────────────────────── */}
        {totalRisk > 0 && (
          <div className="rounded-3xl p-5"
               style={{ background: T.surface, border: `1px solid ${T.borderNeutral}` }}>
            <div className="flex items-center gap-2 mb-4">
              <p className="text-[13px] font-bold" style={{ color: T.charcoal }}>Patient Wellness Distribution</p>
              <span className="ml-auto text-[11px]" style={{ color: T.textMuted }}>14-day window</span>
            </div>
            <div className="flex h-5 rounded-xl overflow-hidden gap-[2px] mb-4" style={{ background: T.borderNeutral }}>
              {greenCount  > 0 && <div style={{ width:`${(greenCount/totalRisk)*100}%`,  background: T.green  }} />}
              {yellowCount > 0 && <div style={{ width:`${(yellowCount/totalRisk)*100}%`, background: T.amber  }} />}
              {redCount    > 0 && <div style={{ width:`${(redCount/totalRisk)*100}%`,    background: T.red    }} />}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { label:"Stable",          count:greenCount,  key:"green"  as const },
                { label:"Needs Attention", count:yellowCount, key:"yellow" as const },
                { label:"High Concern",    count:redCount,    key:"red"    as const },
              ]).map(item => (
                <div key={item.label} className="rounded-2xl p-3.5 text-center"
                     style={{ background: RISK_BG[item.key] }}>
                  <p className="text-[22px] font-bold tabular-nums" style={{ color: RISK_COLOR[item.key] }}>{item.count}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wide mt-0.5" style={{ color: RISK_COLOR[item.key] }}>{item.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: RISK_COLOR[item.key], opacity: 0.7 }}>
                    {Math.round((item.count / totalRisk) * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Privacy footer ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl p-4 flex items-center gap-3"
             style={{ background: T.raised, border: `1px solid ${T.border}` }}>
          <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: T.teal }} />
          <p className="text-[11px] leading-relaxed" style={{ color: T.textMuted }}>
            Access is logged for FERPA compliance. Patients can revoke consent at any time through the app.
            All outreach actions are recorded in the audit trail.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
