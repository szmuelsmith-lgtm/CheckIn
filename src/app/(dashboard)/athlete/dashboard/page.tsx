"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import type { Pillar } from "@/types/database";
import Link from "next/link";
import {
  ClipboardCheck, TrendingUp, TrendingDown, Minus, Heart, Lock,
  ArrowRight, Zap, Shield, Users, ClipboardList, Phone, MessageSquare,
  CheckCircle, Clock, Anchor, BookOpen, Sparkles, MessageCircle,
} from "lucide-react";

const T = {
  bg:          "#f9fafb",
  surface:     "#ffffff",
  raised:      "#f8fafc",
  border:      "#e5e7eb",
  borderSub:   "#f3f4f6",
  text:        "#111827",
  textSub:     "#374151",
  textMuted:   "#6b7280",
  green:       "#16a34a",
  greenDeep:   "#14532d",
  greenLight:  "#f0fdf4",
  greenBorder: "#bbf7d0",
  amber:       "#d97706",
  amberLight:  "#fefce8",
  amberBorder: "#fde68a",
  red:         "#dc2626",
  redLight:    "#fef2f2",
  redBorder:   "#fecaca",
};

const shadow = "0 1px 3px 0 rgba(0,0,0,0.06),0 1px 2px 0 rgba(0,0,0,0.04)";

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

const PILLAR_META: Record<Pillar, { label: string; icon: React.ReactNode; color: string; trackBg: string; badgeBg: string; resourceCategory: string; resourceTip: string }> = {
  emotional:  { label:"Emotional",  icon:<Heart  className="h-3.5 w-3.5"/>, color:"#16a34a", trackBg:"#dcfce7", badgeBg:"#f0fdf4", resourceCategory:"counseling", resourceTip:"Talking to someone can help when you're feeling down." },
  resilience: { label:"Resilience", icon:<Zap    className="h-3.5 w-3.5"/>, color:"#2563eb", trackBg:"#dbeafe", badgeBg:"#eff6ff", resourceCategory:"wellness",   resourceTip:"Small stress-management habits can rebuild your resilience." },
  recovery:   { label:"Recovery",   icon:<Shield className="h-3.5 w-3.5"/>, color:"#7c3aed", trackBg:"#ede9fe", badgeBg:"#f5f3ff", resourceCategory:"wellness",   resourceTip:"Sleep and rest are foundational. Even small improvements help." },
  support:    { label:"Support",    icon:<Users  className="h-3.5 w-3.5"/>, color:"#0891b2", trackBg:"#cffafe", badgeBg:"#ecfeff", resourceCategory:"counseling", resourceTip:"Feeling connected matters. Reaching out is a sign of strength." },
};

const PILLAR_ONBOARDING: Record<Pillar, string> = {
  emotional:  "How you're feeling day-to-day — mood, anxiety, joy.",
  resilience: "Your ability to handle pressure and bounce back from setbacks.",
  recovery:   "Sleep quality, rest, and physical energy levels.",
  support:    "How connected and supported you feel by those around you.",
};

interface CheckinRow {
  completed_at: string;
  emotional_score: number | null; resilience_score: number | null;
  recovery_score: number | null;  support_score: number | null;
}

interface FollowupRow {
  id: string; status: string; reason: string | null; created_at: string;
}

interface CoachMessage {
  id: string; message: string; created_at: string;
}

interface StatusInfo { message: string; sub: string; dot: string; bg: string; border: string; textCol: string; }

function deriveStatus(scores: Record<Pillar, number | null>, daysSince: number | null): StatusInfo {
  const vals = PILLARS.map(p => scores[p]).filter((v): v is number => v !== null);
  if (!vals.length) return { message:"Welcome to Check-In", sub:"Complete your first check-in to see your wellness snapshot.", dot:T.textMuted, bg:T.raised, border:T.border, textCol:T.textSub };
  if (daysSince !== null && daysSince > 7) return { message:"Time for a check-in", sub:"It's been a while — a quick check-in keeps your trends current.", dot:T.amber, bg:T.amberLight, border:T.amberBorder, textCol:"#92400e" };
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  if (avg >= 7)   return { message:"You're doing well this week",  sub:"Your wellness scores are in a healthy range.",            dot:T.green, bg:T.greenLight, border:T.greenBorder, textCol:T.greenDeep };
  if (avg >= 4.5) return { message:"Some areas need attention",   sub:"A few pillars show signs of stress. Small steps help.",   dot:T.amber, bg:T.amberLight, border:T.amberBorder, textCol:"#92400e" };
  return             { message:"Support is available",            sub:"You may be going through a tough time. You're not alone.", dot:T.red,   bg:T.redLight,   border:T.redBorder,   textCol:"#991b1b" };
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <div className="w-full h-5" />;
  const W = 100, H = 20;
  const min = Math.min(...values), max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const pts = values.map((v, i) => ({
    x: 2 + (i / (values.length - 1)) * (W - 4),
    y: 2 + (1 - (v - min) / range) * (H - 4),
  }));
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i], mx = (p.x + c.x) / 2;
    d += ` C${mx.toFixed(1)},${p.y.toFixed(1)} ${mx.toFixed(1)},${c.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`;
  }
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ overflow:"visible" }}>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
      <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r={2.5} fill={color} />
    </svg>
  );
}

function PillarCard({ pillar, score, history }: { pillar: Pillar; score: number | null; history: number[] }) {
  const m     = PILLAR_META[pillar];
  const pct   = score != null ? Math.min((score / 10) * 100, 100) : 0;
  const col   = score == null ? T.textMuted : score >= 7 ? T.green : score >= 4.5 ? T.amber : T.red;
  const trend = history.length >= 2 ? history[history.length-1] - history[history.length-2] : null;

  const trendColor  = trend == null ? T.textMuted : trend > 0.3 ? T.green : trend < -0.3 ? T.red : T.textMuted;
  const trendBg     = trend == null ? T.raised     : trend > 0.3 ? T.greenLight : trend < -0.3 ? T.redLight : T.raised;
  const trendBorder = trend == null ? T.border     : trend > 0.3 ? T.greenBorder : trend < -0.3 ? T.redBorder : T.border;

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: shadow }}
      role="region"
      aria-label={`${m.label} wellness pillar`}
    >
      {/* Header row: circle icon + label on left, trend chip on right */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: m.badgeBg, color: m.color }}
            aria-hidden
          >
            {m.icon}
          </div>
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.07em] leading-tight truncate"
            style={{ color: T.textMuted }}
          >
            {m.label}
          </span>
        </div>
        {trend != null && (
          <span
            className="inline-flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums shrink-0"
            style={{ color: trendColor, background: trendBg, border: `1px solid ${trendBorder}` }}
            aria-label={`${trend >= 0 ? "+" : ""}${trend.toFixed(1)} vs last check-in`}
          >
            {trend > 0.3  ? <TrendingUp   className="h-3 w-3" aria-hidden /> :
             trend < -0.3 ? <TrendingDown className="h-3 w-3" aria-hidden /> :
                            <Minus        className="h-3 w-3" aria-hidden />}
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}
          </span>
        )}
      </div>

      {/* Score value */}
      <p
        className="text-[32px] font-bold tracking-tight tabular-nums leading-none"
        style={{ color: col }}
      >
        {score != null ? score.toFixed(1) : "—"}
        {score != null && (
          <span className="text-[18px] font-medium ml-1 tracking-normal" style={{ color: T.textMuted }}>/10</span>
        )}
      </p>

      {/* Progress bar */}
      <div className="mt-4" role="presentation">
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: m.trackBg }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%`, background: m.color }}
          />
        </div>
      </div>

      {/* Sparkline */}
      <div className="mt-3">
        <Sparkline values={history} color={m.color} />
      </div>
    </div>
  );
}

// ─── Onboarding overlay ───────────────────────────────────────────────────────
function OnboardingOverlay({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      icon: <Anchor className="h-8 w-8 text-white" strokeWidth={2.5} />,
      iconBg: "linear-gradient(135deg, #065f46, #059669)",
      title: "Welcome to Check-In",
      body: "A private, 2-minute wellness check-in designed for student athletes. It takes less time than a warm-up, and it's completely confidential.",
    },
    {
      icon: <Heart className="h-8 w-8 text-white" />,
      iconBg: "linear-gradient(135deg, #065f46, #16a34a)",
      title: "Four wellness pillars",
      body: null, // rendered as pillar list
    },
    {
      icon: <Lock className="h-8 w-8 text-white" />,
      iconBg: "linear-gradient(135deg, #1e3a5f, #2563eb)",
      title: "Your data is private",
      body: "Your coach never sees your individual scores — only anonymous team averages. Your responses stay between you and the support staff who are there to help.",
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-white" />,
      iconBg: "linear-gradient(135deg, #065f46, #059669)",
      title: "You're in control",
      body: "You choose what to share and with whom. You can request to talk to a psychiatrist any time, right from the check-in. No judgement, no pressure.",
    },
  ];
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden"
           style={{ background: T.surface, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: T.borderSub }}>
          <div className="h-full rounded-full transition-all duration-300"
               style={{ width: `${((step + 1) / steps.length) * 100}%`, background: T.green }} />
        </div>

        <div className="p-6">
          {/* Icon */}
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style={{ background: current.iconBg, boxShadow: "0 4px 16px rgba(5,150,105,0.3)" }}>
            {current.icon}
          </div>

          <h2 className="text-[20px] font-bold text-center mb-3" style={{ color: T.text }}>{current.title}</h2>

          {step === 1 ? (
            <div className="space-y-2.5 mb-5">
              {PILLARS.map(p => (
                <div key={p} className="flex items-start gap-3 rounded-xl p-3"
                     style={{ background: PILLAR_META[p].badgeBg }}>
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                       style={{ background: PILLAR_META[p].color + "20", color: PILLAR_META[p].color }}>
                    {PILLAR_META[p].icon}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: T.text }}>{PILLAR_META[p].label}</p>
                    <p className="text-[12px] mt-0.5" style={{ color: T.textMuted }}>{PILLAR_ONBOARDING[p]}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[14px] leading-relaxed text-center mb-5" style={{ color: T.textSub }}>{current.body}</p>
          )}

          <button
            onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            className="w-full h-12 rounded-2xl font-bold text-[15px] text-white transition-opacity active:opacity-80"
            style={{ background: "linear-gradient(135deg, #065f46, #16a34a)", boxShadow: "0 4px 16px rgba(22,163,74,0.25)" }}
          >
            {isLast ? "Get started" : "Next"}
          </button>

          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
                    className="w-full mt-2 h-10 text-[13px] font-medium rounded-2xl"
                    style={{ color: T.textMuted }}>
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AthleteDashboard() {
  const [userName,      setUserName]      = useState("...");
  const [firstName,     setFirstName]     = useState("Athlete");
  const [profileId,     setProfileId]     = useState<string | null>(null);
  const [history,       setHistory]       = useState<CheckinRow[]>([]);
  const [openFollowup,  setOpenFollowup]  = useState<FollowupRow | null>(null);
  const [coachMessage,  setCoachMessage]  = useState<CoachMessage | null>(null);
  const [onboarded,     setOnboarded]     = useState<boolean>(true); // default true to avoid flash
  const [unreadMsgs,    setUnreadMsgs]    = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, team_id, onboarded")
        .eq("auth_user_id", user.id)
        .single();
      if (!prof) { setLoading(false); return; }
      setUserName(prof.full_name);
      setFirstName(prof.full_name?.split(" ")[0] || "Athlete");
      setProfileId(prof.id);
      setOnboarded(prof.onboarded ?? true);

      // Check-in history
      const { data: recent } = await supabase
        .from("checkins")
        .select("completed_at, emotional_score, resilience_score, recovery_score, support_score")
        .eq("athlete_id", prof.id)
        .order("completed_at", { ascending: false })
        .limit(6);
      if (recent) setHistory([...recent].reverse() as CheckinRow[]);

      // Open follow-up request
      const { data: followupData } = await supabase
        .from("followups")
        .select("id, status, reason, created_at")
        .eq("athlete_id", prof.id)
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(1);
      setOpenFollowup(followupData?.[0] ?? null);

      // Coach team message (if on a team)
      if (prof.team_id) {
        const { data: msgData } = await supabase
          .from("team_messages")
          .select("id, message, created_at")
          .eq("team_id", prof.team_id)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1);
        setCoachMessage(msgData?.[0] ?? null);
      }

      // Unread messages from counselors
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", prof.id)
        .is("read_at", null);
      setUnreadMsgs(count ?? 0);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOnboardingComplete = async () => {
    setOnboarded(true);
    if (profileId) {
      const supabase = createClient();
      await supabase.from("profiles").update({ onboarded: true }).eq("id", profileId);
    }
  };

  const latest = history[history.length - 1] ?? null;
  const pillarScores: Record<Pillar, number | null> = {
    emotional: latest?.emotional_score ?? null, resilience: latest?.resilience_score ?? null,
    recovery:  latest?.recovery_score  ?? null, support:    latest?.support_score    ?? null,
  };
  const pillarHistory: Record<Pillar, number[]> = {
    emotional:  history.map(c => c.emotional_score ).filter((v): v is number => v !== null),
    resilience: history.map(c => c.resilience_score).filter((v): v is number => v !== null),
    recovery:   history.map(c => c.recovery_score  ).filter((v): v is number => v !== null),
    support:    history.map(c => c.support_score   ).filter((v): v is number => v !== null),
  };
  const daysSince    = latest ? Math.floor((Date.now() - new Date(latest.completed_at).getTime()) / 86400000) : null;
  const status       = deriveStatus(pillarScores, daysSince);
  const hasData      = history.length > 0;
  const checkedToday = daysSince === 0;
  const greeting     = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  // Detect critical scores — any pillar < 3
  const hasCriticalScore = latest != null && PILLARS.some(p => {
    const s = pillarScores[p];
    return s !== null && s < 3;
  });

  // Lowest pillar for contextual resources
  const lowestPillar = hasData ? PILLARS.reduce((lowest, p) => {
    const s = pillarScores[p];
    const ls = pillarScores[lowest];
    if (s === null) return lowest;
    if (ls === null) return p;
    return s < ls ? p : lowest;
  }) : null;
  const lowestScore = lowestPillar ? pillarScores[lowestPillar] : null;

  if (loading) return (
    <DashboardLayout role="athlete" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor:T.border, borderTopColor:T.green }} />
      </div>
    </DashboardLayout>
  );

  if (error) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl p-8 text-center" style={{ background:T.surface, border:`1px solid ${T.border}` }}>
          <p className="text-[14px] mb-3" style={{ color:T.textMuted }}>Couldn&apos;t load your dashboard.</p>
          <button onClick={load} className="text-[13px] font-semibold" style={{ color:T.green }}>Retry</button>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="athlete" userName={userName}>
      {/* Onboarding overlay — shown once on first login */}
      {!onboarded && <OnboardingOverlay onComplete={handleOnboardingComplete} />}

      <div className="max-w-lg mx-auto space-y-4">

        {/* Greeting */}
        <div>
          <p className="text-[12px] font-medium mb-0.5" style={{ color:T.textMuted }}>
            {new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
          </p>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color:T.text }}>{greeting}, {firstName}</h1>
        </div>

        {/* Status */}
        <div className="rounded-2xl px-5 py-5" style={{ background:status.bg, border:`1px solid ${status.border}` }}>
          <div className="flex items-start gap-3">
            <div className="h-2.5 w-2.5 rounded-full mt-[5px] shrink-0" style={{ background:status.dot }} />
            <div>
              <p className="text-[16px] font-bold leading-snug" style={{ color:T.text }}>{status.message}</p>
              <p className="text-[13px] mt-1 leading-relaxed" style={{ color:status.textCol }}>{status.sub}</p>
              {daysSince != null && (
                <p className="text-[11px] mt-2 font-medium" style={{ color:T.textMuted }}>
                  {daysSince === 0 ? "Checked in today" : `Last check-in: ${daysSince}d ago`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── CRISIS RESOURCES — shown when any pillar scores critically low ── */}
        {hasCriticalScore && (
          <div className="rounded-2xl overflow-hidden"
               style={{ background:"linear-gradient(135deg, #7f1d1d, #dc2626)", boxShadow:"0 4px 20px rgba(220,38,38,0.2)" }}>
            <div className="px-5 pt-4 pb-1 flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-white shrink-0" />
              <p className="text-[13px] font-bold text-white">Free, confidential support — available right now</p>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 py-3">
              {[
                { number:"988",    label:"Crisis Lifeline", url:"tel:988" },
                { number:"741741", label:"Crisis Text",     url:"sms:741741" },
                { number:"911",    label:"Emergency",       url:"tel:911" },
              ].map(r => (
                <a key={r.number} href={r.url}
                   className="rounded-xl p-3 text-center block active:scale-95 transition-transform"
                   style={{ background:"rgba(255,255,255,0.15)" }}>
                  <p className="text-[18px] font-bold text-white leading-none">{r.number}</p>
                  <p className="text-[10px] mt-1" style={{ color:"rgba(255,255,255,0.75)" }}>{r.label}</p>
                </a>
              ))}
            </div>
            <p className="text-center text-[10px] pb-3" style={{ color:"rgba(255,255,255,0.55)" }}>24/7 · Free · Confidential</p>
          </div>
        )}

        {/* ── FOLLOW-UP STATUS — shown when athlete has an open follow-up ── */}
        {openFollowup && (
          <div className="rounded-2xl px-5 py-4 flex items-start gap-3"
               style={{ background:"#fffbeb", border:"1px solid #fde68a" }}>
            {openFollowup.status === "in_progress"
              ? <Clock className="h-5 w-5 shrink-0 mt-0.5" style={{ color:"#d97706" }} />
              : <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color:"#d97706" }} />}
            <div>
              <p className="text-[14px] font-semibold" style={{ color:"#92400e" }}>
                {openFollowup.status === "in_progress" ? "Someone is working on your follow-up" : "Your request was received"}
              </p>
              <p className="text-[12px] mt-1 leading-relaxed" style={{ color:"#d97706" }}>
                {openFollowup.status === "in_progress"
                  ? "A support person is reaching out to you. You don't need to do anything — they'll contact you directly."
                  : "A support person — not your coach — will be in touch. You're not alone in this."}
              </p>
            </div>
          </div>
        )}

        {/* ── COACH MESSAGE — non-identifying team note from coaching staff ── */}
        {coachMessage && (
          <div className="rounded-2xl px-5 py-4 flex items-start gap-3"
               style={{ background:"#f0fdf4", border:`1px solid ${T.greenBorder}` }}>
            <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" style={{ color:T.green }} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color:T.green }}>From your coaching staff</p>
              <p className="text-[13px] leading-relaxed" style={{ color:T.greenDeep }}>{coachMessage.message}</p>
            </div>
          </div>
        )}

        {/* ── UNREAD MESSAGES — shown when counselor has sent a message ── */}
        {unreadMsgs > 0 && (
          <Link href="/athlete/messages"
                className="rounded-2xl px-5 py-4 flex items-center justify-between group"
                style={{ background:"#eff6ff", border:"1px solid #bfdbfe" }}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background:"#dbeafe" }}>
                <MessageCircle className="h-4 w-4" style={{ color:"#2563eb" }} />
              </div>
              <div>
                <p className="text-[14px] font-semibold" style={{ color:"#1e3a8a" }}>
                  {unreadMsgs === 1 ? "1 new message" : `${unreadMsgs} new messages`} from your counselor
                </p>
                <p className="text-[12px]" style={{ color:"#3b82f6" }}>Tap to read and reply</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" style={{ color:"#3b82f6" }} />
          </Link>
        )}

        {/* CTA */}
        <Link href="/athlete/checkin" className="block rounded-2xl overflow-hidden group"
              style={{ boxShadow:"0 4px 20px rgba(22,163,74,0.18)" }}>
          <div className="px-5 py-4 flex items-center justify-between"
               style={{ background:"linear-gradient(135deg, #14532d 0%, #16a34a 55%, #22c55e 100%)" }}>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background:"rgba(255,255,255,0.15)" }}>
                <ClipboardCheck className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="font-bold text-[16px] text-white">{checkedToday ? "Check in again" : "Weekly Check-In"}</p>
                <p className="text-[12px]" style={{ color:"rgba(255,255,255,0.7)" }}>
                  {checkedToday ? "Track how you feel today" : "2 minutes · Confidential"}
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-white opacity-70 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* Pillar cards */}
        {hasData ? (
          <>
            {/* "What changed?" — biggest mover vs previous check-in */}
            {(() => {
              const movers = PILLARS
                .map(p => {
                  const h = pillarHistory[p];
                  if (h.length < 2) return null;
                  return { pillar: p, delta: h[h.length-1] - h[h.length-2] };
                })
                .filter((m): m is { pillar: Pillar; delta: number } => m !== null)
                .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
              const top = movers[0];
              if (!top || Math.abs(top.delta) < 0.4) return null;
              const meta = PILLAR_META[top.pillar];
              const up   = top.delta > 0;
              return (
                <div className="rounded-2xl px-4 py-3 flex items-center gap-3"
                     style={{ background: up ? T.greenLight : T.amberLight, border:`1px solid ${up ? T.greenBorder : T.amberBorder}` }}>
                  {up
                    ? <TrendingUp  className="h-4 w-4 shrink-0" style={{ color:T.green }}/>
                    : <TrendingDown className="h-4 w-4 shrink-0" style={{ color:T.amber }}/>}
                  <p className="text-[13px] leading-snug" style={{ color: up ? T.greenDeep : "#92400e" }}>
                    <span className="font-semibold">{meta.label}</span> is {up ? "improving" : "lower"} this week
                    {" "}({top.delta > 0 ? "+" : ""}{top.delta.toFixed(1)} vs last check-in)
                  </p>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-3">
              {PILLARS.map(p => <PillarCard key={p} pillar={p} score={pillarScores[p]} history={pillarHistory[p]} />)}
            </div>

            {/* ── CONTEXTUAL RESOURCES — based on lowest pillar ── */}
            {lowestPillar && lowestScore !== null && lowestScore < 6 && (
              <div className="rounded-2xl px-5 py-4"
                   style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color:T.textMuted }}>
                  Resources for you · {PILLAR_META[lowestPillar].label}
                </p>
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                       style={{ background:PILLAR_META[lowestPillar].badgeBg, color:PILLAR_META[lowestPillar].color }}>
                    {PILLAR_META[lowestPillar].icon}
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color:T.textSub }}>
                    {PILLAR_META[lowestPillar].resourceTip}
                  </p>
                </div>
                <Link href="/athlete/resources"
                      className="flex items-center justify-between rounded-xl px-4 py-3 group"
                      style={{ background:PILLAR_META[lowestPillar].badgeBg, border:`1px solid ${PILLAR_META[lowestPillar].trackBg}` }}>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" style={{ color:PILLAR_META[lowestPillar].color }}/>
                    <span className="text-[12px] font-semibold" style={{ color:PILLAR_META[lowestPillar].color }}>
                      View {PILLAR_META[lowestPillar].resourceCategory} resources
                    </span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform"
                              style={{ color:PILLAR_META[lowestPillar].color }}/>
                </Link>
              </div>
            )}

            <Link href="/athlete/trends" className="flex items-center justify-between rounded-2xl px-5 py-4 group"
                  style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background:"#eff6ff" }}>
                  <TrendingUp className="h-4 w-4" style={{ color:"#2563eb" }} />
                </div>
                <div>
                  <p className="font-semibold text-[14px]" style={{ color:T.textSub }}>Your Trends</p>
                  <p className="text-[11px]" style={{ color:T.textMuted }}>Full history & weekly view</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" style={{ color:T.textMuted }} />
            </Link>
          </>
        ) : (
          <div className="rounded-2xl p-10 text-center" style={{ background:T.surface, border:`2px dashed ${T.border}` }}>
            <TrendingUp className="h-7 w-7 mx-auto mb-3" style={{ color:T.border }} />
            <p className="text-[13px] font-medium" style={{ color:T.textMuted }}>
              Your wellness scores appear here after your first check-in.
            </p>
          </div>
        )}

        {/* Secondary links */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { href:"/athlete/checkin/screening", icon:<ClipboardList className="h-4 w-4"/>, label:"Screening",  color:"#7c3aed", bg:"#f5f3ff" },
            { href:"/athlete/resources",         icon:<Sparkles      className="h-4 w-4"/>, label:"Resources",  color:"#db2777", bg:"#fdf2f8" },
            { href:"/athlete/privacy",           icon:<Lock          className="h-4 w-4"/>, label:"Privacy",    color:T.textMuted, bg:T.raised },
          ] as const).map(({ href, icon, label, color, bg }) => (
            <Link key={href} href={href}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl py-4 active:scale-95 transition-transform"
                  style={{ background:T.surface, border:`1px solid ${T.border}`, boxShadow:shadow }}>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background:bg, color }}>{icon}</div>
              <span className="text-[11px] font-semibold" style={{ color:T.textSub }}>{label}</span>
            </Link>
          ))}
        </div>

        {/* Privacy note */}
        <div className="rounded-xl px-4 py-3.5" style={{ background:T.greenLight, border:`1px solid ${T.greenBorder}` }}>
          <p className="text-[11px] leading-relaxed" style={{ color:T.greenDeep }}>
            <span className="font-semibold">Your data is private.</span>{" "}
            Coaches only see anonymized team averages — never your individual responses.
          </p>
        </div>

      </div>
    </DashboardLayout>
  );
}
