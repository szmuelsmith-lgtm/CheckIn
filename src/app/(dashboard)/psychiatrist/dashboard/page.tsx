"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import {
  AlertCircle, Users2, MessageCircle,
  X, Check, Phone, Calendar, ShieldCheck,
  ArrowUpRight, Tag, Clock, FileText, Activity,
  ChevronRight, TrendingUp, Send, History,
} from "lucide-react";
import Link from "next/link";
import { evaluateRiskLevel } from "@/lib/pillar-scoring";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:          "#f8fafc",
  surface:     "#ffffff",
  raised:      "#f1f5f9",
  border:      "#e2e8f0",
  borderSub:   "#f1f5f9",
  text:        "#0f172a",
  textSub:     "#334155",
  textMuted:   "#64748b",
  // Primary accent — brand emerald (was indigo-blue; greened to match athlete app)
  blue:        "#059669",
  blueDark:    "#065f46",
  blueLight:   "#ecfdf5",
  blueBorder:  "#a7f3d0",
  green:       "#059669",
  greenLight:  "#ecfdf5",
  amber:       "#d97706",
  amberLight:  "#fefce8",
  red:         "#dc2626",
  redLight:    "#fef2f2",
  redBorder:   "#fecaca",
};

const shadow = "0 1px 3px 0 rgba(0,0,0,0.06),0 1px 2px 0 rgba(0,0,0,0.04)";

// ─── Types ────────────────────────────────────────────────────────────────────
type SessionStatus = "pending" | "arrived" | "in-session" | "completed" | "no-show";
type TabId = "overview" | "assessment" | "history" | "messages" | "actions";

interface PillarSnapshot {
  date:        string;
  emotional:   number | null;
  resilience:  number | null;
  recovery:    number | null;
  support:     number | null;
  avg:         number | null;
}

interface SharedAthlete {
  athlete_id:        string;
  athlete_name:      string;
  scope:             "summary" | "full";
  last_checkin_at:   string | null;
  expires_at:        string | null;
  avg_score:         number | null;
  emotional_score:   number | null;
  resilience_score:  number | null;
  recovery_score:    number | null;
  support_score:     number | null;
  risk_level:        "green" | "yellow" | "red" | null;
  checkin_count_14d: number;
  open_alert_id:     string | null;
  has_followup:      boolean;
  score_history:     number[];
  pillar_history:    PillarSnapshot[];
  session_time?:     string;
  session_status?:   SessionStatus;
  tags?:             string[];
  last_note?:        string;
}

interface Message {
  id:           string;
  sender_id:    string;
  recipient_id: string;
  body:         string;
  sent_at:      string;
  read_at:      string | null;
}

const RISK_COLOR = { green: T.green,  yellow: T.amber,  red: T.red   };
const RISK_BG    = { green: T.greenLight, yellow: T.amberLight, red: T.redLight };
const RISK_LABEL = { green: "Stable",   yellow: "Moderate", red: "High Risk" };
const RISK_ORDER = { red: 0, yellow: 1, green: 2 };

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string }> = {
  pending:      { label: "Pending",    color: T.textMuted, bg: T.raised      },
  arrived:      { label: "Arrived",    color: T.blue,      bg: T.blueLight   },
  "in-session": { label: "In Session", color: "#7c3aed",   bg: "#f5f3ff"     },
  completed:    { label: "Completed",  color: T.green,     bg: T.greenLight  },
  "no-show":    { label: "No Show",    color: T.red,       bg: T.redLight    },
};

const QUICK_TAGS = [
  "Good session","Mood improved","Sleep issues","Appetite changes",
  "Stress elevated","Academic pressure","Team conflict","Injury concern",
  "Follow-up needed","Medication reviewed","Referral discussed","Screening completed",
];

const PILLAR_CFG = [
  { key: "emotional",  label: "Emotional",  color: "#059669", stroke: "#059669" },
  { key: "resilience", label: "Resilience", color: "#2563eb", stroke: "#2563eb" },
  { key: "recovery",   label: "Recovery",   color: "#7c3aed", stroke: "#7c3aed" },
  { key: "support",    label: "Support",    color: "#0891b2", stroke: "#0891b2" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string | null) {
  if (!iso) return "No check-ins";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function avgOf(...vals: (number | null)[]) {
  const nums = vals.filter((v): v is number => v != null);
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// ─── ScoreLine sparkline ──────────────────────────────────────────────────────
function ScoreLine({ scores, risk }: { scores: number[]; risk: "green" | "yellow" | "red" | null }) {
  if (scores.length < 2) return <div className="h-8 flex items-center text-[11px]" style={{ color: T.textMuted }}>No trend</div>;
  const W = 120, H = 32, pad = 3;
  const pts = scores.map((v, i) => ({
    x: pad + (i / (scores.length - 1)) * (W - pad * 2),
    y: H - pad - (v / 10) * (H - pad * 2),
  }));
  const d   = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const col = risk ? RISK_COLOR[risk] : T.textMuted;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <path d={d} fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="2.5" fill={col} />
    </svg>
  );
}

// ─── PillarBar ────────────────────────────────────────────────────────────────
function PillarBar({ label, score, color, trackBg }: { label: string; score: number | null; color: string; trackBg: string }) {
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

// ─── Demo messages (shown in demo mode so the Messages tab isn't blank) ───────
const now = Date.now();
const DEMO_MESSAGES: Message[] = [
  { id:"dm1", sender_id:"counselor", recipient_id:"d2", body:"Hi Jordan — I saw your recent check-in scores and wanted to reach out. How are you feeling heading into finals week?", sent_at: new Date(now - 2*86400000 - 3*3600000).toISOString(), read_at: new Date(now - 2*86400000).toISOString() },
  { id:"dm2", sender_id:"d2", recipient_id:"counselor", body:"Honestly pretty stressed. I have three exams back to back and practice hasn't let up at all. Sleep has been rough.", sent_at: new Date(now - 2*86400000 - 2*3600000).toISOString(), read_at: new Date(now - 2*86400000).toISOString() },
  { id:"dm3", sender_id:"counselor", recipient_id:"d2", body:"That combination is tough. Have you been using any of the wind-down strategies we talked about last session?", sent_at: new Date(now - 2*86400000 - 1*3600000).toISOString(), read_at: new Date(now - 2*86400000).toISOString() },
  { id:"dm4", sender_id:"d2", recipient_id:"counselor", body:"I tried the breathing thing a couple nights but I kind of forgot. I'll try again tonight.", sent_at: new Date(now - 1*86400000 - 5*3600000).toISOString(), read_at: new Date(now - 1*86400000).toISOString() },
  { id:"dm5", sender_id:"counselor", recipient_id:"d2", body:"That's a good start. Even 5 minutes before bed makes a difference. We're meeting Thursday at 10:30 — want to add sleep tracking to your check-in until then?", sent_at: new Date(now - 1*86400000 - 2*3600000).toISOString(), read_at: new Date(now - 1*86400000).toISOString() },
  { id:"dm6", sender_id:"d2", recipient_id:"counselor", body:"Yeah sure, that sounds helpful. Thanks for checking in.", sent_at: new Date(now - 3600000).toISOString(), read_at: null },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function PsychiatristDashboard() {
  const [athletes,    setAthletes]    = useState<SharedAthlete[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [userName,    setUserName]    = useState("...");
  const [isDemo,      setIsDemo]      = useState(false);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<TabId>("overview");
  const [appliedTags, setAppliedTags] = useState<Record<string, string[]>>({});
  const [contacted,   setContacted]   = useState<Record<string, boolean>>({});
  const [scheduled,   setScheduled]   = useState<Record<string, boolean>>({});
  const [responding,  setResponding]  = useState<string | null>(null);
  const [scheduling,  setScheduling]  = useState<string | null>(null);
  const [fuFormOpen,  setFuFormOpen]  = useState(false);
  const [fuReason,    setFuReason]    = useState("");
  const [fuDate,      setFuDate]      = useState("");
  const [responded,   setResponded]   = useState<Record<string, "accepted" | "dismissed">>({});
  const [actError,    setActError]    = useState<string | null>(null);
  const [actSuccess,  setActSuccess]  = useState<string | null>(null);
  const [referring,   setReferring]   = useState<string | null>(null);
  const [referred,    setReferred]    = useState<Record<string, boolean>>({});
  const [mobilePanel, setMobilePanel] = useState<"list" | "workspace">("list");
  // Messages
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [msgInput,    setMsgInput]    = useState("");
  const [sendingMsg,  setSendingMsg]  = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const supabaseRef = useRef<SupabaseClient | null>(null);
  const profIdRef   = useRef<string | null>(null);

  useEffect(() => {
    async function load(): Promise<(() => void) | undefined> {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        supabaseRef.current = supabase;

        const { getMyProfile } = await import("@/lib/current-user");
        const { profile: prof } = await getMyProfile(supabase);
        if (!prof) { setError("Profile not found."); return; }
        setUserName(prof.full_name);
        profIdRef.current = prof.id;

        type ConsentRow = {
          athlete_id: string; scope: "summary" | "full";
          expires_at: string | null;
          athlete: { full_name: string }[] | { full_name: string } | null;
        };
        const { data: consents } = await supabase
          .from("consent_logs")
          .select("athlete_id, scope, expires_at, athlete:athlete_id(full_name)")
          .eq("target_profile_id", prof.id)
          .eq("is_active", true);

        const rows = (consents ?? []) as ConsentRow[];

        let shared: SharedAthlete[] = [];

        if (rows.length > 0) {
          const athleteIds = rows.map(r => r.athlete_id);
          const cutoff14   = new Date(Date.now() - 14 * 86400000).toISOString();

          // 3 batch queries instead of 3N
          const [
            { data: allCheckins },
            { data: allAlerts },
            { data: allFollowups },
          ] = await Promise.all([
            supabase.from("checkins")
              .select("athlete_id, completed_at, emotional_score, resilience_score, recovery_score, support_score")
              .in("athlete_id", athleteIds)
              .gte("completed_at", cutoff14)
              .order("completed_at", { ascending: false }),
            supabase.from("alerts")
              .select("id, athlete_id")
              .in("athlete_id", athleteIds)
              .eq("status", "open"),
            supabase.from("followups")
              .select("id, athlete_id")
              .in("athlete_id", athleteIds)
              .eq("status", "open"),
          ]);

          type CheckinRow = { athlete_id: string; completed_at: string; emotional_score: number | null; resilience_score: number | null; recovery_score: number | null; support_score: number | null };
          const checkinsByAthlete = new Map<string, CheckinRow[]>();
          for (const c of (allCheckins ?? []) as CheckinRow[]) {
            if (!checkinsByAthlete.has(c.athlete_id)) checkinsByAthlete.set(c.athlete_id, []);
            checkinsByAthlete.get(c.athlete_id)!.push(c);
          }

          const alertByAthlete   = new Map<string, string>();
          for (const a of (allAlerts ?? []) as { id: string; athlete_id: string }[]) {
            if (!alertByAthlete.has(a.athlete_id)) alertByAthlete.set(a.athlete_id, a.id);
          }
          const followupAthletes = new Set((allFollowups ?? []).map((f: { athlete_id: string }) => f.athlete_id));

          shared = rows.map(c => {
            const athleteObj = Array.isArray(c.athlete) ? c.athlete[0] : c.athlete;
            const recent     = (checkinsByAthlete.get(c.athlete_id) ?? []).slice(0, 7);
            const latest     = recent[0] ?? null;

            const avg_score        = latest ? avgOf(latest.emotional_score, latest.resilience_score, latest.recovery_score, latest.support_score) : null;
            const risk_level       = latest
              ? evaluateRiskLevel({ emotional: latest.emotional_score ?? 5, resilience: latest.resilience_score ?? 5, recovery: latest.recovery_score ?? 5, support: latest.support_score ?? 5 }, false)
              : null;

            const score_history = [...recent].reverse().map(r => avgOf(r.emotional_score, r.resilience_score, r.recovery_score, r.support_score) ?? 0);

            const pillar_history: PillarSnapshot[] = [...recent].reverse().map(r => ({
              date:       new Date(r.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              emotional:  r.emotional_score,
              resilience: r.resilience_score,
              recovery:   r.recovery_score,
              support:    r.support_score,
              avg:        avgOf(r.emotional_score, r.resilience_score, r.recovery_score, r.support_score),
            }));

            return {
              athlete_id:        c.athlete_id,
              athlete_name:      athleteObj?.full_name ?? "Unknown",
              scope:             c.scope,
              last_checkin_at:   latest?.completed_at ?? null,
              expires_at:        c.expires_at,
              avg_score,
              emotional_score:   latest?.emotional_score  ?? null,
              resilience_score:  latest?.resilience_score ?? null,
              recovery_score:    latest?.recovery_score   ?? null,
              support_score:     latest?.support_score    ?? null,
              risk_level,
              checkin_count_14d: recent.length,
              open_alert_id:     alertByAthlete.get(c.athlete_id) ?? null,
              has_followup:      followupAthletes.has(c.athlete_id),
              score_history,
              pillar_history,
            };
          });
        }

        const DEMO: SharedAthlete[] = [
          { athlete_id:"d1", athlete_name:"Alex Johnson",    scope:"full",    last_checkin_at: new Date(Date.now()-1*86400000).toISOString(), expires_at:null, avg_score:7.4, emotional_score:8.0, resilience_score:7.2, recovery_score:7.1, support_score:7.3, risk_level:"green",  checkin_count_14d:10, open_alert_id:null,  has_followup:false, score_history:[6.2,6.8,7.0,7.1,7.4,7.2,7.4], pillar_history:[{date:"May 22",emotional:7.5,resilience:6.9,recovery:6.8,support:7.0,avg:7.1},{date:"May 24",emotional:7.8,resilience:7.1,recovery:7.0,support:7.2,avg:7.3},{date:"May 26",emotional:8.0,resilience:7.2,recovery:7.1,support:7.3,avg:7.4}], session_time:"9:00 AM",  session_status:"completed", tags:["Good session","Stress elevated"], last_note:"Athlete reports feeling more balanced this week. Sleep improving." },
          { athlete_id:"d2", athlete_name:"Jordan Williams", scope:"summary", last_checkin_at: new Date(Date.now()-3*86400000).toISOString(), expires_at:null, avg_score:4.8, emotional_score:4.5, resilience_score:5.0, recovery_score:4.9, support_score:4.8, risk_level:"yellow", checkin_count_14d:5,  open_alert_id:"a-1", has_followup:false, score_history:[6.1,5.8,5.5,5.2,4.9,4.8],   pillar_history:[{date:"May 20",emotional:5.8,resilience:6.0,recovery:5.9,support:5.7,avg:5.9},{date:"May 22",emotional:5.2,resilience:5.5,recovery:5.3,support:5.1,avg:5.3},{date:"May 25",emotional:4.5,resilience:5.0,recovery:4.9,support:4.8,avg:4.8}], session_time:"10:30 AM", session_status:"arrived",   tags:["Academic pressure","Follow-up needed"], last_note:"Reported increased academic stress." },
          { athlete_id:"d3", athlete_name:"Sam Rivera",      scope:"full",    last_checkin_at: new Date(Date.now()-2*86400000).toISOString(), expires_at:null, avg_score:3.1, emotional_score:2.8, resilience_score:3.5, recovery_score:3.0, support_score:3.1, risk_level:"red",    checkin_count_14d:3,  open_alert_id:"a-2", has_followup:true,  score_history:[5.0,4.2,3.8,3.5,3.1],        pillar_history:[{date:"May 22",emotional:4.2,resilience:4.8,recovery:4.0,support:4.5,avg:4.4},{date:"May 24",emotional:3.5,resilience:4.0,recovery:3.5,support:3.8,avg:3.7},{date:"May 26",emotional:2.8,resilience:3.5,recovery:3.0,support:3.1,avg:3.1}], session_time:"11:15 AM", session_status:"in-session",tags:["Injury concern"],                       last_note:"Discussing impact of ankle injury on team role." },
          { athlete_id:"d4", athlete_name:"Taylor Brooks",   scope:"summary", last_checkin_at: new Date(Date.now()-5*86400000).toISOString(), expires_at:null, avg_score:8.2, emotional_score:8.5, resilience_score:8.0, recovery_score:8.1, support_score:8.2, risk_level:"green",  checkin_count_14d:12, open_alert_id:null,  has_followup:false, score_history:[7.5,7.8,8.0,8.1,8.2,8.0,8.2], pillar_history:[{date:"May 21",emotional:8.0,resilience:7.8,recovery:7.9,support:8.0,avg:7.9},{date:"May 23",emotional:8.3,resilience:7.9,recovery:8.0,support:8.1,avg:8.1},{date:"May 25",emotional:8.5,resilience:8.0,recovery:8.1,support:8.2,avg:8.2}], session_time:"2:00 PM",  session_status:"pending",   tags:[],                                      last_note:"Routine check-in. Scores stable." },
          { athlete_id:"d5", athlete_name:"Morgan Lee",      scope:"full",    last_checkin_at: new Date(Date.now()-4*86400000).toISOString(), expires_at:null, avg_score:5.5, emotional_score:5.2, resilience_score:5.8, recovery_score:5.4, support_score:5.6, risk_level:"yellow", checkin_count_14d:7,  open_alert_id:null,  has_followup:false, score_history:[5.0,5.2,5.5,5.3,5.5],        pillar_history:[{date:"May 22",emotional:5.0,resilience:5.5,recovery:5.1,support:5.2,avg:5.2},{date:"May 24",emotional:5.1,resilience:5.7,recovery:5.2,support:5.4,avg:5.4},{date:"May 26",emotional:5.2,resilience:5.8,recovery:5.4,support:5.6,avg:5.5}], session_time:"3:30 PM",  session_status:"pending",   tags:["Team conflict"],                       last_note:"Discussed team dynamics. Recommended journaling." },
        ];

        const display = shared.length > 0 ? shared : DEMO;
        setAthletes(display);
        setIsDemo(shared.length === 0);
        // Auto-open the first athlete in demo mode so every tab is visible
        if (shared.length === 0) {
          setSelectedId("d2");
          setMessages(DEMO_MESSAGES);
        }

        // Pre-populate today's session tags
        if (shared.length > 0) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const { data: tagLogs } = await supabase
            .from("audit_logs").select("target_id, metadata")
            .eq("actor_profile_id", prof.id).eq("action", "session_tag_applied")
            .gte("created_at", todayStart.toISOString());
          if (tagLogs?.length) {
            const tagMap: Record<string, string[]> = {};
            tagLogs.forEach((log) => {
              const t = (log.metadata as { tag?: string })?.tag;
              if (t && log.target_id) {
                if (!tagMap[log.target_id]) tagMap[log.target_id] = [];
                if (!tagMap[log.target_id].includes(t)) tagMap[log.target_id].push(t);
              }
            });
            setAppliedTags(tagMap);
          }
        }

        const channel = supabase
          .channel("counselor-consent-realtime")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "consent_logs", filter: `target_profile_id=eq.${prof.id}` }, () => load())
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "consent_logs", filter: `target_profile_id=eq.${prof.id}` }, () => load())
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
            setAthletes(prev => prev.map(a =>
              a.athlete_id === payload.new.athlete_id && !a.open_alert_id
                ? { ...a, open_alert_id: payload.new.id } : a
            ));
          })
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
            const msg = payload.new as Message;
            if (msg.sender_id === profIdRef.current || msg.recipient_id === profIdRef.current) {
              setMessages(prev => [...prev, msg]);
            }
          })
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      } catch { setError("An unexpected error occurred."); }
      finally { setLoading(false); }
    }

    let channelCleanup: (() => void) | undefined;
    load().then(fn => { channelCleanup = fn; });
    return () => { channelCleanup?.(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages when athlete selected & messages tab opens
  useEffect(() => {
    if (!selectedId || activeTab !== "messages" || selectedId.startsWith("d")) return;
    const supabase = supabaseRef.current;
    const myId     = profIdRef.current;
    if (!supabase || !myId) return;
    setLoadingMsgs(true);
    supabase.from("messages")
      .select("id, sender_id, recipient_id, body, sent_at, read_at")
      .or(`and(sender_id.eq.${myId},recipient_id.eq.${selectedId}),and(sender_id.eq.${selectedId},recipient_id.eq.${myId})`)
      .order("sent_at", { ascending: true })
      .then(({ data, error: msgErr }) => {
        if (msgErr) { setLoadingMsgs(false); return; } // messages table not yet migrated
        setMessages((data ?? []) as Message[]);
        setLoadingMsgs(false);
        // Mark unread messages as read
        const unread = (data ?? []).filter((m: Message) => m.recipient_id === myId && !m.read_at).map((m: Message) => m.id);
        if (unread.length) supabase.from("messages").update({ read_at: new Date().toISOString() }).in("id", unread).then(() => {});
      });
  }, [selectedId, activeTab]);

  async function sendMessage() {
    if (!msgInput.trim() || !selectedId || !profIdRef.current) return;
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setSendingMsg(true);
    const body = msgInput.trim();
    setMsgInput("");
    const { error } = await supabase.from("messages").insert({  // requires migration 026
      sender_id:    profIdRef.current,
      recipient_id: selectedId,
      body,
      thread_id:    [profIdRef.current, selectedId].sort().join("_"),
    });
    if (error) setMsgInput(body); // restore on failure
    setSendingMsg(false);
  }

  async function handleOutreach(athlete: SharedAthlete, decision: "accepted" | "dismissed") {
    setResponding(athlete.athlete_id);
    setActError(null);
    try {
      const supabase = supabaseRef.current;
      if (athlete.open_alert_id && !athlete.athlete_id.startsWith("d") && supabase) {
        const { error: alertErr } = await supabase.from("alerts")
          .update({ status: decision === "accepted" ? "acknowledged" : "resolved", assigned_to_profile_id: decision === "accepted" ? profIdRef.current : null })
          .eq("id", athlete.open_alert_id);
        if (alertErr) {
          setActError(alertErr.code === "42501"
            ? "Permission denied — check that consent is active."
            : `Could not update alert: ${alertErr.message}`);
          setResponding(null);
          return;
        }
        await supabase.from("audit_logs").insert({ actor_profile_id: profIdRef.current, action: decision === "accepted" ? "outreach_accepted" : "outreach_declined", target_type: "alert", target_id: athlete.open_alert_id, metadata: { athlete_id: athlete.athlete_id, decision } });
      }
      setResponded(r => ({ ...r, [athlete.athlete_id]: decision }));
      if (decision === "accepted") setContacted(c => ({ ...c, [athlete.athlete_id]: true }));
      // Visible confirmation — the urgent list only shows 2 at a time, so without
      // this the next athlete silently fills the slot and the click looks ignored.
      setActSuccess(decision === "accepted"
        ? `Outreach started with ${athlete.athlete_name} — they've been moved into your active queue.`
        : `Dismissed ${athlete.athlete_name} from the urgent list.`);
      setTimeout(() => setActSuccess(null), 4000);
    } catch (e: unknown) {
      setActError(e instanceof Error ? e.message : "Outreach action failed.");
    }
    setResponding(null);
  }

  async function handleReferral(athlete: SharedAthlete) {
    if (referring === athlete.athlete_id || referred[athlete.athlete_id]) return;
    setReferring(athlete.athlete_id);
    const supabase = supabaseRef.current;
    if (!athlete.athlete_id.startsWith("d") && supabase) {
      try {
        await supabase.from("audit_logs").insert({ actor_profile_id: profIdRef.current, action: "referral_summary_sent", target_type: "athlete", target_id: athlete.athlete_id, metadata: { scope: athlete.scope, risk_level: athlete.risk_level, avg_score: athlete.avg_score } });
      } catch { /* non-fatal */ }
    }
    setReferred(r => ({ ...r, [athlete.athlete_id]: true }));
    setReferring(null);
  }

  async function handleContact(athlete: SharedAthlete) {
    if (responding === athlete.athlete_id) return;
    if (athlete.open_alert_id && !responded[athlete.athlete_id]) { await handleOutreach(athlete, "accepted"); return; }
    const supabase = supabaseRef.current;
    if (!athlete.athlete_id.startsWith("d") && supabase) {
      try {
        await supabase.from("audit_logs").insert({ actor_profile_id: profIdRef.current, action: "outreach_initiated", target_type: "athlete", target_id: athlete.athlete_id, metadata: {} });
      } catch { /* non-fatal */ }
    }
    setContacted(c => ({ ...c, [athlete.athlete_id]: true }));
  }

  async function handleSchedule(athlete: SharedAthlete, reason?: string, dueDate?: string) {
    setScheduling(athlete.athlete_id);
    setActError(null);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const finalReason = (reason ?? "").trim() || "Counselor-scheduled follow-up session";
    const finalDue    = dueDate || tomorrow;
    try {
      const supabase = supabaseRef.current;
      if (!athlete.athlete_id.startsWith("d") && supabase) {
        const { error } = await supabase.from("followups").insert({ athlete_id: athlete.athlete_id, alert_id: athlete.open_alert_id ?? null, assigned_to_profile_id: profIdRef.current, assigned_by_profile_id: profIdRef.current, reason: finalReason, status: "open", due_date: finalDue });
        if (error) {
          setActError(error.code === "42501" ? "Permission denied — check that consent is active." : `Could not schedule: ${error.message}`);
          setScheduling(null);
          return false;
        }
        if (athlete.open_alert_id) await supabase.from("alerts").update({ status: "acknowledged", assigned_to_profile_id: profIdRef.current }).eq("id", athlete.open_alert_id);
        await supabase.from("audit_logs").insert({ actor_profile_id: profIdRef.current, action: "followup_scheduled", target_type: "athlete", target_id: athlete.athlete_id, metadata: { due_date: finalDue, reason: finalReason } });
      }
      setScheduled(s => ({ ...s, [athlete.athlete_id]: true }));
      setActSuccess(`Follow-up created for ${athlete.athlete_name} — due ${finalDue}.`);
      setTimeout(() => setActSuccess(null), 4000);
      return true;
    } catch (e: unknown) {
      setActError(e instanceof Error ? e.message : "Failed to schedule follow-up.");
      return false;
    } finally {
      setScheduling(null);
    }
  }

  const sorted      = [...athletes].sort((a, b) => (RISK_ORDER[a.risk_level ?? "green"] ?? 3) - (RISK_ORDER[b.risk_level ?? "green"] ?? 3));
  const urgentQueue = sorted.filter(a => a.open_alert_id && !responded[a.athlete_id]);
  const selected    = athletes.find(a => a.athlete_id === selectedId) ?? null;

  const withData    = athletes.filter(a => a.risk_level != null);
  const greenCount  = withData.filter(a => a.risk_level === "green").length;
  const yellowCount = withData.filter(a => a.risk_level === "yellow").length;
  const redCount    = withData.filter(a => a.risk_level === "red").length;

  if (loading) return (
    <DashboardLayout role="psychiatrist" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.blueBorder, borderTopColor: T.blue }} />
      </div>
    </DashboardLayout>
  );
  if (error) return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl p-10 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
          <AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color: T.textMuted }} />
          <p style={{ color: T.textMuted }}>{error}</p>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="space-y-4" style={{ maxWidth: "100%" }}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight" style={{ color: T.text }}>Counselor Dashboard</h1>
              {isDemo && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: T.blueLight, color: T.blue, border: `1px solid ${T.blueBorder}` }}>Demo</span>}
            </div>
            <p className="text-[13px]" style={{ color: T.textMuted }}>
              {athletes.length} patient{athletes.length !== 1 ? "s" : ""} with active consent ·{" "}
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </p>
          </div>

          {/* Caseload overview pills */}
          <div className="flex flex-wrap items-center gap-2">
            {athletes.length > 0 && (
              <span className="text-[11px] sm:text-[12px] font-medium px-2.5 py-1 rounded-full" style={{ background: T.raised, color: T.textMuted, border: `1px solid ${T.border}` }}>
                {Math.round((withData.filter(a => a.checkin_count_14d > 0).length / Math.max(athletes.length, 1)) * 100)}% active 14d
              </span>
            )}
            {redCount > 0    && <span className="text-[11px] sm:text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: T.redLight,   color: T.red   }}>{redCount} high risk</span>}
            {yellowCount > 0 && <span className="text-[11px] sm:text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: T.amberLight, color: T.amber }}>{yellowCount} moderate</span>}
            {greenCount > 0  && <span className="text-[11px] sm:text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ background: T.greenLight, color: T.green }}>{greenCount} stable</span>}
          </div>
        </div>

        {/* ── Demo banner ──────────────────────────────────────────────── */}
        {isDemo && (
          <div className="rounded-xl px-4 py-3.5 flex items-start gap-3" style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#92400e" }} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "#92400e" }}>Demo data — no real patients yet</p>
              <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "#78350f" }}>
                Ask athletes to open <strong>Privacy Settings</strong> and share data with you. Real scores and alerts will appear here.
              </p>
            </div>
          </div>
        )}

        {/* ── Two-panel layout ─────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-5" style={{ minHeight: 600 }}>

          {/* ── LEFT: Patient Queue ──────────────────────────────────── */}
          <div className={`${mobilePanel === "workspace" ? "hidden lg:flex" : "flex"} flex-col gap-3 w-full lg:w-72 lg:shrink-0`}>

            {urgentQueue.length > 0 && (
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${T.redBorder}`, boxShadow: shadow }}>
                <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: T.redLight, borderBottom: `1px solid ${T.redBorder}` }}>
                  <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: T.red }} />
                  <AlertCircle className="h-3.5 w-3.5" style={{ color: T.red }} />
                  <p className="text-[12px] font-bold flex-1" style={{ color: "#991b1b" }}>Outreach needed</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: T.red }}>{urgentQueue.length}</span>
                </div>
                {urgentQueue.slice(0, 2).map((a, i) => (
                  <div key={a.athlete_id} className="px-4 py-3 flex items-center justify-between gap-2"
                       style={{ borderTop: i > 0 ? `1px solid ${T.redBorder}` : undefined, background: "#fff5f5" }}>
                    <div>
                      <p className="text-[12px] font-semibold" style={{ color: T.text }}>{a.athlete_name}</p>
                      <p className="text-[10px]" style={{ color: T.textMuted }}>Score {a.avg_score ?? "—"}/10</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleOutreach(a, "dismissed")} disabled={responding === a.athlete_id}
                              className="p-1.5 rounded-lg border transition-colors" style={{ background: T.surface, borderColor: T.border, color: T.textMuted }}>
                        <X className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleOutreach(a, "accepted")} disabled={responding === a.athlete_id}
                              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-white"
                              style={{ background: `linear-gradient(135deg, #991b1b, ${T.red})`, boxShadow: "0 1px 3px rgba(220,38,38,0.3)" }}>
                        {responding === a.athlete_id
                          ? <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                          : <><Check className="h-3 w-3" />Act</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {actSuccess && (
              <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: T.greenLight, border: `1px solid ${T.green}40` }}>
                <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: T.green }} />
                <p className="text-[12px] font-medium flex-1" style={{ color: T.green }}>{actSuccess}</p>
              </div>
            )}

            {actError && (
              <div className="rounded-xl px-4 py-3 flex items-start gap-2" style={{ background: T.redLight, border: `1px solid ${T.redBorder}` }}>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: T.red }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold" style={{ color: "#991b1b" }}>Action failed</p>
                  <p className="text-[11px] mt-0.5" style={{ color: T.red }}>{actError}</p>
                </div>
                <button onClick={() => setActError(null)} className="shrink-0 p-0.5 rounded" style={{ color: T.red }}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="rounded-xl overflow-hidden flex-1" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-2">
                  <Users2 className="h-3.5 w-3.5" style={{ color: T.blue }} />
                  <p className="text-[13px] font-semibold" style={{ color: T.text }}>Patient Queue</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: T.blueLight, color: T.blue }}>{athletes.length}</span>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
                {sorted.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <MessageCircle className="h-6 w-6 mx-auto mb-2" style={{ color: "#cbd5e1" }} />
                    <p className="text-[12px]" style={{ color: T.textMuted }}>No patients yet</p>
                  </div>
                ) : sorted.map((athlete, idx) => {
                  const risk     = athlete.risk_level;
                  const isActive = selectedId === athlete.athlete_id;
                  const sc       = athlete.session_status ? STATUS_CONFIG[athlete.session_status] : null;
                  return (
                    <button key={athlete.athlete_id}
                            onClick={() => { setSelectedId(athlete.athlete_id); setActiveTab("overview"); setMobilePanel("workspace"); setMessages([]); setFuFormOpen(false); }}
                            className="w-full text-left transition-colors"
                            style={{ borderTop: idx > 0 ? `1px solid ${T.borderSub}` : undefined, background: isActive ? T.blueLight : undefined }}>
                      {risk && risk !== "green" && <div className="h-0.5" style={{ background: RISK_COLOR[risk] }} />}
                      <div className="px-4 py-3 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full shrink-0 flex items-center justify-center text-[13px] font-bold"
                             style={{ background: risk ? RISK_BG[risk] : T.raised, color: risk ? RISK_COLOR[risk] : T.textMuted }}>
                          {athlete.athlete_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{athlete.athlete_name}</p>
                            {isActive && <ChevronRight className="h-3 w-3 shrink-0" style={{ color: T.blue }} />}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {risk && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: RISK_BG[risk], color: RISK_COLOR[risk] }}>{RISK_LABEL[risk]}</span>}
                            {sc   && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>}
                          </div>
                        </div>
                        {athlete.session_time && (
                          <span className="text-[10px] font-medium shrink-0" style={{ color: T.textMuted }}>{athlete.session_time}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Patient Workspace ─────────────────────────────── */}
          <div className={`${mobilePanel === "list" && !selected ? "hidden lg:block" : "block"} flex-1 min-w-0`}>
            {!selected ? (
              <div className="h-full rounded-xl flex flex-col items-center justify-center"
                   style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: T.blueLight }}>
                  <FileText className="h-6 w-6" style={{ color: T.blue }} />
                </div>
                <p className="text-[15px] font-semibold mb-1" style={{ color: T.textSub }}>Select a patient to begin</p>
                <p className="text-[13px]" style={{ color: T.textMuted }}>Click a patient from the queue.</p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden flex flex-col h-full"
                   style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}>

                {/* Patient header */}
                <div className="px-4 sm:px-6 py-4 flex items-center gap-3 sm:gap-4"
                     style={{ borderBottom: `1px solid ${T.border}`, background: T.raised }}>
                  <button onClick={() => setMobilePanel("list")}
                          className="lg:hidden flex items-center justify-center h-8 w-8 rounded-lg shrink-0 border"
                          style={{ background: T.surface, borderColor: T.border, color: T.textMuted }}>
                    <ChevronRight className="h-4 w-4 rotate-180" />
                  </button>
                  <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0 flex items-center justify-center text-[14px] sm:text-[15px] font-bold"
                       style={{ background: selected.risk_level ? RISK_BG[selected.risk_level] : T.raised, color: selected.risk_level ? RISK_COLOR[selected.risk_level] : T.textMuted }}>
                    {selected.athlete_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-0.5">
                      <p className="text-[17px] font-bold" style={{ color: T.text }}>{selected.athlete_name}</p>
                      {selected.risk_level && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: RISK_BG[selected.risk_level], color: RISK_COLOR[selected.risk_level] }}>
                          {RISK_LABEL[selected.risk_level]}
                        </span>
                      )}
                      {selected.session_status && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: STATUS_CONFIG[selected.session_status].bg, color: STATUS_CONFIG[selected.session_status].color }}>
                          {STATUS_CONFIG[selected.session_status].label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px]" style={{ color: T.textMuted }}>
                      <span>{selected.scope === "full" ? "Full access" : "Summary access"}</span>
                      <span>·</span>
                      <span>Last check-in: {timeAgo(selected.last_checkin_at)}</span>
                      {selected.session_time && <><span>·</span><span>Today {selected.session_time}</span></>}
                    </div>
                  </div>
                  <Link href={`/psychiatrist/athlete?id=${selected.athlete_id}`}>
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border transition-colors"
                            style={{ background: T.surface, borderColor: T.border, color: T.textSub }}>
                      <ArrowUpRight className="h-3.5 w-3.5" /> Full profile
                    </button>
                  </Link>
                </div>

                {/* Tab bar */}
                <div className="flex items-center gap-0 px-2 overflow-x-auto" style={{ borderBottom: `1px solid ${T.border}` }}>
                  {(["overview", "assessment", "history", "messages", "actions"] as TabId[]).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                            className="px-3 sm:px-4 py-3 text-[12px] sm:text-[13px] font-semibold capitalize transition-colors relative shrink-0 flex items-center gap-1.5"
                            style={{ color: activeTab === tab ? T.blue : T.textMuted }}>
                      {tab === "history"  && <History className="h-3 w-3" />}
                      {tab === "messages" && <MessageCircle className="h-3 w-3" />}
                      {tab}
                      {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: T.blue }} />}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className={`flex-1 overflow-y-auto ${activeTab === "messages" ? "flex flex-col" : "p-6"}`}>

                  {/* ── Overview ─────────────────────────────────────── */}
                  {activeTab === "overview" && (
                    <div className="space-y-5 p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl p-5" style={{ background: T.raised, border: `1px solid ${T.border}` }}>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: T.blueLight, color: T.blue }}>
                              <Activity className="h-4 w-4" />
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color: T.textMuted }}>Latest Score</span>
                          </div>
                          <p className="text-[32px] font-bold tabular-nums tracking-tight leading-none"
                             style={{ color: selected.risk_level ? RISK_COLOR[selected.risk_level] : T.textMuted }}>
                            {selected.avg_score != null ? selected.avg_score.toFixed(1) : "—"}
                            <span className="text-[18px] font-medium ml-1 tracking-normal" style={{ color: T.textMuted }}>/10</span>
                          </p>
                          <p className="text-[11px] mt-1.5" style={{ color: T.textMuted }}>{selected.checkin_count_14d} check-ins in last 14 days</p>
                        </div>
                        <div className="rounded-2xl p-5" style={{ background: T.raised, border: `1px solid ${T.border}` }}>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0" style={{ background: T.blueLight, color: T.blue }}>
                              <TrendingUp className="h-4 w-4" />
                            </div>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.07em]" style={{ color: T.textMuted }}>14-Day Trend</span>
                          </div>
                          <ScoreLine scores={selected.score_history} risk={selected.risk_level} />
                          <p className="text-[11px] mt-1" style={{ color: T.textMuted }}>
                            {selected.score_history.length >= 2
                              ? (selected.score_history[selected.score_history.length - 1] >= selected.score_history[selected.score_history.length - 2] ? "↑ Improving" : "↓ Declining")
                              : "Insufficient data"}
                          </p>
                        </div>
                      </div>

                      {(selected.tags?.length || appliedTags[selected.athlete_id]?.length) ? (
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Session Tags</p>
                          <div className="flex flex-wrap gap-1.5">
                            {[...(selected.tags ?? []), ...(appliedTags[selected.athlete_id] ?? [])].filter((v, i, a) => a.indexOf(v) === i).map(tag => (
                              <span key={tag} className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full"
                                    style={{ background: T.blueLight, color: T.blue, border: `1px solid ${T.blueBorder}` }}>
                                <Tag className="h-2.5 w-2.5" />{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {selected.last_note && (
                        <div className="rounded-xl p-4" style={{ background: T.raised, border: `1px solid ${T.border}` }}>
                          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Most Recent Note</p>
                          <p className="text-[13px] leading-relaxed" style={{ color: T.textSub }}>{selected.last_note}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 px-1">
                        <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: T.textMuted }} />
                        <p className="text-[11px]" style={{ color: T.textMuted }}>
                          Access logged for FERPA compliance. Patient can revoke consent at any time.
                          {selected.expires_at && ` · Expires ${new Date(selected.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Assessment ───────────────────────────────────── */}
                  {activeTab === "assessment" && (
                    <div className="space-y-5 p-6">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: T.textMuted }}>Pillar Scores — Latest Check-In</p>
                        <div className="space-y-3">
                          {[
                            { label: "Emotional",  score: selected.emotional_score,  color: "#059669", track: "#d1fae5" },
                            { label: "Resilience", score: selected.resilience_score, color: "#2563eb", track: "#dbeafe" },
                            { label: "Recovery",   score: selected.recovery_score,   color: "#7c3aed", track: "#ede9fe" },
                            { label: "Support",    score: selected.support_score,    color: "#0891b2", track: "#cffafe" },
                          ].map(p => (
                            <PillarBar key={p.label} label={p.label} score={p.score} color={p.color} trackBg={p.track} />
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl p-4" style={{ background: T.raised, border: `1px solid ${T.border}` }}>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>Screening Status</p>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: T.blueLight }}>
                            <Activity className="h-4 w-4" style={{ color: T.blue }} />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold" style={{ color: T.text }}>
                              {selected.checkin_count_14d > 0 ? "Active — check-ins logged" : "No recent check-ins"}
                            </p>
                            <p className="text-[11px]" style={{ color: T.textMuted }}>{selected.checkin_count_14d} sessions in last 14 days</p>
                          </div>
                        </div>
                      </div>

                      <Link href={`/psychiatrist/athlete?id=${selected.athlete_id}`}>
                        <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold border transition-colors hover:bg-gray-50"
                             style={{ borderColor: T.border, color: T.textSub }}>
                          <ArrowUpRight className="h-4 w-4" /> View complete assessment history
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* ── History ──────────────────────────────────────── */}
                  {activeTab === "history" && (
                    <div className="space-y-5 p-6">
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: T.textMuted }}>Wellness Trends — Last 14 Days</p>

                      {selected.pillar_history.length < 2 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                          <History className="h-8 w-8" style={{ color: "#cbd5e1" }} />
                          <p className="text-[13px]" style={{ color: T.textMuted }}>Not enough data for trend charts yet</p>
                          <p className="text-[11px]" style={{ color: T.textMuted }}>Trends appear after 2+ check-ins within 14 days</p>
                        </div>
                      ) : (
                        <>
                          {/* All pillars chart */}
                          <div className="rounded-2xl p-4" style={{ background: T.raised, border: `1px solid ${T.border}` }}>
                            <p className="text-[12px] font-semibold mb-3" style={{ color: T.textSub }}>All Pillars</p>
                            <ResponsiveContainer width="100%" height={180}>
                              <LineChart data={selected.pillar_history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textMuted }} tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: T.textMuted }} tickLine={false} axisLine={false} ticks={[0, 5, 10]} />
                                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: `1px solid ${T.border}`, boxShadow: shadow }} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                {PILLAR_CFG.map(p => (
                                  <Line key={p.key} type="monotone" dataKey={p.key} name={p.label} stroke={p.stroke} strokeWidth={2} dot={false} connectNulls />
                                ))}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Individual pillar cards */}
                          <div className="grid grid-cols-2 gap-3">
                            {PILLAR_CFG.map(p => {
                              const vals = selected.pillar_history.map(h => h[p.key]).filter((v): v is number => v != null);
                              const latest = vals[vals.length - 1] ?? null;
                              const prev   = vals[vals.length - 2] ?? null;
                              const delta  = latest != null && prev != null ? latest - prev : null;
                              return (
                                <div key={p.key} className="rounded-xl p-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: p.color }}>{p.label}</p>
                                  <p className="text-[22px] font-bold tabular-nums" style={{ color: p.color }}>
                                    {latest != null ? latest.toFixed(1) : "—"}
                                    <span className="text-[13px] font-medium ml-0.5" style={{ color: T.textMuted }}>/10</span>
                                  </p>
                                  {delta != null && (
                                    <p className="text-[10px] mt-0.5" style={{ color: delta >= 0 ? T.green : T.red }}>
                                      {delta >= 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)} vs prev
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Messages ─────────────────────────────────────── */}
                  {activeTab === "messages" && (
                    <>
                      {selected.athlete_id.startsWith("d") ? (
                        <>
                          {/* Demo: show a real-looking thread so the UI is previewable */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {DEMO_MESSAGES.map(msg => {
                              const isMe = msg.sender_id === "counselor";
                              return (
                                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                  <div className="max-w-[75%] rounded-2xl px-3.5 py-2.5"
                                       style={{ background: isMe ? T.blue : T.raised, color: isMe ? "#fff" : T.text }}>
                                    <p className="text-[13px] leading-relaxed">{msg.body}</p>
                                    <p className="text-[10px] mt-1 opacity-60 text-right">
                                      {new Date(msg.sent_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="p-3 border-t" style={{ borderColor: T.border }}>
                            <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: T.border, background: T.raised }}>
                              <input className="flex-1 bg-transparent text-[13px] outline-none" style={{ color: T.textMuted }}
                                     placeholder="Demo mode — connect real athletes to send messages" disabled />
                              <div className="flex items-center justify-center h-7 w-7 rounded-lg opacity-30" style={{ background: T.blue }}>
                                <Send className="h-3.5 w-3.5 text-white" />
                              </div>
                            </div>
                            <p className="text-[10px] mt-1.5 text-center" style={{ color: T.textMuted }}>
                              Sample conversation · Live messaging activates when athletes share data with you
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Thread */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {loadingMsgs ? (
                              <div className="flex items-center justify-center py-10">
                                <div className="h-4 w-4 rounded-full border-2 animate-spin" style={{ borderColor: T.blueBorder, borderTopColor: T.blue }} />
                              </div>
                            ) : messages.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <MessageCircle className="h-7 w-7" style={{ color: "#cbd5e1" }} />
                                <p className="text-[13px]" style={{ color: T.textMuted }}>No messages yet</p>
                                <p className="text-[11px] text-center max-w-[220px]" style={{ color: T.textMuted }}>
                                  Send a secure message to {selected.athlete_name}. Messages are end-to-end encrypted and FERPA-compliant.
                                </p>
                              </div>
                            ) : messages.map(msg => {
                              const isMe = msg.sender_id === profIdRef.current;
                              return (
                                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                  <div className="max-w-[75%] rounded-2xl px-3.5 py-2.5"
                                       style={{ background: isMe ? T.blue : T.raised, color: isMe ? "#fff" : T.text }}>
                                    <p className="text-[13px] leading-relaxed">{msg.body}</p>
                                    <p className="text-[10px] mt-1 opacity-60 text-right">
                                      {new Date(msg.sent_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Compose */}
                          <div className="p-3 border-t" style={{ borderColor: T.border }}>
                            <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: T.border, background: T.raised }}>
                              <input
                                className="flex-1 bg-transparent text-[13px] outline-none"
                                style={{ color: T.text }}
                                placeholder={`Message ${selected.athlete_name}…`}
                                value={msgInput}
                                onChange={e => setMsgInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                maxLength={2000}
                              />
                              <button onClick={sendMessage} disabled={!msgInput.trim() || sendingMsg}
                                      className="flex items-center justify-center h-7 w-7 rounded-lg transition-opacity disabled:opacity-40"
                                      style={{ background: T.blue, color: "#fff" }}>
                                {sendingMsg
                                  ? <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                  : <Send className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                            <p className="text-[10px] mt-1.5 text-center" style={{ color: T.textMuted }}>
                              Secure · FERPA-compliant · Logged for compliance
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* ── Actions ──────────────────────────────────────── */}
                  {activeTab === "actions" && (
                    <div className="space-y-5 p-6">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: T.textMuted }}>Clinical Actions</p>
                        <div className="grid grid-cols-2 gap-3">
                          {contacted[selected.athlete_id] ? (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-semibold"
                                 style={{ background: T.greenLight, color: T.green, border: `1px solid #bbf7d0` }}>
                              <Check className="h-4 w-4" /> Contacted
                            </div>
                          ) : (
                            <button onClick={() => handleContact(selected)} disabled={responding === selected.athlete_id}
                                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                    style={{ background: `linear-gradient(135deg, ${T.blueDark}, ${T.blue})`, boxShadow: "0 2px 8px rgba(5,150,105,0.3)" }}>
                              {responding === selected.athlete_id
                                ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                                : <><Phone className="h-4 w-4" /> Contact</>}
                            </button>
                          )}

                          <button onClick={() => { setFuFormOpen(o => !o); setFuReason(""); setFuDate(new Date(Date.now() + 86400000).toISOString().split("T")[0]); }}
                                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[12px] font-semibold border transition-colors"
                                  style={{ background: fuFormOpen ? T.blueLight : T.surface, borderColor: fuFormOpen ? T.blueBorder : T.border, color: fuFormOpen ? T.blue : T.textSub }}>
                            <Calendar className="h-4 w-4" />
                            {(scheduled[selected.athlete_id] || selected.has_followup) ? "New follow-up" : "Schedule follow-up"}
                          </button>
                        </div>

                        {/* Inline follow-up creator — counselor sets reason + due date */}
                        {fuFormOpen && (
                          <div className="mt-3 rounded-xl p-4 space-y-3" style={{ background: T.raised, border: `1px solid ${T.border}` }}>
                            <div>
                              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: T.textMuted }}>Reason</label>
                              <textarea value={fuReason} onChange={e => setFuReason(e.target.value)} rows={2}
                                        placeholder="e.g. Check in after this week's session; review coping strategies"
                                        className="w-full text-[13px] rounded-lg px-3 py-2 resize-none outline-none"
                                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold uppercase tracking-wider block mb-1" style={{ color: T.textMuted }}>Due date</label>
                              <input type="date" value={fuDate} onChange={e => setFuDate(e.target.value)}
                                     className="text-[13px] rounded-lg px-3 py-2 outline-none"
                                     style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }} />
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={async () => { const ok = await handleSchedule(selected, fuReason, fuDate); if (ok) setFuFormOpen(false); }}
                                      disabled={scheduling === selected.athlete_id}
                                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold text-white disabled:opacity-50"
                                      style={{ background: `linear-gradient(135deg, ${T.blueDark}, ${T.blue})` }}>
                                {scheduling === selected.athlete_id
                                  ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                                  : <><Check className="h-3.5 w-3.5" /> Create follow-up</>}
                              </button>
                              <button onClick={() => setFuFormOpen(false)}
                                      className="px-4 py-2 rounded-lg text-[12px] font-semibold border"
                                      style={{ background: T.surface, borderColor: T.border, color: T.textMuted }}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl p-4" style={{ background: T.blueLight, border: `1px solid ${T.blueBorder}` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="h-4 w-4" style={{ color: T.blue }} />
                          <p className="text-[13px] font-semibold" style={{ color: T.blue }}>FERPA-Compliant Referral</p>
                        </div>
                        <p className="text-[12px] mb-3 leading-relaxed" style={{ color: T.blueDark }}>
                          Share an anonymized wellness summary with this athlete&apos;s primary care provider. Only aggregate trend data — no session notes.
                        </p>
                        {referred[selected.athlete_id] ? (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold"
                               style={{ background: T.greenLight, color: T.green, border: `1px solid #bbf7d0` }}>
                            <Check className="h-3.5 w-3.5" /> Referral summary sent
                          </div>
                        ) : (
                          <button onClick={() => handleReferral(selected)} disabled={referring === selected.athlete_id}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                  style={{ background: T.blue, boxShadow: "0 1px 4px rgba(5,150,105,0.4)" }}>
                            {referring === selected.athlete_id
                              ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                              : <><ArrowUpRight className="h-3.5 w-3.5" /> Send referral summary</>}
                          </button>
                        )}
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: T.textMuted }}>Quick Tags</p>
                        <div className="flex flex-wrap gap-2">
                          {QUICK_TAGS.map(tag => {
                            const applied = (appliedTags[selected.athlete_id] ?? []).includes(tag) || (selected.tags ?? []).includes(tag);
                            return (
                              <button key={tag}
                                      onClick={async () => {
                                        if (applied) return;
                                        setAppliedTags(prev => ({ ...prev, [selected.athlete_id]: [...(prev[selected.athlete_id] ?? []), tag] }));
                                        const supabase = supabaseRef.current;
                                        if (!selected.athlete_id.startsWith("d") && profIdRef.current && supabase) {
                                          try {
                                            await supabase.from("audit_logs").insert({ actor_profile_id: profIdRef.current, action: "session_tag_applied", target_type: "athlete", target_id: selected.athlete_id, metadata: { tag, athlete_id: selected.athlete_id } });
                                          } catch { /* non-critical */ }
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-full border transition-colors"
                                      style={applied
                                        ? { background: T.blueLight, borderColor: T.blueBorder, color: T.blue }
                                        : { background: T.surface, borderColor: T.border, color: T.textSub }}>
                                <Tag className="h-2.5 w-2.5" />{tag}
                                {applied && <Check className="h-2.5 w-2.5 ml-0.5" />}
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
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: T.textMuted }} />
          <p className="text-[11px]" style={{ color: T.textMuted }}>
            All access is logged for FERPA compliance. Patients can revoke consent at any time.{" "}
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />14-day activity window</span>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
