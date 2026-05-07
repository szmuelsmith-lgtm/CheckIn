"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import { selectQuestionsForSession } from "@/lib/question-engine";
import type { Question, Pillar, PillarScores } from "@/types/database";
import {
  CheckCircle, ChevronRight, ChevronLeft,
  AlertCircle, ArrowRight, Heart, X,
} from "lucide-react";

// ─── Design tokens ─────────────────────────────────────────────────────────────
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

// Pillar identity colors
const PILLAR_COLOR: Record<Pillar, string> = {
  emotional:  "#059669",
  resilience: "#3b82f6",
  recovery:   "#8b5cf6",
  support:    "#06b6d4",
};

// ─── Score label / color ────────────────────────────────────────────────────────
function valueLabel(v: number) {
  if (v <= 2) return "Really struggling";
  if (v <= 4) return "Not great";
  if (v <= 6) return "Okay";
  if (v <= 8) return "Doing well";
  return "Thriving";
}

function valueColor(v: number): string {
  if (v <= 3) return "#ef4444";
  if (v <= 5) return "#d97706";
  if (v <= 7) return "#64748b";
  return "#059669";
}

// ─── Circular dial (result view) ───────────────────────────────────────────────
function ResultDial({ score, color }: { score: number; color: string }) {
  const CX = 44, CY = 44, R = 32, SW = 6;
  const circ   = 2 * Math.PI * R;
  const offset = circ * (1 - score / 10);
  return (
    <svg width={88} height={88} viewBox="0 0 88 88">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#e8edf2" strokeWidth={SW} />
      {score > 0 && (
        <circle
          cx={CX} cy={CY} r={R}
          fill="none" stroke={color} strokeWidth={SW}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${CX} ${CY})`}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)" }}
        />
      )}
    </svg>
  );
}

// ─── Result view ───────────────────────────────────────────────────────────────
function ResultView({ pillarScores, triggerSupport, onDone }: {
  pillarScores: PillarScores;
  triggerSupport: boolean;
  onDone: () => void;
}) {
  const pillars: Pillar[] = ["emotional", "resilience", "recovery", "support"];

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* Success card */}
      <div
        className="rounded-3xl p-6 text-center"
        style={{
          background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
          border: "1px solid #a7f3d0",
          boxShadow: "0 4px 20px rgba(5,150,105,0.1)",
        }}
      >
        <div
          className="h-16 w-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: "linear-gradient(135deg, #065f46, #059669)",
            boxShadow: "0 4px 16px rgba(5,150,105,0.35)",
          }}
        >
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-[22px] font-bold mb-1" style={{ color: T.text }}>Check-in complete</h2>
        <p className="text-[14px]" style={{ color: "#047857" }}>Thanks for being honest. That takes courage.</p>
      </div>

      {/* Support notice */}
      {triggerSupport && (
        <div
          className="rounded-3xl p-4 flex items-start gap-3"
          style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
          <div>
            <p className="text-[14px] font-semibold" style={{ color: "#92400e" }}>We noticed you might be struggling</p>
            <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: "#d97706" }}>
              A support person — not your coach — may reach out. You can also call or text{" "}
              <strong style={{ color: "#92400e" }}>988</strong> anytime, free and confidential.
            </p>
          </div>
        </div>
      )}

      {/* Pillar score dials */}
      <div className="grid grid-cols-2 gap-3">
        {pillars.map((pillar, i) => {
          const score = pillarScores[pillar];
          const col   = PILLAR_COLOR[pillar];
          return (
            <div
              key={pillar}
              className="rounded-3xl p-4 flex flex-col items-center animate-fade-in-up"
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderTop: `3px solid ${col}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                animationDelay: `${i * 80}ms`,
              }}
            >
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2 self-start" style={{ color: T.textMuted }}>
                {PILLAR_LABELS[pillar]}
              </p>
              <div className="relative flex items-center justify-center">
                <ResultDial score={score} color={col} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[22px] font-bold tabular-nums leading-none" style={{ color: col }}>
                    {score.toFixed(1)}
                  </span>
                  <span className="text-[9px] mt-0.5" style={{ color: T.textMuted }}>/ 10</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-center" style={{ color: T.textMuted }}>
        These scores are private — coaches see anonymized team averages only.
      </p>

      <button
        onClick={onDone}
        className="w-full flex items-center justify-center gap-2 h-13 py-3.5 font-bold text-[15px] rounded-2xl transition-opacity active:opacity-80"
        style={{
          background: "linear-gradient(135deg, #065f46, #059669)",
          color: "#fff",
          boxShadow: "0 4px 16px rgba(5,150,105,0.25)",
        }}
      >
        Back to Dashboard <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main check-in page ────────────────────────────────────────────────────────
export default function WeeklyCheckinPage() {
  const router = useRouter();
  const [userName, setUserName]         = useState("...");
  const [questions, setQuestions]       = useState<Question[]>([]);
  const [responses, setResponses]       = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ]         = useState(0);
  const [notes, setNotes]               = useState("");
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [pillarScores, setPillarScores] = useState<PillarScores | null>(null);
  const [triggerSupport, setTriggerSupport] = useState(false);
  const [error, setError]               = useState("");
  const [outreachConsent, setOutreachConsent] = useState<boolean | null>(null);
  const [showOutreachStep, setShowOutreachStep] = useState(false);
  const [profileId, setProfileId]       = useState<string | null>(null);

  async function loadQuestions() {
    setLoading(true); setLoadError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles").select("id, full_name, team_id").eq("auth_user_id", user.id).single();
      if (!prof) { setLoadError("Profile not found. Please sign in again."); setLoading(false); return; }

      setUserName(prof.full_name);
      setProfileId(prof.id);

      const { data: allQuestions, error: qErr } = await supabase.from("questions").select("*").eq("active", true);
      if (qErr) { setLoadError(`Failed to load questions: ${qErr.message}`); setLoading(false); return; }
      if (!allQuestions || allQuestions.length === 0) {
        setLoadError("No check-in questions found. Please ask your admin to add questions.");
        setLoading(false); return;
      }

      const cutoff = new Date(Date.now() - 14 * 86400000).toISOString();
      const { data: recentUsage } = await supabase
        .from("question_usage").select("*").eq("athlete_id", prof.id).gte("used_at", cutoff);

      const selected = selectQuestionsForSession(prof.id, "weekly", allQuestions as Question[], recentUsage ?? []);
      const qs = selected.length > 0 ? selected : (allQuestions as Question[]).slice(0, 8);

      setQuestions(qs);
      const initial: Record<string, number> = {};
      for (const q of qs) initial[q.id] = 5;
      setResponses(initial);
      setCurrentQ(0);
    } catch (e) { setLoadError(String(e)); }
    setLoading(false);
  }

  useEffect(() => { loadQuestions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(consentOverride?: boolean) {
    if (!profileId) { setError("Session error — please sign in again."); return; }
    setSubmitting(true); setError("");
    const wantsFollowup = consentOverride ?? outreachConsent ?? false;
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "weekly",
          responses,
          notes: notes || undefined,
          wants_followup: wantsFollowup,
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
    } catch (e) { setError(`An error occurred: ${String(e)}`); }
    setSubmitting(false);
  }

  if (loading) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin"
             style={{ borderColor: "#e2e8f0", borderTopColor: T.green }} />
      </div>
    </DashboardLayout>
  );

  if (loadError) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto mt-8">
        <div
          className="rounded-3xl p-6 text-center"
          style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <p className="text-[14px] font-semibold mb-1" style={{ color: "#ef4444" }}>Couldn&apos;t load check-in questions.</p>
          <p className="text-[12px] font-mono mb-4" style={{ color: T.textMuted }}>{loadError}</p>
          <button onClick={loadQuestions} className="text-[13px] font-bold" style={{ color: T.green }}>Retry</button>
        </div>
      </div>
    </DashboardLayout>
  );

  if (pillarScores) return (
    <DashboardLayout role="athlete" userName={userName}>
      <ResultView pillarScores={pillarScores} triggerSupport={triggerSupport} onDone={() => router.push("/athlete/dashboard")} />
    </DashboardLayout>
  );

  const isNotesStep    = currentQ >= questions.length && !showOutreachStep;
  const isOutreachStep = showOutreachStep;
  const question       = !isNotesStep && !isOutreachStep ? questions[currentQ] : null;
  const total          = questions.length + 1;
  const pct            = Math.round((currentQ / total) * 100);
  const currentVal     = question ? (responses[question.id] ?? 5) : 5;

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: T.text }}>Weekly Check-In</h1>
          <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>Be honest. This is just for you.</p>
        </div>

        {/* Crisis banner */}
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: T.raised, border: `1px solid ${T.border}` }}
        >
          <p className="text-[12px] leading-relaxed" style={{ color: T.textMuted }}>
            <strong style={{ color: T.textSub }}>In crisis?</strong> Call or text{" "}
            <strong style={{ color: T.textSub }}>988</strong> or call{" "}
            <strong style={{ color: T.textSub }}>911</strong>. This app is a wellness tool, not a crisis service.
          </p>
        </div>

        {/* Progress bar */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium" style={{ color: T.textMuted }}>{currentQ + 1} of {total}</span>
            <span className="text-[11px] font-semibold" style={{ color: T.green }}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: T.borderSub }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(to right, #065f46, #10b981)",
                transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          className="rounded-3xl overflow-hidden animate-scale-in"
          style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}
        >
          <div className="p-6">
            {isOutreachStep ? (
              /* Outreach consent */
              <div className="space-y-5">
                <div
                  className="h-14 w-14 rounded-3xl flex items-center justify-center mx-auto"
                  style={{ background: "#fef3c7" }}
                >
                  <Heart className="h-7 w-7" style={{ color: "#d97706" }} />
                </div>
                <div className="text-center">
                  <p className="text-[17px] font-bold mb-2" style={{ color: T.text }}>
                    Would it be OK for a counselor to reach out to you?
                  </p>
                  <p className="text-[13px] leading-relaxed" style={{ color: T.textMuted }}>
                    Your coach will <strong style={{ color: T.textSub }}>never</strong> be told. This is between you and a licensed counselor only.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setOutreachConsent(true); handleSubmit(true); }}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-[14px] transition-opacity disabled:opacity-60 active:opacity-80"
                    style={{
                      background: "linear-gradient(135deg, #065f46, #059669)",
                      color: "#fff",
                      boxShadow: "0 3px 12px rgba(5,150,105,0.28)",
                    }}
                  >
                    {submitting && outreachConsent === true
                      ? <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      : <>✓ Yes, please</>}
                  </button>
                  <button
                    onClick={() => { setOutreachConsent(false); handleSubmit(false); }}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-[14px] transition-opacity disabled:opacity-60 active:opacity-80"
                    style={{ background: T.raised, border: `1px solid ${T.border}`, color: T.textSub }}
                  >
                    {submitting && outreachConsent === false
                      ? <span className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.textSub }} />
                      : <><X className="h-4 w-4" />No thanks</>}
                  </button>
                </div>
                {error && (
                  <p
                    className="text-[13px] px-3 py-2 rounded-xl text-center"
                    style={{ color: "#ef4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
                  >
                    {error}
                  </p>
                )}
              </div>

            ) : !isNotesStep && question ? (
              /* Question + slider */
              <div className="space-y-6">
                {/* Pillar tag */}
                <div
                  className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white"
                  style={{ background: PILLAR_COLOR[question.pillar] }}
                >
                  {PILLAR_LABELS[question.pillar]}
                </div>

                <p className="text-[17px] font-semibold leading-snug" style={{ color: T.text }}>
                  {question.text}
                </p>

                {/* Slider */}
                <div>
                  <input
                    type="range"
                    min={1} max={10} step={1}
                    value={currentVal}
                    onChange={(e) => setResponses(r => ({ ...r, [question.id]: parseInt(e.target.value) }))}
                    className="w-full"
                    style={{ accentColor: PILLAR_COLOR[question.pillar] }}
                  />
                  <div className="flex justify-between text-[11px] mt-2" style={{ color: T.textMuted }}>
                    <span>Not at all</span>
                    <span>Completely</span>
                  </div>
                </div>

                {/* Score display */}
                <div
                  className="flex items-center justify-center gap-4 py-4 rounded-2xl"
                  style={{ background: T.raised }}
                >
                  <span
                    className="text-[56px] font-bold tabular-nums leading-none"
                    style={{
                      color: valueColor(currentVal),
                      transition: "color 0.3s ease",
                    }}
                  >
                    {currentVal}
                  </span>
                  <span
                    className="text-[15px] font-medium max-w-[100px] leading-snug"
                    style={{ color: T.textMuted }}
                  >
                    {valueLabel(currentVal)}
                  </span>
                </div>
              </div>

            ) : (
              /* Notes step */
              <div className="space-y-4">
                <div>
                  <p className="text-[17px] font-bold mb-0.5" style={{ color: T.text }}>Anything on your mind?</p>
                  <p className="text-[13px]" style={{ color: T.textMuted }}>Optional · Private · Only you can see this.</p>
                </div>
                <textarea
                  placeholder="Write whatever you need to get off your chest..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-2xl text-[14px] resize-none leading-relaxed focus:outline-none"
                  style={{
                    background: T.raised,
                    border: `1px solid ${T.border}`,
                    color: T.textSub,
                    caretColor: T.green,
                  }}
                />
                {error && (
                  <p
                    className="text-[13px] px-3 py-2 rounded-xl"
                    style={{ color: "#ef4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
                  >
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Navigation footer */}
          {!isOutreachStep && (
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ background: T.raised, borderTop: `1px solid ${T.borderSub}` }}
            >
              <button
                onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                disabled={currentQ === 0}
                className="flex items-center gap-1.5 h-10 px-4 text-[13px] font-semibold rounded-2xl transition-opacity disabled:opacity-30"
                style={{ color: T.textSub, border: `1px solid ${T.border}`, background: T.surface }}
              >
                <ChevronLeft className="h-4 w-4" />Back
              </button>

              {!isNotesStep ? (
                <button
                  onClick={() => setCurrentQ(q => q + 1)}
                  className="flex items-center gap-1.5 h-10 px-5 text-[13px] font-bold text-white rounded-2xl"
                  style={{ background: "linear-gradient(135deg, #065f46, #059669)", boxShadow: "0 2px 8px rgba(5,150,105,0.25)" }}
                >
                  Next<ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowOutreachStep(true)}
                  className="flex items-center gap-1.5 h-10 px-5 text-[13px] font-bold text-white rounded-2xl"
                  style={{ background: "linear-gradient(135deg, #065f46, #059669)", boxShadow: "0 2px 8px rgba(5,150,105,0.25)" }}
                >
                  Next<ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-[11px]" style={{ color: "#94a3b8" }}>
          About 3 minutes · Coaches never see individual responses
        </p>
      </div>
    </DashboardLayout>
  );
}
