"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AlertCircle, Users, CalendarCheck, Heart, MessageCircle, X, Check, ChevronRight } from "lucide-react";
import Link from "next/link";

const T = {
  surface:   "#ffffff",
  raised:    "#f0f9ff",   // clinical sky blue — clean, authoritative
  border:    "#bae6fd",
  borderSub: "#e0f2fe",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  teal:      "#0d9488",  // primary — healing, mental health, clinical
  tealDeep:  "#134e4a",
  navy:      "#0369a1",  // secondary — authority, trust
  navyDeep:  "#0c4a6e",
  red:       "#dc2626",
};

const RISK_HEX   = { green: "#0d9488", yellow: "#d97706", red: "#dc2626" };
const RISK_BG    = { green: "#f0fdfa", yellow: "#fffbeb", red: "#fee2e2" };
const RISK_LABEL = { green: "Stable",  yellow: "Needs Attention", red: "High Concern" };

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
}

function riskFromAvg(avg: number): "green" | "yellow" | "red" {
  if (avg < 4) return "red";
  if (avg < 6) return "yellow";
  return "green";
}

function timeAgo(iso: string | null) {
  if (!iso) return "No check-ins";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function PsychiatristDashboard() {
  const [athletes, setAthletes]     = useState<SharedAthlete[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [userName, setUserName]     = useState("...");
  const [profId, setProfId]         = useState<string | null>(null);
  const [isDemo, setIsDemo]         = useState(false);
  const [responded, setResponded]   = useState<Record<string, "yes" | "dismissed">>({});
  const [responding, setResponding] = useState<string | null>(null);

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

        const cutoff14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
        const shared: SharedAthlete[] = await Promise.all(
          (consents ?? []).map(async (c: ConsentRow) => {
            const athleteObj = Array.isArray(c.athlete) ? c.athlete[0] : c.athlete;
            const { data: recent } = await supabase.from("checkins")
              .select("completed_at, emotional_score, resilience_score, recovery_score, support_score")
              .eq("athlete_id", c.athlete_id).gte("completed_at", cutoff14).order("completed_at", { ascending: false });
            const latest = recent?.[0] ?? null;
            let avg_score: number | null = null;
            if (latest) {
              const vals = [latest.emotional_score, latest.resilience_score, latest.recovery_score, latest.support_score].filter((v): v is number => v != null);
              if (vals.length) avg_score = vals.reduce((a, b) => a + b, 0) / vals.length;
            }
            const { data: alertData } = await supabase.from("alerts").select("id").eq("athlete_id", c.athlete_id).eq("status", "open").limit(1).maybeSingle();
            return {
              athlete_id: c.athlete_id, athlete_name: athleteObj?.full_name ?? "Unknown",
              scope: c.scope, last_checkin_at: latest?.completed_at ?? null,
              granted_at: c.granted_at, expires_at: c.expires_at, avg_score,
              risk_level: avg_score != null ? riskFromAvg(avg_score) : null,
              checkin_count_14d: recent?.length ?? 0, open_alert_id: alertData?.id ?? null,
            };
          })
        );

        const display: SharedAthlete[] = shared.length > 0 ? shared : [
          { athlete_id:"demo-1", athlete_name:"Alex Johnson",    scope:"full",    last_checkin_at:new Date(Date.now()-1*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:7.4, risk_level:"green",  checkin_count_14d:3, open_alert_id:null },
          { athlete_id:"demo-2", athlete_name:"Jordan Williams", scope:"summary", last_checkin_at:new Date(Date.now()-3*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:4.8, risk_level:"yellow", checkin_count_14d:2, open_alert_id:"demo-alert-1" },
          { athlete_id:"demo-3", athlete_name:"Sam Rivera",      scope:"full",    last_checkin_at:new Date(Date.now()-2*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:3.1, risk_level:"red",    checkin_count_14d:1, open_alert_id:"demo-alert-2" },
          { athlete_id:"demo-4", athlete_name:"Taylor Brooks",   scope:"summary", last_checkin_at:new Date(Date.now()-5*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:8.2, risk_level:"green",  checkin_count_14d:4, open_alert_id:null },
          { athlete_id:"demo-5", athlete_name:"Morgan Lee",      scope:"full",    last_checkin_at:new Date(Date.now()-4*86400000).toISOString(), granted_at:"", expires_at:null, avg_score:5.5, risk_level:"yellow", checkin_count_14d:2, open_alert_id:null },
        ];

        setAthletes(display);
        setIsDemo(shared.length === 0);
      } catch { setError("An unexpected error occurred."); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function handleOutreach(athlete: SharedAthlete, decision: "yes" | "dismissed") {
    setResponding(athlete.athlete_id);
    try {
      if (athlete.open_alert_id && !athlete.athlete_id.startsWith("demo-")) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.from("alerts").update({
          status: decision === "yes" ? "acknowledged" : "resolved",
          assigned_to_profile_id: decision === "yes" ? profId : null,
        }).eq("id", athlete.open_alert_id);
        await supabase.from("audit_logs").insert({
          actor_profile_id: profId, action: decision === "yes" ? "outreach_accepted" : "outreach_declined",
          target_type: "alert", target_id: athlete.open_alert_id,
          metadata: { athlete_id: athlete.athlete_id, decision },
        });
      }
      setResponded(r => ({ ...r, [athlete.athlete_id]: decision }));
    } catch { /* non-fatal */ }
    setResponding(null);
  }

  if (loading) return (
    <DashboardLayout role="psychiatrist" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.teal }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl p-10 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color: T.textMuted }} />
          <p style={{ color: T.textMuted }}>{error}</p>
        </div>
      </div>
    </DashboardLayout>
  );

  const withData    = athletes.filter(a => a.risk_level != null);
  const greenCount  = withData.filter(a => a.risk_level === "green").length;
  const yellowCount = withData.filter(a => a.risk_level === "yellow").length;
  const redCount    = withData.filter(a => a.risk_level === "red").length;
  const totalRisk   = withData.length;
  const checked14   = isDemo ? 5 : athletes.filter(a => a.checkin_count_14d > 0).length;
  const checkinRate = athletes.length > 0 ? Math.round((checked14 / athletes.length) * 100) : 0;
  const outreachNeeded = athletes.filter(a => a.open_alert_id && !responded[a.athlete_id]);

  return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>Counselor Dashboard</h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>Patients who have shared data with you</p>
          </div>
          {isDemo && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold"
                 style={{ background: T.raised, color: T.teal, border: `1px solid ${T.border}` }}>
              DEMO DATA
            </div>
          )}
        </div>

        {/* Demo notice */}
        {isDemo && (
          <div className="rounded-2xl px-4 py-3 text-[12px]" style={{ background: T.raised, border: `1px solid ${T.border}`, color: T.teal }}>
            Sample data shown — patients appear here once they grant you access through the app.
          </div>
        )}

        {/* Outreach requests */}
        {outreachNeeded.length > 0 && (
          <div className="rounded-3xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ background: T.raised, borderBottom: `1px solid ${T.border}` }}>
              <MessageCircle className="h-4 w-4" style={{ color: T.teal }} />
              <p className="text-[13px] font-semibold" style={{ color: T.teal }}>
                Outreach Requests — {outreachNeeded.length} patient{outreachNeeded.length !== 1 ? "s" : ""} may need support
              </p>
            </div>
            <div style={{ background: T.surface }}>
              {outreachNeeded.map((athlete, idx) => (
                <div key={athlete.athlete_id}
                     className="px-5 py-4 flex items-center justify-between gap-4"
                     style={{ borderTop: idx > 0 ? `1px solid ${T.borderSub}` : undefined }}>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[14px]" style={{ color: T.text }}>{athlete.athlete_name}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: T.teal }}>
                      Recent check-in suggests they may be struggling.
                      {athlete.avg_score != null && <span className="ml-1">Avg: <strong>{athlete.avg_score.toFixed(1)}</strong></span>}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>Last check-in: {timeAgo(athlete.last_checkin_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOutreach(athlete, "dismissed")}
                      disabled={responding === athlete.athlete_id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-colors disabled:opacity-50"
                      style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}
                    >
                      <X className="h-3.5 w-3.5" /> Not now
                    </button>
                    <button
                      onClick={() => handleOutreach(athlete, "yes")}
                      disabled={responding === athlete.athlete_id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[12px] font-semibold disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg, ${T.tealDeep}, ${T.teal})`, color: "#fff" }}
                    >
                      {responding === athlete.athlete_id
                        ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                        : <><Check className="h-3.5 w-3.5" /> Yes, I&apos;ll reach out</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: T.raised }}>
                <Users className="h-4 w-4" style={{ color: T.teal }} />
              </div>
              <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>Patients</p>
            </div>
            <p className="text-[34px] font-bold tabular-nums leading-none" style={{ color: T.text }}>{athletes.length}</p>
          </div>

          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#f0fdfa" }}>
                <CalendarCheck className="h-4 w-4" style={{ color: T.teal }} />
              </div>
              <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>Check-In Rate</p>
            </div>
            <p className="text-[34px] font-bold tabular-nums leading-none" style={{ color: T.text }}>{checkinRate}%</p>
            <div className="mt-3 h-[2px] rounded-full overflow-hidden" style={{ background: T.borderSub }}>
              <div className="h-full rounded-full" style={{ width: `${checkinRate}%`, background: `linear-gradient(135deg, ${T.tealDeep}, ${T.teal})` }} />
            </div>
            <p className="text-[11px] mt-1.5" style={{ color: T.textMuted }}>14-day rolling</p>
          </div>

          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#fee2e2" }}>
                <AlertCircle className="h-4 w-4" style={{ color: T.red }} />
              </div>
              <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>Needs Attention</p>
            </div>
            <p className="text-[34px] font-bold tabular-nums leading-none" style={{ color: T.text }}>{yellowCount + redCount}</p>
          </div>

          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "#f0fdfa" }}>
                <Heart className="h-4 w-4" style={{ color: T.teal }} />
              </div>
              <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: T.textMuted }}>Stable</p>
            </div>
            <p className="text-[34px] font-bold tabular-nums leading-none" style={{ color: T.text }}>{greenCount}</p>
          </div>
        </div>

        {/* Wellness distribution */}
        {totalRisk > 0 && (
          <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p className="text-[13px] font-semibold mb-4" style={{ color: T.textSub }}>Patient Wellness Distribution</p>
            <div className="flex h-6 rounded-xl overflow-hidden gap-[2px] mb-4">
              {greenCount > 0  && <div style={{ width: `${(greenCount / totalRisk) * 100}%`,  background: RISK_HEX.green  }} />}
              {yellowCount > 0 && <div style={{ width: `${(yellowCount / totalRisk) * 100}%`, background: RISK_HEX.yellow }} />}
              {redCount > 0    && <div style={{ width: `${(redCount / totalRisk) * 100}%`,    background: RISK_HEX.red    }} />}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                { label: "Stable",           count: greenCount,  key: "green"  as const },
                { label: "Needs Attention",  count: yellowCount, key: "yellow" as const },
                { label: "High Concern",     count: redCount,    key: "red"    as const },
              ]).map(item => (
                <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: RISK_BG[item.key] }}>
                  <p className="text-[20px] font-bold tabular-nums" style={{ color: RISK_HEX[item.key] }}>{item.count}</p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: RISK_HEX[item.key] }}>{item.label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: RISK_HEX[item.key], opacity: 0.7 }}>
                    {Math.round((item.count / totalRisk) * 100)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient list */}
        <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}`, background: T.raised }}>
            <p className="text-[13px] font-semibold" style={{ color: T.textSub }}>Patients</p>
          </div>
          <div>
            {athletes.map((athlete, idx) => {
              const isExpired  = athlete.expires_at ? new Date(athlete.expires_at) < new Date() : false;
              const outreachDone = responded[athlete.athlete_id];
              const risk = athlete.risk_level;
              return (
                <div key={athlete.athlete_id}
                     className="flex items-center justify-between px-5 py-4 gap-4"
                     style={{ opacity: isExpired ? 0.4 : 1, borderTop: idx > 0 ? `1px solid ${T.borderSub}` : undefined }}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-[13px] font-bold"
                         style={{ background: risk ? RISK_BG[risk] : T.raised, color: risk ? RISK_HEX[risk] : T.textMuted }}>
                      {athlete.athlete_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[14px]" style={{ color: T.text }}>{athlete.athlete_name}</p>
                        {risk && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ background: RISK_BG[risk], color: RISK_HEX[risk] }}>
                            {RISK_LABEL[risk]}
                          </span>
                        )}
                        {outreachDone === "yes" && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                style={{ background: "#f0fdfa", color: T.teal }}>
                            Outreach planned
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px]" style={{ color: T.textMuted }}>{timeAgo(athlete.last_checkin_at)}</span>
                        {athlete.avg_score != null && (
                          <span className="text-[11px] tabular-nums font-semibold" style={{ color: risk ? RISK_HEX[risk] : T.textSub }}>
                            {athlete.avg_score.toFixed(1)}/10
                          </span>
                        )}
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded"
                              style={{ background: T.raised, color: T.teal, border: `1px solid ${T.border}` }}>
                          {athlete.scope === "full" ? "Full" : "Summary"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!isExpired ? (
                    <Link href={`/psychiatrist/athlete?id=${athlete.athlete_id}`}>
                      <button className="flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-xl shrink-0"
                              style={{ background: `linear-gradient(135deg, ${T.tealDeep}, ${T.teal})`, color: "#fff" }}>
                        View <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  ) : (
                    <span className="text-[11px] italic shrink-0" style={{ color: T.textMuted }}>Expired</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy footer */}
        <div className="rounded-2xl p-4" style={{ background: T.raised, border: `1px solid ${T.border}` }}>
          <p className="text-[11px] text-center" style={{ color: T.textMuted }}>
            Access is logged. Patients can revoke consent at any time through the app.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
