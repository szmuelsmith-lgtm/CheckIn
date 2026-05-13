"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import type { Pillar, PillarScores } from "@/types/database";
import type { PillarLevel } from "@/lib/pillar-scoring";
import { ClipboardCheck, Users, TrendingUp, TrendingDown, Minus, Heart, Zap, Shield, ArrowRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

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
  recovery:<Shield className="h-3.5 w-3.5"/>, support:<Users className="h-3.5 w-3.5"/>,
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

const DonutTooltip = ({ active, payload }: {
  active?:boolean;
  payload?:Array<{ name:string; value:number; payload:{ color:string } }>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-[12px]" style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:"0 4px 12px rgba(0,0,0,0.1)" }}>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full" style={{ background:payload[0].payload.color }} />
        <span style={{ color:T.textSub }}>{payload[0].name}</span>
        <span className="font-bold ml-2" style={{ color:T.text }}>{payload[0].value}</span>
      </div>
    </div>
  );
};

function TrendBadge({ pct, direction }: { pct:number; direction:"up"|"down"|"flat" }) {
  if (direction==="up")   return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color:T.green, background:T.greenLight }}><TrendingUp className="h-3 w-3"/>+{Math.abs(pct).toFixed(1)}%</span>;
  if (direction==="down") return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color:T.red, background:T.redLight }}><TrendingDown className="h-3 w-3"/>−{Math.abs(pct).toFixed(1)}%</span>;
  return <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color:T.textMuted, background:T.raised }}><Minus className="h-3 w-3"/>Flat</span>;
}

export default function CoachDashboard() {
  const [profile, setProfile]   = useState<{ full_name:string }|null>(null);
  const [teamName,setTeamName]  = useState("");
  const [data,    setData]      = useState<AggregateData|null>(null);
  const [noTeam,  setNoTeam]    = useState(false);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(false);
  const [isDemo,  setIsDemo]    = useState(false);

  async function load() {
    setLoading(true); setError(false);
    try {
      const supabase = createClient();
      const { data: prof } = await supabase.from("profiles").select("full_name, team_id")
        .eq("auth_user_id",(await supabase.auth.getUser()).data.user?.id??"").single();
      if (prof) {
        setProfile({ full_name:prof.full_name });
        if (prof.team_id) {
          const { data: team } = await supabase.from("teams").select("name").eq("id",prof.team_id).single();
          if (team) setTeamName(team.name);
        }
      }
      const res  = await fetch("/api/coach/aggregate",{ method:"POST" });
      const json = await res.json() as AggregateData & { insufficient_data?:boolean; no_team?:boolean };
      if (json.no_team)          { setNoTeam(true);             return; }
      if (json.insufficient_data){ setData(DEMO); setIsDemo(true); return; }
      setData(json); setIsDemo(false);
    } catch { setError(true); }
    finally { setLoading(false); }
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

  const dist       = data?.distribution.emotional ?? { stable:0, moderate:0, elevated:0, high:0 };
  const total      = dist.stable + dist.moderate + dist.elevated + dist.high;
  const atRisk     = dist.moderate + dist.elevated + dist.high;
  const donutData  = [
    { name:"Stable",   value:dist.stable,   color:"#16a34a" },
    { name:"Moderate", value:dist.moderate, color:"#d97706" },
    { name:"Elevated", value:dist.elevated, color:"#f97316" },
    { name:"High",     value:dist.high,     color:"#dc2626" },
  ].filter(d => d.value > 0);

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
            {/* KPI strip */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl p-5" style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background:"#eff6ff" }}>
                    <Users className="h-4 w-4" style={{ color:"#2563eb" }}/>
                  </div>
                </div>
                <p className="text-[30px] font-bold tabular-nums leading-none mb-1" style={{ color:T.text }}>{data.athlete_count}</p>
                <p className="text-[12px] font-medium" style={{ color:T.textMuted }}>Total athletes</p>
              </div>

              <div className="rounded-xl p-5" style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background:T.greenLight }}>
                    <ClipboardCheck className="h-4 w-4" style={{ color:T.green }}/>
                  </div>
                </div>
                <p className="text-[30px] font-bold tabular-nums leading-none mb-1" style={{ color:T.text }}>
                  {data.checkin_rate}<span className="text-[16px] font-medium ml-0.5" style={{ color:T.textMuted }}>%</span>
                </p>
                <p className="text-[12px] font-medium mb-3" style={{ color:T.textMuted }}>
                  Check-in rate · {data.checkins_this_week}/{data.athlete_count} this week
                </p>
                <div className="h-1 rounded-full overflow-hidden" style={{ background:T.borderSub }}>
                  <div className="h-full rounded-full transition-all duration-700"
                       style={{ width:`${data.checkin_rate}%`, background:data.checkin_rate>=70?T.green:T.amber }} />
                </div>
              </div>

              <Link href="/coach/followups"
                    className="rounded-xl p-5 flex flex-col group transition-shadow hover:shadow-md"
                    style={{ background:atRisk>0?T.redLight:T.surface, border:`1px solid ${atRisk>0?"#fecaca":T.border}`, boxShadow:shadow }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background:atRisk>0?"#fecaca":T.raised }}>
                    <AlertTriangle className="h-4 w-4" style={{ color:atRisk>0?T.red:T.textMuted }}/>
                  </div>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" style={{ color:T.textMuted }}/>
                </div>
                <p className="text-[30px] font-bold tabular-nums leading-none mb-1" style={{ color:atRisk>0?T.red:T.text }}>{atRisk}</p>
                <p className="text-[12px] font-medium" style={{ color:T.textMuted }}>Need attention · follow-ups</p>
              </Link>
            </div>

            {/* Donut + Pillar averages */}
            <div className="grid grid-cols-5 gap-4">

              {/* Donut — 2 cols */}
              <div className="col-span-2 rounded-xl p-5" style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}>
                <p className="text-[14px] font-semibold mb-1" style={{ color:T.text }}>Wellness Distribution</p>
                <p className="text-[11px] mb-4" style={{ color:T.textMuted }}>{total} athletes · emotional score</p>
                <div className="flex items-center gap-4">
                  <div style={{ width:100, height:100, flexShrink:0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} paddingAngle={2} dataKey="value" strokeWidth={0}>
                          {donutData.map((e,i) => <Cell key={i} fill={e.color}/>)}
                        </Pie>
                        <Tooltip content={<DonutTooltip/>}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[
                      { label:"Stable",   count:dist.stable,   color:"#16a34a" },
                      { label:"Moderate", count:dist.moderate, color:"#d97706" },
                      { label:"Elevated", count:dist.elevated, color:"#f97316" },
                      { label:"High",     count:dist.high,     color:"#dc2626" },
                    ].filter(r=>r.count>0).map(row=>(
                      <div key={row.label} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ background:row.color }}/>
                        <span className="text-[11px] flex-1" style={{ color:T.textMuted }}>{row.label}</span>
                        <span className="text-[12px] font-bold tabular-nums" style={{ color:T.textSub }}>{row.count}</span>
                        <span className="text-[10px] w-7 text-right" style={{ color:T.textMuted }}>
                          {total>0?Math.round((row.count/total)*100):0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pillar averages — 3 cols */}
              <div className="col-span-3 rounded-xl overflow-hidden" style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}>
                <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom:`1px solid ${T.border}` }}>
                  <p className="text-[14px] font-semibold" style={{ color:T.text }}>Pillar Averages</p>
                  <span className="text-[11px]" style={{ color:T.textMuted }}>This week vs last</span>
                </div>
                <div className="divide-y" style={{ borderColor:T.borderSub }}>
                  {PILLARS.map(pillar => {
                    const avg  = data.pillar_averages[pillar];
                    const trnd = data.pillar_trends[pillar];
                    const col  = PILLAR_COLOR[pillar];
                    return (
                      <div key={pillar} className="px-5 py-3.5 flex items-center gap-4">
                        <div className="flex items-center gap-2.5 w-28 shrink-0">
                          <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                               style={{ background:PILLAR_BADGE_BG[pillar], color:col }}>
                            {PILLAR_ICON[pillar]}
                          </div>
                          <span className="text-[12px] font-semibold" style={{ color:T.textSub }}>{PILLAR_LABEL[pillar]}</span>
                        </div>
                        <span className="text-[15px] font-bold tabular-nums w-9 shrink-0" style={{ color:T.text }}>{avg.toFixed(1)}</span>
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:PILLAR_TRACK[pillar] }}>
                          <div className="h-full rounded-full transition-all duration-700" style={{ width:`${Math.round((avg/10)*100)}%`, background:col }}/>
                        </div>
                        <div className="w-[72px] shrink-0 flex justify-end">
                          <TrendBadge pct={Math.abs(trnd.weekly_change_pct)} direction={trnd.direction}/>
                        </div>
                      </div>
                    );
                  })}
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
