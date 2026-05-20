"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import type { Pillar, PillarScores } from "@/types/database";
import type { PillarLevel } from "@/lib/pillar-scoring";
import { ClipboardCheck, Users, TrendingUp, TrendingDown, Minus, Heart, Zap, Moon, MessageSquare, Send, CheckCircle } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { apiFetch } from "@/lib/api-url";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

const T = {
  bg:          "#f9fafb",
  surface:     "#ffffff",
  raised:      "#f8fafc",
  border:      "#e5e7eb",
  borderSub:   "#f3f4f6",
  text:        "#111827",
  textSub:     "#374151",
  textMuted:   "#6b7280",
  indigo:      "#4f46e5",
  indigoLight: "#eef2ff",
  indigoBorder:"#c7d2fe",
  green:       "#16a34a",
  greenLight:  "#f0fdf4",
  greenDeep:   "#14532d",
  amber:       "#d97706",
  amberLight:  "#fefce8",
  red:         "#dc2626",
  redLight:    "#fef2f2",
};

const shadow = "0 1px 3px 0 rgba(0,0,0,0.06),0 1px 2px 0 rgba(0,0,0,0.04)";

const PILLAR_COLOR: Record<Pillar, string> = {
  emotional:"#16a34a", resilience:"#2563eb", recovery:"#7c3aed", support:"#0891b2",
};
const PILLAR_TRACK: Record<Pillar, string> = {
  emotional:"#dcfce7", resilience:"#dbeafe", recovery:"#ede9fe", support:"#cffafe",
};
const PILLAR_BADGE_BG: Record<Pillar, string> = {
  emotional:"#f0fdf4", resilience:"#eff6ff", recovery:"#f5f3ff", support:"#ecfeff",
};
const PILLAR_ICON: Record<Pillar, React.ReactNode> = {
  emotional:<Heart className="h-3.5 w-3.5"/>, resilience:<Zap className="h-3.5 w-3.5"/>,
  recovery:<Moon className="h-3.5 w-3.5"/>, support:<Users className="h-3.5 w-3.5"/>,
};
const PILLAR_LABEL: Record<Pillar, string> = {
  emotional:"Emotional", resilience:"Resilience", recovery:"Recovery", support:"Support",
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const LEVEL_DOT: Record<PillarLevel, string> = {
  stable:"#16a34a", moderate:"#d97706", elevated:"#f97316", high:"#dc2626",
};
const PILLARS: Pillar[] = ["emotional","resilience","recovery","support"];
type PillarDistribution = Record<PillarLevel, number>;

interface PillarTrend {
  this_week_avg:number; last_week_avg:number; month_avg:number;
  weekly_change_pct:number; direction:"up"|"down"|"flat";
}
interface AggregateData {
  checkin_rate:number; pillar_averages:PillarScores; pillar_trends:Record<Pillar, PillarTrend>;
  distribution:Record<Pillar, PillarDistribution>; athlete_count:number; checkins_this_week:number;
}

const DEMO: AggregateData = {
  checkin_rate:83, athlete_count:18, checkins_this_week:15,
  pillar_averages:{ emotional:6.4, resilience:7.1, recovery:5.8, support:6.9 },
  pillar_trends:{
    emotional: { this_week_avg:6.4, last_week_avg:5.9, month_avg:6.2, weekly_change_pct:8.5,  direction:"up"   },
    resilience:{ this_week_avg:7.1, last_week_avg:7.2, month_avg:7.0, weekly_change_pct:-1.4, direction:"flat" },
    recovery:  { this_week_avg:5.8, last_week_avg:6.3, month_avg:6.0, weekly_change_pct:-7.9, direction:"down" },
    support:   { this_week_avg:6.9, last_week_avg:6.5, month_avg:6.7, weekly_change_pct:6.2,  direction:"up"   },
  },
  distribution:{
    emotional: { stable:11, moderate:4, elevated:2, high:1 },
    resilience:{ stable:13, moderate:3, elevated:2, high:0 },
    recovery:  { stable:8,  moderate:5, elevated:4, high:1 },
    support:   { stable:12, moderate:4, elevated:2, high:0 },
  },
};


// Plain-word direction badge — no raw % (meaningless to coaches)
function TrendBadge({ direction }: { direction:"up"|"down"|"flat" }) {
  if (direction==="up")   return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color:T.green, background:T.greenLight }}><TrendingUp className="h-3 w-3"/>Improving</span>;
  if (direction==="down") return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color:T.red, background:T.redLight }}><TrendingDown className="h-3 w-3"/>Declining</span>;
  return <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color:T.textMuted, background:T.raised }}><Minus className="h-3 w-3"/>Stable</span>;
}

// Recharts tooltip for the pillar trend chart
function CoachChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl p-3 text-[12px]"
         style={{ background:"#ffffff", border:"1px solid #e5e7eb", boxShadow:"0 4px 20px rgba(0,0,0,0.08)" }}>
      <p className="font-semibold mb-1.5" style={{ color:"#374151" }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 mb-0.5">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            <span style={{ color:"#6b7280" }}>{entry.name}</span>
          </div>
          <span className="font-bold tabular-nums" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function CoachDashboard() {
  const [profile, setProfile]         = useState<{ full_name:string }|null>(null);
  const [profileId, setProfileId]     = useState<string|null>(null);
  const [teamId,   setTeamId]         = useState<string|null>(null);
  const [teamName, setTeamName]       = useState("");
  const [data,     setData]           = useState<AggregateData|null>(null);
  const [noTeam,   setNoTeam]         = useState(false);
  const [loading,  setLoading]        = useState(true);
  const [error,    setError]          = useState(false);
  const [isDemo,   setIsDemo]         = useState(false);
  // Team message state
  const [activeMessage, setActiveMessage]   = useState<string|null>(null);
  const [messageInput,  setMessageInput]    = useState("");
  const [messageSaving, setMessageSaving]   = useState(false);
  const [messageError,  setMessageError]    = useState<string|null>(null);
  const [messageSent,   setMessageSent]     = useState(false);

  async function load() {
    setLoading(true); setError(false);
    try {
      const supabase = createClient();
      const { data: prof } = await supabase.from("profiles").select("id, full_name, team_id")
        .eq("auth_user_id",(await supabase.auth.getUser()).data.user?.id??"").single();
      if (prof) {
        setProfile({ full_name:prof.full_name });
        setProfileId(prof.id);
        setTeamId(prof.team_id ?? null);
        if (prof.team_id) {
          const [teamRes, msgRes] = await Promise.all([
            supabase.from("teams").select("name").eq("id",prof.team_id).single(),
            supabase.from("team_messages")
              .select("message")
              .eq("team_id", prof.team_id)
              .gt("expires_at", new Date().toISOString())
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);
          if (teamRes.data) setTeamName(teamRes.data.name);
          if (msgRes.data)  setActiveMessage(msgRes.data.message);
        }
      }
      const res  = await apiFetch("/api/coach/aggregate",{ method:"POST" });
      const json = await res.json() as AggregateData & { insufficient_data?:boolean; no_team?:boolean };
      if (json.no_team)          { setNoTeam(true);             return; }
      if (json.insufficient_data){ setData(DEMO); setIsDemo(true); return; }
      setData(json); setIsDemo(false);
    } catch (e: unknown) {
      console.error("[coach/dashboard] load failed:", e);
      setError(true);
    } finally { setLoading(false); }
  }

  async function handleSendMessage() {
    if (!profileId || !teamId || !messageInput.trim()) return;
    setMessageSaving(true); setMessageError(null); setMessageSent(false);
    try {
      const supabase = createClient();
      const { error: insertErr } = await supabase.from("team_messages").insert({
        team_id:          teamId,
        coach_profile_id: profileId,
        message:          messageInput.trim(),
      });
      if (insertErr) { setMessageError(insertErr.message); return; }
      setActiveMessage(messageInput.trim());
      setMessageInput("");
      setMessageSent(true);
      setTimeout(() => setMessageSent(false), 3000);
    } catch (e) {
      setMessageError(String(e));
    } finally {
      setMessageSaving(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <DashboardLayout role="coach" userName="..."><div className="flex items-center justify-center h-64"><div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor:T.border, borderTopColor:T.green }}/></div></DashboardLayout>;
  if (error)   return <DashboardLayout role="coach" userName={profile?.full_name||"Coach"}><div className="max-w-2xl mx-auto"><div className="rounded-2xl p-10 text-center" style={{ background:T.surface, border:`1px solid ${T.border}` }}><p className="text-[14px] mb-3" style={{ color:T.textMuted }}>Couldn&apos;t load team data.</p><button onClick={load} className="text-[13px] font-semibold" style={{ color:T.green }}>Retry</button></div></div></DashboardLayout>;

  if (noTeam) return (
    <DashboardLayout role="coach" userName={profile?.full_name||"Coach"}>
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl p-16 text-center" style={{ background:T.surface, border:`1px solid ${T.border}` }}>
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background:T.raised }}>
            <Users className="h-7 w-7" style={{ color:"#cbd5e1" }}/>
          </div>
          <p className="font-bold mb-1.5" style={{ color:T.textSub }}>Not assigned to a team yet</p>
          <p className="text-[13px] max-w-sm mx-auto" style={{ color:T.textMuted }}>Contact your administrator to be linked to a roster.</p>
        </div>
      </div>
    </DashboardLayout>
  );

  // Overall team status — derived from avg of all 4 pillar averages
  const overallAvg = data
    ? (PILLARS.reduce((s,p) => s + data.pillar_averages[p], 0) / 4)
    : null;
  const overallDelta = data
    ? (PILLARS.reduce((s,p) => s + data.pillar_trends[p].this_week_avg, 0) / 4) -
      (PILLARS.reduce((s,p) => s + data.pillar_trends[p].last_week_avg, 0) / 4)
    : 0;

  const teamStatus = !overallAvg ? null
    : overallAvg >= 7  ? { label:"Team is doing well",        color:T.green,   bg:T.greenLight,  border:"#bbf7d0",  textCol:T.greenDeep }
    : overallAvg >= 5  ? { label:"Some areas need attention", color:T.amber,   bg:T.amberLight,  border:"#fde68a",  textCol:"#92400e"   }
    :                    { label:"Team needs support",         color:T.red,     bg:T.redLight,    border:"#fecaca",  textCol:"#991b1b"   };

  // Sort pillars weakest first so coaches immediately see what needs attention
  const sortedPillars = data
    ? [...PILLARS].sort((a,b) => data.pillar_averages[a] - data.pillar_averages[b])
    : PILLARS;

  return (
    <DashboardLayout role="coach" userName={profile?.full_name||"Coach"}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold tracking-tight" style={{ color:T.text }}>Team Dashboard</h1>
            <p className="text-[13px] mt-0.5" style={{ color:T.textMuted }}>{teamName ? `${teamName} · ` : ""}Aggregate · anonymized</p>
          </div>
          {isDemo && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0"
                  style={{ background:T.indigoLight, color:T.indigo, border:`1px solid ${T.indigoBorder}` }}>Demo</span>
          )}
        </div>

        {isDemo && (
          <div className="rounded-xl px-4 py-3 text-[12px]" style={{ background:T.indigoLight, border:`1px solid ${T.indigoBorder}`, color:T.indigo }}>
            Sample data shown — at least 5 athletes must check in before real trends appear. This protects individual privacy.
          </div>
        )}

        {data && (
          <>
            {/* KPI strip — athletes + check-in rate only */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                ariaLabel={`Total athletes on your team: ${data.athlete_count}`}
                label="Total Athletes"
                value={data.athlete_count}
                icon={<Users className="h-4 w-4" aria-hidden />}
                iconColor="#2563eb"
                iconBg="#eff6ff"
              />

              <MetricCard
                ariaLabel={`Check-in rate this week: ${data.checkin_rate} percent. ${data.checkins_this_week} of ${data.athlete_count} athletes checked in.`}
                label="Check-In Rate"
                value={data.checkin_rate}
                valueSuffix="%"
                subtitle={`${data.checkins_this_week} / ${data.athlete_count} this week`}
                icon={<ClipboardCheck className="h-4 w-4" aria-hidden />}
                iconColor={T.green}
                iconBg={T.greenLight}
                progress={data.checkin_rate}
                progressColor={data.checkin_rate >= 70 ? T.green : T.amber}
              />
            </div>

            {/* Team status card — replaces donut */}
            {teamStatus && (
              <div className="rounded-xl px-5 py-4" style={{ background:teamStatus.bg, border:`1px solid ${teamStatus.border}`, boxShadow:shadow }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[17px] font-bold" style={{ color:T.text }}>{teamStatus.label}</p>
                    <p className="text-[12px] mt-0.5" style={{ color:teamStatus.textCol }}>
                      Overall avg: {overallAvg!.toFixed(1)}/10 this week
                      {" · "}
                      {overallDelta > 0.1
                        ? <span style={{ color:T.green }}>↑ up from last week</span>
                        : overallDelta < -0.1
                        ? <span style={{ color:T.red }}>↓ down from last week</span>
                        : <span style={{ color:T.textMuted }}>→ steady</span>}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background:"rgba(255,255,255,0.6)" }}>
                    {overallAvg! >= 7
                      ? <TrendingUp className="h-5 w-5" style={{ color:T.green }}/>
                      : overallAvg! >= 5
                      ? <Minus className="h-5 w-5" style={{ color:T.amber }}/>
                      : <TrendingDown className="h-5 w-5" style={{ color:T.red }}/>}
                  </div>
                </div>
              </div>
            )}

            {/* Pillar trends — chart + summary rows */}
            {(() => {
              const chartData = [
                { label:"2–4wk avg", ...Object.fromEntries(PILLARS.map(p => [p, data.pillar_trends[p].month_avg])) },
                { label:"Last week", ...Object.fromEntries(PILLARS.map(p => [p, data.pillar_trends[p].last_week_avg])) },
                { label:"This week", ...Object.fromEntries(PILLARS.map(p => [p, data.pillar_trends[p].this_week_avg])) },
              ];
              return (
                <div className="rounded-xl overflow-hidden" style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}>
                  <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom:`1px solid ${T.border}` }}>
                    <p className="text-[14px] font-semibold" style={{ color:T.text }}>Pillar Trends</p>
                    <span className="text-[11px]" style={{ color:T.textMuted }}>Last 4 weeks</span>
                  </div>

                  {/* Chart */}
                  <div className="px-4 pt-4 pb-1">
                    <div style={{ height:180 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top:5, right:8, left:-22, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                          <XAxis dataKey="label" tick={{ fontSize:11, fill:"#9ca3af" }} tickLine={false} axisLine={{ stroke:"#e5e7eb" }}/>
                          <YAxis domain={[0,10]} ticks={[0,2,4,6,8,10]} tick={{ fontSize:11, fill:"#9ca3af" }} tickLine={false} axisLine={false}/>
                          <ReferenceLine y={5} stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={1}/>
                          <Tooltip content={<CoachChartTooltip/>}/>
                          {PILLARS.map(p => (
                            <Line key={p} type="monotone" dataKey={p}
                                  stroke={PILLAR_COLOR[p]} strokeWidth={2.5}
                                  dot={{ r:4, fill:PILLAR_COLOR[p], strokeWidth:0 }}
                                  activeDot={{ r:6, strokeWidth:0 }}
                                  name={PILLAR_LABEL[p]}/>
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mt-2 mb-3">
                      {PILLARS.map(p => (
                        <div key={p} className="flex items-center gap-1.5">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background:PILLAR_COLOR[p] }}/>
                          <span className="text-[11px] font-medium" style={{ color:T.textSub }}>{PILLAR_LABEL[p]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary rows — weakest first */}
                  <div className="divide-y" style={{ borderColor:T.borderSub, borderTop:`1px solid ${T.borderSub}` }}>
                    {sortedPillars.map(pillar => {
                      const avg  = data.pillar_averages[pillar];
                      const trnd = data.pillar_trends[pillar];
                      const col  = PILLAR_COLOR[pillar];
                      const scoreColor = avg >= 7 ? T.green : avg >= 5 ? T.amber : T.red;
                      return (
                        <div key={pillar} className="px-5 py-2.5 flex items-center gap-3">
                          <div className="flex items-center gap-2 w-24 shrink-0">
                            <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                                 style={{ background:PILLAR_BADGE_BG[pillar], color:col }}>
                              {PILLAR_ICON[pillar]}
                            </div>
                            <span className="text-[12px] font-semibold" style={{ color:T.textSub }}>{PILLAR_LABEL[pillar]}</span>
                          </div>
                          <span className="text-[15px] font-bold tabular-nums w-9 shrink-0" style={{ color:scoreColor }}>
                            {avg.toFixed(1)}
                          </span>
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:PILLAR_TRACK[pillar] }}>
                            <div className="h-full rounded-full transition-all duration-700"
                                 style={{ width:`${Math.round((avg/10)*100)}%`, background:col }}/>
                          </div>
                          <div className="w-20 shrink-0 flex justify-end">
                            <TrendBadge direction={trnd.direction}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-5 py-2 flex items-center gap-2" style={{ borderTop:`1px solid ${T.borderSub}`, background:T.raised }}>
                    <div className="h-px w-8 border-t-2 border-dashed" style={{ borderColor:"#94a3b8" }}/>
                    <span className="text-[10px]" style={{ color:T.textMuted }}>Dashed line = alert threshold (5/10)</span>
                  </div>
                </div>
              );
            })()}

            {/* Team message card */}
            <div className="rounded-xl overflow-hidden" style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}>
              <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom:`1px solid ${T.border}` }}>
                <MessageSquare className="h-4 w-4" style={{ color:T.indigo }}/>
                <p className="text-[14px] font-semibold" style={{ color:T.text }}>Message to Team</p>
                <span className="text-[11px] ml-auto" style={{ color:T.textMuted }}>Visible to all athletes · expires in 7 days</span>
              </div>
              <div className="p-5 space-y-3">
                {/* Active message preview */}
                {activeMessage && (
                  <div className="rounded-xl px-4 py-3" style={{ background:T.indigoLight, border:`1px solid ${T.indigoBorder}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color:T.indigo }}>Current message</p>
                    <p className="text-[13px] leading-relaxed" style={{ color:"#312e81" }}>{activeMessage}</p>
                  </div>
                )}
                {/* Compose */}
                <div>
                  <textarea
                    placeholder="Share a wellness note with your team — e.g. 'Great effort in practice this week. Recovery is just as important as training.'"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value.slice(0, 280))}
                    rows={3}
                    className="w-full px-3.5 py-3 rounded-2xl text-[13px] resize-none leading-relaxed focus:outline-none"
                    style={{
                      background: T.raised,
                      border: `1px solid ${T.border}`,
                      color: T.textSub,
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px]" style={{ color: messageInput.length > 240 ? T.amber : T.textMuted }}>
                      {messageInput.length}/280
                    </span>
                    <div className="flex items-center gap-2">
                      {messageSent && (
                        <span className="flex items-center gap-1 text-[12px] font-medium" style={{ color:T.green }}>
                          <CheckCircle className="h-3.5 w-3.5"/>Sent to team
                        </span>
                      )}
                      {messageError && (
                        <span className="text-[12px]" style={{ color:T.red }}>{messageError}</span>
                      )}
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || messageSaving}
                        className="flex items-center gap-1.5 h-9 px-4 text-[13px] font-bold text-white rounded-2xl disabled:opacity-40 transition-opacity"
                        style={{ background:`linear-gradient(135deg, #312e81, ${T.indigo})`, boxShadow:"0 2px 8px rgba(79,70,229,0.25)" }}
                      >
                        {messageSaving
                          ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
                          : <><Send className="h-3.5 w-3.5"/>Send</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy footer */}
            <div className="rounded-xl px-4 py-3.5" style={{ background:T.greenLight, border:"1px solid #bbf7d0" }}>
              <p className="text-[11px] text-center" style={{ color:T.greenDeep }}>
                All data is aggregated and anonymized. Individual responses are never visible to coaches.
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
