"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  AlertCircle, Users, CalendarCheck, Heart, MessageCircle,
  X, Check, Phone, Calendar, Clock,
  ShieldCheck, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { evaluateRiskLevel } from "@/lib/pillar-scoring";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:          "#f8fafc",
  surface:     "#ffffff",
  raised:      "#f8fafc",
  border:      "#e2e8f0",
  borderSub:   "#f1f5f9",
  text:        "#0f172a",
  textSub:     "#334155",
  textMuted:   "#64748b",
  teal:        "#0d9488",
  tealDeep:    "#134e4a",
  red:         "#dc2626",
  redLight:    "#fee2e2",
  amber:       "#d97706",
  amberLight:  "#fef3c7",
  green:       "#16a34a",
  greenLight:  "#dcfce7",
};

const RISK_COLOR = { green: T.green,  yellow: T.amber,  red: T.red   };
const RISK_BG    = { green: T.greenLight, yellow: T.amberLight, red: T.redLight };
const RISK_LABEL = { green: "Stable", yellow: "Moderate", red: "High Risk" };
const RISK_ORDER = { red: 0, yellow: 1, green: 2 };

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

// ─── Page ──────────────────────────────────────────────────────────────────────
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
      await handleOutreach(athlete, "accepted");
      return;
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

  // ── Derived ───────────────────────────────────────────────────────────────────
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
             style={{ borderColor: T.border, borderTopColor: T.teal }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl p-10 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color: T.textMuted }} />
          <p style={{ color: T.textMuted }}>{error}</p>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* ── Page header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ color: T.text }}>
              Counselor Dashboard
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>
              {isDemo ? "Demo data · " : ""}{athletes.length} patient{athletes.length !== 1 ? "s" : ""} sharing access
            </p>
          </div>
          {isDemo && (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
                  style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
              Demo data
            </span>
          )}
        </div>

        {/* ── KPI strip ───────────────────────────────────────────────────────── */}
        <div className="rounded-xl overflow-hidden"
             style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <div className="grid grid-cols-4 divide-x" style={{ borderColor: T.border }}>
            {[
              { icon: <Users        className="h-4 w-4" style={{ color: T.teal    }} />, label: "Patients",       value: String(athletes.length), color: T.text    },
              { icon: <CalendarCheck className="h-4 w-4" style={{ color: T.teal   }} />, label: "14-Day Active",  value: `${checkinRate}%`,        color: T.text    },
              { icon: <AlertCircle  className="h-4 w-4" style={{ color: T.red     }} />, label: "Need Attention", value: String(yellowCount + redCount), color: (yellowCount + redCount) > 0 ? T.red : T.text },
              { icon: <Heart        className="h-4 w-4" style={{ color: T.green   }} />, label: "Stable",         value: String(greenCount),       color: T.text    },
            ].map((stat, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  {stat.icon}
                  <p className="text-[11px] font-semibold uppercase tracking-wider"
                     style={{ color: T.textMuted }}>{stat.label}</p>
                </div>
                <p className="text-[28px] font-bold tabular-nums leading-none"
                   style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Urgent outreach queue ────────────────────────────────────────────── */}
        {urgentQueue.length > 0 && (
          <div className="rounded-xl overflow-hidden"
               style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="px-5 py-3 flex items-center gap-2.5"
                 style={{ background: T.redLight, borderBottom: `1px solid #fecaca` }}>
              <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: T.red }} />
              <AlertCircle className="h-4 w-4" style={{ color: T.red }} />
              <p className="text-[13px] font-semibold" style={{ color: "#991b1b" }}>
                Outreach Needed — {urgentQueue.length} patient{urgentQueue.length !== 1 ? "s" : ""} flagged
              </p>
            </div>
            {urgentQueue.map((athlete, idx) => (
              <div key={athlete.athlete_id}
                   className="px-5 py-3.5 flex items-center justify-between gap-4"
                   style={{ borderTop: idx > 0 ? `1px solid #fee2e2` : undefined }}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold"
                       style={{ background: T.redLight, color: T.red }}>
                    {athlete.athlete_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-[14px]" style={{ color: T.text }}>{athlete.athlete_name}</p>
                    <p className="text-[11px]" style={{ color: T.textMuted }}>
                      Score: {athlete.avg_score ?? "—"}/10 · Last check-in: {timeAgo(athlete.last_checkin_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOutreach(athlete, "dismissed")}
                    disabled={responding === athlete.athlete_id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium disabled:opacity-50"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}>
                    <X className="h-3.5 w-3.5" /> Defer
                  </button>
                  <button
                    onClick={() => handleOutreach(athlete, "accepted")}
                    disabled={responding === athlete.athlete_id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold disabled:opacity-50"
                    style={{ background: T.teal, color: "#fff" }}>
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
             style={{ background: T.surface, border: `1px solid ${T.border}` }}>

          {/* Table header */}
          <div className="px-5 py-3.5 flex items-center justify-between"
               style={{ borderBottom: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" style={{ color: T.teal }} />
              <p className="text-[13px] font-semibold" style={{ color: T.text }}>Active Permissions</p>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: "#f0fdfa", color: T.teal }}>
                {athletes.length}
              </span>
            </div>
            {totalRisk > 0 && (
              <div className="flex items-center gap-3 text-[11px]">
                {greenCount  > 0 && <span style={{ color: T.green  }}>{greenCount} stable</span>}
                {yellowCount > 0 && <span style={{ color: T.amber  }}>{yellowCount} moderate</span>}
                {redCount    > 0 && <span style={{ color: T.red    }}>{redCount} high risk</span>}
              </div>
            )}
          </div>

          {/* Column headers */}
          {athletes.length > 0 && (
            <div className="px-5 py-2.5 grid gap-4"
                 style={{ gridTemplateColumns: "1fr 80px 100px 80px 180px", borderBottom: `1px solid ${T.borderSub}`, background: T.raised }}>
              {["Patient", "Status", "Last Check-In", "Score", "Actions"].map(h => (
                <p key={h} className="text-[10px] font-semibold uppercase tracking-wider"
                   style={{ color: T.textMuted }}>{h}</p>
              ))}
            </div>
          )}

          {/* Rows */}
          {sorted.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-3" style={{ color: "#cbd5e1" }} />
              <p className="text-[13px] font-medium" style={{ color: T.textMuted }}>No active permissions yet</p>
              <p className="text-[12px] mt-1" style={{ color: T.textMuted }}>
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
                     className="px-5 py-3.5 grid gap-4 items-center"
                     style={{
                       gridTemplateColumns: "1fr 80px 100px 80px 180px",
                       borderTop: idx > 0 ? `1px solid ${T.borderSub}` : undefined,
                       opacity: isExpired ? 0.5 : 1,
                     }}>

                  {/* Name + scope */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold"
                         style={{ background: risk && !isExpired ? RISK_BG[risk] : T.raised, color: risk && !isExpired ? RISK_COLOR[risk] : T.textMuted }}>
                      {athlete.athlete_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[13px] truncate" style={{ color: T.text }}>{athlete.athlete_name}</p>
                      <span className="text-[9px] font-semibold uppercase tracking-wider"
                            style={{ color: athlete.scope === "full" ? T.teal : T.textMuted }}>
                        {athlete.scope === "full" ? "Full access" : "Summary"}
                      </span>
                    </div>
                  </div>

                  {/* Risk status */}
                  <div>
                    {isExpired ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
                            style={{ background: T.raised, color: T.textMuted }}>Expired</span>
                    ) : risk ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={{ background: RISK_BG[risk], color: RISK_COLOR[risk] }}>
                        {RISK_LABEL[risk]}
                      </span>
                    ) : (
                      <span className="text-[11px]" style={{ color: T.textMuted }}>—</span>
                    )}
                  </div>

                  {/* Last check-in */}
                  <div>
                    <p className="text-[12px]" style={{ color: T.textSub }}>{timeAgo(athlete.last_checkin_at)}</p>
                    {expiryText && expiryText !== "Expired" && (
                      <p className="text-[10px]" style={{ color: T.textMuted }}>{expiryText}</p>
                    )}
                  </div>

                  {/* Score */}
                  <div>
                    {athlete.avg_score != null ? (
                      <p className="text-[14px] font-bold tabular-nums"
                         style={{ color: risk ? RISK_COLOR[risk] : T.textSub }}>
                        {athlete.avg_score}<span className="text-[10px] font-normal ml-0.5" style={{ color: T.textMuted }}>/10</span>
                      </p>
                    ) : (
                      <span className="text-[12px]" style={{ color: T.textMuted }}>—</span>
                    )}
                  </div>

                  {/* Actions */}
                  {!isExpired ? (
                    <div className="flex items-center gap-1.5">
                      {/* Contact */}
                      {isContacted ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded"
                              style={{ background: "#f0fdfa", color: T.teal }}>
                          <Check className="h-3 w-3" /> Contacted
                        </span>
                      ) : (
                        <button onClick={() => handleContact(athlete)}
                                disabled={responding === athlete.athlete_id}
                                className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                style={{ background: T.teal, color: "#fff" }}>
                          {responding === athlete.athlete_id
                            ? <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                            : <><Phone className="h-3 w-3" /> Contact</>}
                        </button>
                      )}

                      {/* Schedule */}
                      {isScheduled ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded"
                              style={{ background: "#eff6ff", color: "#2563eb" }}>
                          <Check className="h-3 w-3" /> Scheduled
                        </span>
                      ) : (
                        <button onClick={() => handleSchedule(athlete)}
                                disabled={isSchedulingNow}
                                className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
                                style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textSub }}>
                          {isSchedulingNow
                            ? <span className="h-3 w-3 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.textSub }} />
                            : <><Calendar className="h-3 w-3" /> Schedule</>}
                        </button>
                      )}

                      {/* View */}
                      <Link href={`/psychiatrist/athlete?id=${athlete.athlete_id}`}>
                        <button className="flex items-center gap-0.5 text-[11px] font-medium px-2 py-1.5 rounded-lg transition-colors"
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
        <div className="flex items-center gap-2.5 px-1">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: T.textMuted }} />
          <p className="text-[11px]" style={{ color: T.textMuted }}>
            Access is logged for FERPA compliance. Patients can revoke consent at any time through the app.
            <span className="ml-1">
              <Clock className="h-3 w-3 inline mr-0.5" style={{ color: T.textMuted }} />
              14-day activity window
            </span>
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
