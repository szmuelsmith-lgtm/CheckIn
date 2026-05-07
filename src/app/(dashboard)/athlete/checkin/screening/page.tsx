"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import { selectQuestionsForSession } from "@/lib/question-engine";
import type { Question, Pillar, PillarScores } from "@/types/database";
import { CheckCircle, ChevronRight, ChevronLeft, AlertCircle, Heart, Shield, Zap, Users, ClipboardList } from "lucide-react";

const T = {
  surface:   "#ffffff",
  raised:    "#f8fafc",
  border:    "#e8edf2",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#059669",
  greenDeep: "#065f46",
};

const PILLAR_ICONS: Record<Pillar, React.ReactNode> = {
  emotional:  <Heart  className="h-4 w-4" />,
  resilience: <Zap    className="h-4 w-4" />,
  recovery:   <Shield className="h-4 w-4" />,
  support:    <Users  className="h-4 w-4" />,
};

const PILLAR_STYLE: Record<Pillar, { bg: string; color: string; border: string; bar: string }> = {
  emotional:  { bg: "#f0fdf4", color: "#047857", border: "#a7f3d0", bar: "#059669" },
  resilience: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", bar: "#3b82f6" },
  recovery:   { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe", bar: "#8b5cf6" },
  support:    { bg: "#fffbeb", color: "#b45309", border: "#fde68a", bar: "#f59e0b" },
};

function valueLabel(v: number) {
  if (v <= 2) return "Struggling";
  if (v <= 4) return "Not great";
  if (v <= 6) return "Okay";
  if (v <= 8) return "Good";
  return "Thriving";
}

function valueColor(v: number): string {
  if (v <= 3) return "#dc2626";
  if (v <= 5) return "#f59e0b";
  return T.green;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px]" style={{ color: T.textMuted }}>{current} of {total}</span>
        <span className="text-[11px]" style={{ color: T.textMuted }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.borderSub }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: `linear-gradient(to right, ${T.greenDeep}, ${T.green})` }}
        />
      </div>
    </div>
  );
}

interface ResultCardProps {
  pillarScores: PillarScores;
  triggerSupport: boolean;
  onDone: () => void;
}

function ResultCard({ pillarScores, triggerSupport, onDone }: ResultCardProps) {
  const pillars: Pillar[] = ["emotional", "resilience", "recovery", "support"];
  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-5">
      <div className="text-center">
        <div className="inline-flex p-4 rounded-full mb-4" style={{ background: "#d1fae5" }}>
          <CheckCircle className="h-12 w-12" style={{ color: T.green }} />
        </div>
        <h2 className="text-[22px] font-bold mb-2" style={{ color: T.text }}>Screening complete</h2>
        <p className="text-[14px]" style={{ color: T.textMuted }}>Thank you for taking the time. Your honesty matters.</p>
      </div>

      {triggerSupport && (
        <div className="flex items-start gap-3 rounded-2xl p-4" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#b45309" }} />
          <div>
            <p className="text-[13px] font-semibold mb-0.5" style={{ color: "#92400e" }}>We want to support you</p>
            <p className="text-[13px]" style={{ color: "#92400e" }}>
              Based on your responses, a support person — not your coach — may reach out soon. You can also text <strong>988</strong> anytime, day or night.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {pillars.map((pillar) => {
          const score = pillarScores[pillar];
          const style = PILLAR_STYLE[pillar];
          const pct = Math.round((score / 10) * 100);
          return (
            <div key={pillar} className="rounded-2xl p-4" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
              <div className="flex items-center gap-1.5 mb-1" style={{ color: style.color }}>
                {PILLAR_ICONS[pillar]}
                <p className="text-[11px] uppercase tracking-wide font-semibold">{PILLAR_LABELS[pillar]}</p>
              </div>
              <p className="text-[24px] font-bold" style={{ color: style.color }}>{score.toFixed(1)}</p>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.6)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: style.bar }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl p-4 text-center" style={{ background: T.raised, border: `1px solid ${T.border}` }}>
        <p className="text-[12px]" style={{ color: T.textMuted }}>
          Your screening results are private. Licensed counselors with your consent can view them. Coaches never see individual data.
        </p>
      </div>

      <button
        onClick={onDone}
        className="w-full h-12 text-[14px] font-semibold text-white rounded-2xl transition-opacity hover:opacity-90"
        style={{ background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})` }}
      >
        Back to Dashboard
      </button>
    </div>
  );
}

function ConsentGate({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="max-w-lg mx-auto mt-8 space-y-4">
      <div className="text-center">
        <div className="inline-flex p-3 rounded-full mb-3" style={{ background: "#eff6ff" }}>
          <ClipboardList className="h-8 w-8" style={{ color: "#2563eb" }} />
        </div>
        <h2 className="text-[20px] font-bold mb-2" style={{ color: T.text }}>Mental Health Screening</h2>
        <p className="text-[14px]" style={{ color: T.textMuted }}>
          This is a deeper check-in covering all four pillars. It takes about 10 minutes.
        </p>
      </div>

      <div className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <p className="text-[13px] font-semibold mb-3" style={{ color: T.text }}>Before you begin, please know:</p>
        <ul className="space-y-2.5">
          {[
            "Your responses are private by default — coaches never see them.",
            "You may choose to share your results with a counselor or trusted adult.",
            "This screening does not replace professional mental health care.",
            "If you are in crisis, please call or text 988 immediately.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px]" style={{ color: T.textSub }}>
              <span
                className="shrink-0 mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ background: "#d1fae5", color: "#047857" }}
              >
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onDecline}
          className="flex-1 h-11 text-[14px] font-semibold rounded-2xl border transition-colors"
          style={{ borderColor: T.border, color: T.textSub, background: T.raised }}
        >
          Not right now
        </button>
        <button
          onClick={onAccept}
          className="flex-1 h-11 text-[14px] font-semibold text-white rounded-2xl transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})` }}
        >
          I understand — begin
        </button>
      </div>
    </div>
  );
}

export default function ScreeningCheckinPage() {
  const router = useRouter();
  const [userName, setUserName]       = useState("...");
  const [phase, setPhase]             = useState<"consent" | "questions" | "result">("consent");
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [responses, setResponses]     = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ]       = useState(0);
  const [notes, setNotes]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [pillarScores, setPillarScores] = useState<PillarScores | null>(null);
  const [triggerSupport, setTriggerSupport] = useState(false);
  const [error, setError]             = useState("");
  const [profileId, setProfileId]     = useState<string | null>(null);
  const [teamId, setTeamId]           = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("id, full_name, team_id").eq("auth_user_id", user.id).single();
      if (prof) { setUserName(prof.full_name); setProfileId(prof.id); setTeamId(prof.team_id ?? null); }
    }
    loadUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadQuestions() {
    if (!profileId) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: allQuestions, error: qErr } = await supabase.from("questions").select("*").eq("active", true);
      if (qErr || !allQuestions || allQuestions.length === 0) { setError("Failed to load screening questions. Please try again."); setLoading(false); return; }
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentUsage } = await supabase.from("question_usage").select("*").eq("athlete_id", profileId).gte("used_at", cutoff);
      const selected = selectQuestionsForSession(profileId, "screening", allQuestions as Question[], recentUsage ?? []);
      const qs = selected.length > 0 ? selected : (allQuestions as Question[]).slice(0, 16);
      setQuestions(qs);
      const initial: Record<string, number> = {};
      for (const q of qs) initial[q.id] = 5;
      setResponses(initial);
    } catch (e) { setError(`Failed to load questions: ${String(e)}`); }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!profileId) { setError("Session error — please sign in again."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "screening",
          responses,
          notes: notes || undefined,
          wants_followup: false, // screening result page handles explicit reach-out separately
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(`Submission failed: ${data.error ?? res.statusText}`);
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setPillarScores(data.pillarScores);
      setTriggerSupport(data.triggerSupport ?? false);
      setPhase("result");
    } catch (e) { setError(`An error occurred: ${String(e)}`); }
    setSubmitting(false);
  }

  const handleAcceptConsent = async () => { setPhase("questions"); await loadQuestions(); };

  if (phase === "consent") {
    return (
      <DashboardLayout role="athlete" userName={userName}>
        <ConsentGate onAccept={handleAcceptConsent} onDecline={() => router.push("/athlete/dashboard")} />
      </DashboardLayout>
    );
  }

  if (phase === "result" && pillarScores) {
    return (
      <DashboardLayout role="athlete" userName={userName}>
        <ResultCard pillarScores={pillarScores} triggerSupport={triggerSupport} onDone={() => router.push("/athlete/dashboard")} />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout role="athlete" userName={userName}>
        <div className="flex items-center justify-center h-64">
          <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.green }} />
        </div>
      </DashboardLayout>
    );
  }

  const isNotesStep = currentQ >= questions.length;
  const question = !isNotesStep ? questions[currentQ] : null;
  const currentVal = question ? (responses[question.id] ?? 5) : 5;

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto space-y-4">
        <div>
          <h1 className="text-[20px] font-bold" style={{ color: T.text }}>Mental Health Screening</h1>
          <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>Answer honestly. There are no wrong answers.</p>
        </div>

        {/* Crisis banner */}
        <div className="rounded-2xl p-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <p className="text-[12px] leading-relaxed" style={{ color: "#92400e" }}>
            <strong>Crisis?</strong> Call or text <strong>988</strong> or call <strong>911</strong>. This is a wellness tool, not a crisis service.
          </p>
        </div>

        <ProgressBar current={currentQ} total={questions.length + 1} />

        <div className="rounded-3xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {!isNotesStep && question ? (
            <div className="space-y-6">
              {/* Pillar badge */}
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
                style={{
                  background: PILLAR_STYLE[question.pillar].bg,
                  color: PILLAR_STYLE[question.pillar].color,
                  border: `1px solid ${PILLAR_STYLE[question.pillar].border}`,
                }}
              >
                {PILLAR_ICONS[question.pillar]}
                {PILLAR_LABELS[question.pillar]}
              </span>

              <p className="text-[15px] font-semibold leading-snug" style={{ color: T.text }}>
                {question.text}
              </p>

              {/* Native range slider */}
              <div>
                <input
                  type="range"
                  min={1} max={10} step={1}
                  value={currentVal}
                  onChange={(e) => setResponses(r => ({ ...r, [question.id]: parseInt(e.target.value) }))}
                  className="w-full"
                  style={{ accentColor: T.green }}
                />
                <div className="flex justify-between text-[11px] mt-1.5" style={{ color: T.textMuted }}>
                  <span>Not at all</span>
                  <span>Completely</span>
                </div>
              </div>

              {/* Value display */}
              <div className="flex items-center justify-center gap-3">
                <span className="text-[40px] font-bold tabular-nums" style={{ color: valueColor(currentVal) }}>
                  {currentVal}
                </span>
                <span className="text-[14px]" style={{ color: T.textMuted }}>{valueLabel(currentVal)}</span>
              </div>

              <p className="text-[11px] text-center" style={{ color: T.textMuted }}>
                Question {currentQ + 1} of {questions.length}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>Final thoughts?</p>
                <p className="text-[13px]" style={{ color: T.textMuted }}>
                  Optional. Write anything you want. This is completely private.
                </p>
              </div>
              <textarea
                placeholder="Is there anything else you want to share about how you've been feeling?"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={5}
                className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] bg-white focus:outline-none resize-none transition-colors"
                style={{ borderColor: T.border, color: T.text }}
              />
              {error && <p className="text-[13px]" style={{ color: "#dc2626" }}>{error}</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5" style={{ borderTop: `1px solid ${T.borderSub}` }}>
            <button
              onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
              disabled={currentQ === 0}
              className="flex items-center gap-1 h-9 px-4 text-[13px] font-semibold rounded-xl border transition-colors disabled:opacity-40"
              style={{ borderColor: T.border, color: T.textSub, background: T.raised }}
            >
              <ChevronLeft className="h-4 w-4" />Back
            </button>

            {!isNotesStep ? (
              <button
                onClick={() => setCurrentQ(q => q + 1)}
                className="flex items-center gap-1 h-9 px-4 text-[13px] font-semibold text-white rounded-xl transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})` }}
              >
                Next<ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="h-9 px-6 text-[13px] font-semibold text-white rounded-xl disabled:opacity-50 transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})` }}
              >
                {submitting ? "Submitting..." : "Submit Screening"}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[12px]" style={{ color: T.textMuted }}>
          About 10 minutes · Private by default · Licensed staff only with your consent
        </p>
      </div>
    </DashboardLayout>
  );
}
