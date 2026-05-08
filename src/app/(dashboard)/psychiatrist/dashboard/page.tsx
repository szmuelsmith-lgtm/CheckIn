"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  AlertCircle, Users2, Heart, MessageCircle,
  X, Check, Phone, Calendar, Clock,
  ShieldCheck, ArrowUpRight, Zap,
} from "lucide-react";
import Link from "next/link";
import { evaluateRiskLevel } from "@/lib/pillar-scoring";

const T = {
  bg:           "#f9fafb",
  surface:      "#ffffff",
  border:       "#e5e7eb",
  borderSub:    "#f3f4f6",
  text:         "#111827",
  textSub:      "#374151",
  textMuted:    "#6b7280",
  indigo:       "#4f46e5",
  indigoDark:   "#3730a3",
  indigoLight:  "#eef2ff",
  indigoBorder: "#c7d2fe",
  violet:       "#7c3aed",
  teal:         "#0d9488",
  tealLight:    "#f0fdfa",
  tealBorder:   "#99f6e4",
  red:          "#dc2626",
  redLight:     "#fef2f2",
  redBorder:    "#fecaca",
  amber:        "#d97706",
  amberLight:   "#fefce8",
  green:        "#16a34a",
  greenLight:   "#f0fdf4",
};

const shadow   = "0 1px 3px 0 rgba(0,0,0,0.07),0 1px 2px 0 rgba(0,0,0,0.04)";
const shadowMd = "0 4px 6px -1px rgba(0,0,0,0.07),0 2px 4px -2px rgba(0,0,0,0.04)";

const RISK_COLOR = { green: T.green,  yellow: T.amber,  red: T.red   };
const RISK_BG    = { green: T.greenLight, yellow: T.amberLight, red: T.redLight };
const RISK_LABEL = { green: "Stable", yellow: "Moderate", red: "High Risk" };
const RISK_ORDER = { red: 0, yellow: 1, green: 2 };

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

function timeAgo(iso: string | null) {
  if (!iso) return "No check-ins";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatExpiry(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (d < new Date()) return "Expired";
  return `Expires ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export default function PsychiatristDashboard() {
  const [athletes,   setAthletes]   = useState<SharedAthlete[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [userName,   setUserName]   = useState("...");
  const [profId,     setProfId]     = useState<string | null>(null);
  const [isDemo,     setIsDemo]     = useState(false);

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
              supabase.from("alerts").select("id").eq("athlete_id", c.athlete_id).eq("status", "open").limit(1).maybeSingle(),
              supabase.from("followups").select("id").eq("athlete_id", c.athlete_id).eq("status", "open").limit(1).maybeSingle(),
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
          { athlete_id:"demo-1", athlete_name:"Alex Johnson",    scope:"full",    last_checkin_at:new Date(Date.now()-1*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:7.4, risk_level:"green",  checkin_count_14d:3, open_alert_id:null,          has_followup:false },
          { athlete_id:"demo-2", athlete_name:"Jordan Williams", scope:"summary", last_checkin_at:new Date(Date.now()-3*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:4.8, risk_level:"yellow", checkin_count_14d:2, open_alert_id:"demo-alert-1", has_followup:false },
          { athlete_id:"demo-3", athlete_name:"Sam Rivera",      scope:"full",    last_checkin_at:new Date(Date.now()-2*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:3.1, risk_level:"red",    checkin_count_14d:1, open_alert_id:"demo-alert-2", has_followup:true  },
          { athlete_id:"demo-4", athlete_name:"Taylor Brooks",   scope:"summary", last_checkin_at:new Date(Date.now()-5*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:8.2, risk_level:"green",  checkin_count_14d:4, open_alert_id:null,          has_followup:false },
          { athlete_id:"demo-5", athlete_name:"Morgan Lee",      scope:"full",    last_checkin_at:new Date(Date.now()-4*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:5.5, risk_level:"yellow", checkin_count_14d:2, open_alert_id:null,          has_followup:false },
        ];

        setAthletes(display);
        setIsDemo(shared.length === 0);
      } catch { setError("An unexpected error occurred."); }
      finally   { setLoading(false); }
    }
    load();
  }, []);

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

  async function handleContact(athlete: SharedAthlete) {
    if (responding === athlete.athlete_id) return;
    if (athlete.open_alert_id && !responded[athlete.athlete_id]) {
      await handleOutreach(athlete, "accepted"); return;
    }
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

  async function handleSchedule(athlete: SharedAthlete) {
    setScheduling(athlete.athlete_id);
    try {
      if (!athlete.athlete_id.startsWith("demo-")) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        await supabase.from("followups").insert({
          athlete_id: athlete.athlete_id, assigned_to_profile_id: profId,
          status: "open", due_date: tomorrow,
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

  const sorted      = [...athletes].sort((a, b) =>
    (RISK_ORDER[a.risk_level ?? "green"] ?? 3) - (RISK_ORDER[b.risk_level ?? "green"] ?? 3)
  );
  const withData    = athletes.filter(a => a.risk_level != null);
  const greenCount  = withData.filter(a => a.risk_level === "green").length;
  const yellowCount = withData.filter(a => a.risk_level === "yellow").length;
  const redCount    = withData.filter(a => a.risk_level === "red").length;
  const totalRisk   = withData.length;
  const checked14   = athletes.filter(a => a.checkin_count_14d > 0).length;
  const checkinRate = athletes.length > 0 ? Math.round((checked14 / athletes.length) * 100) : 0;
  const urgentQueue = sorted.filter(a => a.open_alert_id && !responded[a.athlete_id]);

  if (loading) return (
    <DashboardLayout role="psychiatrist" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin"
             style={{ borderColor: T.indigoBorder, borderTopColor: T.indigo }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl p-10 text-center"
             style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
          <AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color: T.textMuted }} />
          <p style={{ color: T.textMuted }}>{error}</p>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>
                Counselor Dashboard
              </h1>
              {isDemo && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: T.indigoLight, color: T.indigo, border: `1px solid ${T.indigoBorder}` }}>
                  Demo
                </span>
              )}
            </div>
            <p className="text-[13px]" style={{ color: T.textMuted }}>
              {athletes.length} patient{athletes.length !== 1 ? "s" : ""} sharing access ·{" "}
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* ── KPI cards ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: <Users2       className="h-4 w-4" />, iconBg: T.indigoLight,  iconColor: T.indigo, label: "Patients",        value: String(athletes.length),           valueColor: T.text,  sub: "active permissions" },
            { icon: <Zap          className="h-4 w-4" />, iconBg: T.indigoLight,  iconColor: T.indigo, label: "14-Day Active",    value: `${checkinRate}%`,                 valueColor: T.text,  sub: "checked in recently" },
            { icon: <AlertCircle  className="h-4 w-4" />, iconBg: (yellowCount + redCount) > 0 ? T.redLight : T.borderSub, iconColor: (yellowCount + redCount) > 0 ? T.red : T.textMuted, label: "Need Attention", value: String(yellowCount + redCount), valueColor: (yellowCount + redCount) > 0 ? T.red : T.text, sub: "moderate or high risk" },
            { icon: <Heart        className="h-4 w-4" />, iconBg: T.greenLight,   iconColor: T.green,  label: "Stable",          value: String(greenCount),                valueColor: T.text,  sub: "low concern" },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl p-5"
                 style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
              <div className="flex items-center justify-between mb-4">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                     style={{ background: stat.iconBg }}>
                  <span style={{ color: stat.iconColor }}>{stat.icon}</span>
                </div>
              </div>
              <p className="text-[30px] font-bold tabular-nums leading-none mb-1" style={{ color: stat.valueColor }}>
                {stat.value}
              </p>
              <p className="text-[12px] font-medium" style={{ color: T.textMuted }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Urgent outreach queue ─────────────────────────────────────────────── */}
        {urgentQueue.length > 0 && (
          <div className="rounded-xl overflow-hidden"
               style={{ background: T.surface, border: `1px solid ${T.redBorder}`, boxShadow: shadow }}>

            {/* Banner */}
            <div className="px-5 py-3.5 flex items-center gap-3"
                 style={{ background: T.redLight, borderBottom: `1px solid ${T.redBorder}` }}>
              <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: T.red }} />
              <AlertCircle className="h-4 w-4" style={{ color: T.red }} />
              <div className="flex-1">
                <p className="text-[13px] font-bold" style={{ color: "#991b1b" }}>
                  Outreach Needed
                </p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: T.red, color: "#fff" }}>
                {urgentQueue.length} flagged
              </span>
            </div>

            {urgentQueue.map((athlete, idx) => (
              <div key={athlete.athlete_id}
                   className="px-5 py-4 flex items-center justify-between gap-4"
                   style={{ borderTop: idx > 0 ? `1px solid ${T.borderSub}` : undefined }}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold"
                       style={{ background: `linear-gradient(135deg, ${T.red}22, ${T.red}44)`, color: T.red }}>
                    {athlete.athlete_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[14px]" style={{ color: T.text }}>{athlete.athlete_name}</p>
                    <p className="text-[11px]" style={{ color: T.textMuted }}>
                      Score {athlete.avg_score ?? "—"}/10 · {timeAgo(athlete.last_checkin_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOutreach(athlete, "dismissed")}
                    disabled={responding === athlete.athlete_id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border transition-colors disabled:opacity-50"
                    style={{ background: T.surface, borderColor: T.border, color: T.textMuted }}>
                    <X className="h-3.5 w-3.5" /> Defer
                  </button>
                  <button
                    onClick={() => handleOutreach(athlete, "accepted")}
                    disabled={responding === athlete.athlete_id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, #991b1b, ${T.red})`, boxShadow: shadowMd }}>
                    {responding === athlete.athlete_id
                      ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                      : <><Check className="h-3.5 w-3.5" /> I&apos;ll reach out</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Patient list ─────────────────────────────────────────────────────── */}
        <div className="rounded-xl overflow-hidden"
             style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>

          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between"
               style={{ borderBottom: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4" style={{ color: T.teal }} />
              <p className="text-[14px] font-semibold" style={{ color: T.text }}>Active Permissions</p>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: T.tealLight, color: T.teal, border: `1px solid ${T.tealBorder}` }}>
                {athletes.length}
              </span>
            </div>
            {totalRisk > 0 && (
              <div className="flex items-center gap-3 text-[11px] font-medium">
                {greenCount  > 0 && <span style={{ color: T.green  }}>{greenCount} stable</span>}
                {yellowCount > 0 && <span style={{ color: T.amber  }}>{yellowCount} moderate</span>}
                {redCount    > 0 && <span style={{ color: T.red    }}>{redCount} high risk</span>}
              </div>
            )}
          </div>

          {/* Column headers */}
          {athletes.length > 0 && (
            <div className="px-5 py-2.5 grid gap-4"
                 style={{ gridTemplateColumns: "1fr 90px 110px 80px 190px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
              {["Patient", "Status", "Last Check-In", "Score", "Actions"].map(h => (
                <p key={h} className="text-[10px] font-bold uppercase tracking-wider"
                   style={{ color: T.textMuted }}>{h}</p>
              ))}
            </div>
          )}

          {/* Rows */}
          {sorted.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-3" style={{ color: "#cbd5e1" }} />
              <p className="text-[13px] font-medium mb-1" style={{ color: T.textMuted }}>No active permissions yet</p>
              <p className="text-[12px]" style={{ color: T.textMuted }}>
                Athletes appear here once they grant you access through the app.
              </p>
            </div>
          ) : (
            sorted.map((athlete, idx) => {
              const isExpired       = athlete.expires_at ? new Date(athlete.expires_at) < new Date() : false;
              const risk            = athlete.risk_level;
              const isContacted     = contacted[athlete.athlete_id];
              const isScheduled     = scheduled[athlete.athlete_id] || athlete.has_followup;
              const isSchedulingNow = scheduling === athlete.athlete_id;
              const expiryText      = formatExpiry(athlete.expires_at);

              return (
                <div key={athlete.athlete_id}
                     className="px-5 py-3.5 grid gap-4 items-center transition-colors hover:bg-gray-50/60"
                     style={{
                       gridTemplateColumns: "1fr 90px 110px 80px 190px",
                       borderTop: idx > 0 ? `1px solid ${T.borderSub}` : undefined,
                       opacity: isExpired ? 0.5 : 1,
                     }}>

                  {/* Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold"
                         style={{
                           background: risk && !isExpired
                             ? `linear-gradient(135deg, ${RISK_BG[risk]}, ${RISK_COLOR[risk]}22)`
                             : T.borderSub,
                           color: risk && !isExpired ? RISK_COLOR[risk] : T.textMuted,
                         }}>
                      {athlete.athlete_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[13px] truncate" style={{ color: T.text }}>{athlete.athlete_name}</p>
                      <span className="text-[9px] font-bold uppercase tracking-wider"
                            style={{ color: athlete.scope === "full" ? T.teal : T.textMuted }}>
                        {athlete.scope === "full" ? "Full access" : "Summary"}
                      </span>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div>
                    {isExpired ? (
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full"
                            style={{ background: T.borderSub, color: T.textMuted }}>Expired</span>
                    ) : risk ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                            style={{ background: RISK_BG[risk], color: RISK_COLOR[risk] }}>
                        {RISK_LABEL[risk]}
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: T.textMuted }}>—</span>
                    )}
                  </div>

                  {/* Last check-in */}
                  <div>
                    <p className="text-[12px] font-medium" style={{ color: T.textSub }}>{timeAgo(athlete.last_checkin_at)}</p>
                    {expiryText && expiryText !== "Expired" && (
                      <p className="text-[10px]" style={{ color: T.textMuted }}>{expiryText}</p>
                    )}
                  </div>

                  {/* Score */}
                  <div>
                    {athlete.avg_score != null ? (
                      <p className="text-[16px] font-bold tabular-nums"
                         style={{ color: risk ? RISK_COLOR[risk] : T.textSub }}>
                        {athlete.avg_score}
                        <span className="text-[10px] font-normal ml-0.5" style={{ color: T.textMuted }}>/10</span>
                      </p>
                    ) : (
                      <span className="text-[12px]" style={{ color: T.textMuted }}>—</span>
                    )}
                  </div>

                  {/* Actions */}
                  {!isExpired ? (
                    <div className="flex items-center gap-1.5">
                      {isContacted ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                              style={{ background: T.tealLight, color: T.teal }}>
                          <Check className="h-3 w-3" /> Contacted
                        </span>
                      ) : (
                        <button onClick={() => handleContact(athlete)}
                                disabled={responding === athlete.athlete_id}
                                className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                style={{ background: `linear-gradient(135deg, ${T.teal}, #0f766e)`, boxShadow: "0 1px 3px rgba(13,148,136,0.3)" }}>
                          {responding === athlete.athlete_id
                            ? <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                            : <><Phone className="h-3 w-3" /> Contact</>}
                        </button>
                      )}

                      {isScheduled ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full"
                              style={{ background: T.indigoLight, color: T.indigo }}>
                          <Check className="h-3 w-3" /> Scheduled
                        </span>
                      ) : (
                        <button onClick={() => handleSchedule(athlete)}
                                disabled={isSchedulingNow}
                                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
                                style={{ background: T.surface, borderColor: T.border, color: T.textSub }}>
                          {isSchedulingNow
                            ? <span className="h-3 w-3 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.textSub }} />
                            : <><Calendar className="h-3 w-3" /> Schedule</>}
                        </button>
                      )}

                      <Link href={`/psychiatrist/athlete?id=${athlete.athlete_id}`}>
                        <button className="flex items-center p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                                style={{ color: T.textMuted }}>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                    </div>
                  ) : (
                    <span className="text-[11px] italic" style={{ color: T.textMuted }}>Access expired</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 px-1">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: T.textMuted }} />
          <p className="text-[11px]" style={{ color: T.textMuted }}>
            Access is logged for FERPA compliance. Patients can revoke consent at any time.
            <span className="inline-flex items-center gap-1 ml-2">
              <Clock className="h-3 w-3" style={{ color: T.textMuted }} />
              14-day activity window
            </span>
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
