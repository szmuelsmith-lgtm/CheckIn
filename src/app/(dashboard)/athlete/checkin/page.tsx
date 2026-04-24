"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Slider } from "@/components/ui/slider";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS, computePillarScores, evaluateSupportTrigger } from "@/lib/pillar-scoring";
import { selectQuestionsForSession } from "@/lib/question-engine";
import type { Question, Pillar, PillarScores } from "@/types/database";
import {
  CheckCircle, ChevronRight, ChevronLeft,
  AlertCircle, ArrowRight, Heart, X,
} from "lucide-react";

// ─── Design system ─────────────────────────────────────────────────────────────
const DS = {
  bg:        "#F0F2F8",
  surface:   "#FFFFFF",
  raised:    "#F8F9FC",
  shadow:    "0 4px 24px rgba(31,38,135,0.08)",
  shadowSm:  "0 2px 12px rgba(31,38,135,0.05)",
  text:      "#1C1C3D",
  textSub:   "#5A5A8A",
  textMuted: "#9EA3B2",
};

const PILLAR_CONFIG: Record<Pillar, { color: string; bg: string; grad: string }> = {
  emotional:  { color: "#5B8FF9", bg: "#EEF3FF", grad: "linear-gradient(135deg,#5B8FF9,#8BB5FF)" },
  resilience: { color: "#9B8FF9", bg: "#F0EEFF", grad: "linear-gradient(135deg,#9B8FF9,#C4B5FF)" },
  recovery:   { color: "#10B981", bg: "#D1FAE5", grad: "linear-gradient(135deg,#10B981,#34D399)" },
  support:    { color: "#00C2CB", bg: "#E0FAFB", grad: "linear-gradient(135deg,#00C2CB,#4DD8DE)" },
};

function valueLabel(v: number) {
  if (v <= 2) return "Really struggling";
  if (v <= 4) return "Not great";
  if (v <= 6) return "Okay";
  if (v <= 8) return "Doing well";
  return "Thriving";
}

function valueColor(v: number): string {
  if (v <= 3) return "#F59E0B";
  if (v <= 5) return "#9EA3B2";
  return "#5B8FF9";
}

function ResultView({ pillarScores, triggerSupport, onDone }: {
  pillarScores: PillarScores;
  triggerSupport: boolean;
  onDone: () => void;
}) {
  const pillars: Pillar[] = ["emotional", "resilience", "recovery", "support"];
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Success card */}
      <div
        className="rounded-[20px] p-6 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #5B8FF9 0%, #9B8FF9 100%)",
          boxShadow: "0 10px 36px rgba(91,143,249,0.35)",
        }}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full pointer-events-none"
             style={{ background: "rgba(255,255,255,0.09)" }} />
        <div
          className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "rgba(255,255,255,0.2)" }}
        >
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-[22px] font-bold text-white mb-1">Check-in complete</h2>
        <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.75)" }}>
          Thanks for being honest. That takes courage.
        </p>
      </div>

      {triggerSupport && (
        <div
          className="rounded-[20px] p-4 flex items-start gap-3"
          style={{ background: "#D1FAE5", boxShadow: DS.shadowSm }}
        >
          <div className="h-8 w-8 rounded-[10px] flex items-center justify-center shrink-0"
               style={{ background: "#A7F3D0" }}>
            <AlertCircle className="h-4 w-4" style={{ color: "#059669" }} />
          </div>
          <div>
            <p className="text-[14px] font-bold mb-0.5" style={{ color: "#1C1C3D" }}>
              We noticed you might be struggling
            </p>
            <p className="text-[13px] leading-relaxed" style={{ color: "#5A5A8A" }}>
              A support person — not your coach — may reach out. You can also call or text{" "}
              <strong style={{ color: "#059669" }}>988</strong> anytime, free and confidential.
            </p>
          </div>
        </div>
      )}

      {/* Pillar score cards */}
      <div className="grid grid-cols-2 gap-3">
        {pillars.map(pillar => {
          const score = pillarScores[pillar];
          const pct   = Math.round((score / 10) * 100);
          const cfg   = PILLAR_CONFIG[pillar];
          return (
            <div key={pillar} className="rounded-[20px] p-4"
                 style={{ background: DS.surface, boxShadow: DS.shadow }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5"
                 style={{ color: DS.textMuted }}>
                {PILLAR_LABELS[pillar]}
              </p>
              <p className="text-[28px] font-bold leading-none mb-3 tabular-nums"
                 style={{ color: DS.text }}>
                {score.toFixed(1)}
              </p>
              <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "#F0F2F8" }}>
                <div className="h-full rounded-full transition-all duration-700"
                     style={{ width: `${pct}%`, background: cfg.grad }} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-center" style={{ color: DS.textMuted }}>
        These scores are private — coaches see anonymized team averages only.
      </p>

      <button
        onClick={onDone}
        className="w-full flex items-center justify-center gap-2 h-12 font-semibold text-[15px] rounded-[16px] transition-opacity"
        style={{ background: "linear-gradient(135deg,#5B8FF9,#9B8FF9)", color: "#fff",
                 boxShadow: "0 8px 24px rgba(91,143,249,0.35)" }}
      >
        Back to Dashboard <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function WeeklyCheckinPage() {
  const router = useRouter();
  const [userName, setUserName]     = useState("...");
  const [questions, setQuestions]   = useState<Question[]>([]);
  const [responses, setResponses]   = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ]     = useState(0);
  const [notes, setNotes]           = useState("");
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pillarScores, setPillarScores] = useState<PillarScores | null>(null);
  const [triggerSupport, setTriggerSupport] = useState(false);
  const [error, setError]           = useState("");
  const [outreachConsent, setOutreachConsent] = useState<boolean | null>(null);
  const [showOutreachStep, setShowOutreachStep] = useState(false);
  const [profileId, setProfileId]   = useState<string | null>(null);
  const [teamId, setTeamId]         = useState<string | null>(null);

  async function loadQuestions() {
    setLoading(true);
    setLoadError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, team_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!prof) { setLoadError("Profile not found. Please sign in again."); setLoading(false); return; }
      setUserName(prof.full_name);
      setProfileId(prof.id);
      setTeamId(prof.team_id ?? null);

      const { data: allQuestions, error: qErr } = await supabase
        .from("questions")
        .select("*")
        .eq("active", true);

      if (qErr) { setLoadError(`Failed to load questions: ${qErr.message}`); setLoading(false); return; }
      if (!allQuestions || allQuestions.length === 0) {
        setLoadError("No check-in questions found. Please ask your admin to add questions.");
        setLoading(false);
        return;
      }

      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentUsage } = await supabase
        .from("question_usage")
        .select("*")
        .eq("athlete_id", prof.id)
        .gte("used_at", cutoff);

      const selected = selectQuestionsForSession(
        prof.id, "weekly", allQuestions as Question[], recentUsage ?? []
      );
      const qs = selected.length > 0 ? selected : (allQuestions as Question[]).slice(0, 8);

      setQuestions(qs);
      const initial: Record<string, number> = {};
      for (const q of qs) initial[q.id] = 5;
      setResponses(initial);
      setCurrentQ(0);
    } catch (e) {
      setLoadError(String(e));
    }
    setLoading(false);
  }

  useEffect(() => { loadQuestions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(consentOverride?: boolean) {
    if (!profileId) { setError("Session error — please sign in again."); return; }
    setSubmitting(true);
    setError("");
    const consent = consentOverride ?? outreachConsent;
    try {
      const supabase = createClient();
      const questionIds = Object.keys(responses);
      const { data: questionRows } = await supabase
        .from("questions").select("*").in("id", questionIds);

      const qs = (questionRows ?? []) as Question[];
      const scores  = computePillarScores(responses, qs);
      const trigger = evaluateSupportTrigger(scores);

      const checkinId = crypto.randomUUID();
      const { error: checkinErr } = await supabase.from("checkins").insert({
        id: checkinId, athlete_id: profileId, team_id: teamId,
        mode: "weekly", is_private: true,
        emotional_score: scores.emotional, resilience_score: scores.resilience,
        recovery_score: scores.recovery, support_score: scores.support,
        question_ids: questionIds, responses, notes_private: notes || null,
      });

      if (checkinErr) { setError(`Submission failed: ${checkinErr.message}`); setSubmitting(false); return; }

      await supabase.from("question_usage").insert(
        questionIds.map(qid => ({
          athlete_id: profileId, question_id: qid,
          checkin_id: checkinId, used_at: new Date().toISOString(),
        }))
      );

      await supabase.from("audit_logs").insert({
        actor_profile_id: profileId, action: "checkin_submitted",
        target_type: "checkin", target_id: checkinId,
        metadata: { mode: "weekly", outreach_consent: consent ?? false },
      });

      setPillarScores(scores);
      setTriggerSupport(trigger);
    } catch (e) {
      setError(`An error occurred: ${String(e)}`);
    }
    setSubmitting(false);
  }

  if (loading) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin"
             style={{ borderColor: "#EEF3FF", borderTopColor: "#5B8FF9" }} />
      </div>
    </DashboardLayout>
  );

  if (loadError) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto mt-8">
        <div className="rounded-[20px] p-6 text-center"
             style={{ background: DS.surface, boxShadow: DS.shadow }}>
          <p className="text-[14px] font-semibold mb-1" style={{ color: "#EF4444" }}>
            Couldn&apos;t load check-in questions.
          </p>
          <p className="text-[12px] font-mono mb-4" style={{ color: DS.textMuted }}>{loadError}</p>
          <button onClick={loadQuestions} className="text-[13px] font-semibold"
                  style={{ color: "#5B8FF9" }}>Retry</button>
        </div>
      </div>
    </DashboardLayout>
  );

  if (pillarScores) return (
    <DashboardLayout role="athlete" userName={userName}>
      <ResultView pillarScores={pillarScores} triggerSupport={triggerSupport}
                  onDone={() => router.push("/athlete/dashboard")} />
    </DashboardLayout>
  );

  const isNotesStep    = currentQ >= questions.length && !showOutreachStep;
  const isOutreachStep = showOutreachStep;
  const question       = !isNotesStep && !isOutreachStep ? questions[currentQ] : null;
  const total          = questions.length + 1;
  const progressPct    = Math.round((currentQ / total) * 100);
  const pillarCfg      = question ? PILLAR_CONFIG[question.pillar] : null;

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: DS.text }}>
            Weekly Check-In
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: DS.textMuted }}>
            Be honest. This is just for you.
          </p>
        </div>

        {/* Crisis banner */}
        <div className="rounded-[16px] px-4 py-3"
             style={{ background: "#EEF3FF", boxShadow: DS.shadowSm }}>
          <p className="text-[12px] leading-relaxed" style={{ color: DS.textSub }}>
            <strong style={{ color: "#5B8FF9" }}>In crisis?</strong> Call or text{" "}
            <strong style={{ color: "#5B8FF9" }}>988</strong> or call{" "}
            <strong style={{ color: "#5B8FF9" }}>911</strong>. This app is a wellness tool, not a crisis service.
          </p>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold" style={{ color: DS.textMuted }}>
              {currentQ + 1} of {total}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: DS.textMuted }}>
              {progressPct}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E8EBFF" }}>
            <div
              className="h-full rounded-full transition-all duration-400"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(to right, #5B8FF9, #9B8FF9)",
              }}
            />
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-[20px] overflow-hidden"
             style={{ background: DS.surface, boxShadow: DS.shadow }}>
          <div className="p-5">
            {isOutreachStep ? (
              /* ── Outreach consent step ── */
              <div className="space-y-5">
                <div
                  className="h-14 w-14 rounded-[16px] flex items-center justify-center mx-auto"
                  style={{ background: "#D1FAE5" }}
                >
                  <Heart className="h-7 w-7" style={{ color: "#059669" }} />
                </div>
                <div className="text-center">
                  <p className="text-[17px] font-bold mb-2" style={{ color: DS.text }}>
                    Would it be OK for a counselor to reach out to you?
                  </p>
                  <p className="text-[13px] leading-relaxed" style={{ color: DS.textMuted }}>
                    Your coach will <strong style={{ color: DS.textSub }}>never</strong> be told.
                    This is between you and a licensed counselor only.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => { setOutreachConsent(true); handleSubmit(true); }}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-[14px] font-semibold text-[14px] disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg,#5B8FF9,#9B8FF9)",
                      color: "#fff",
                      boxShadow: "0 6px 20px rgba(91,143,249,0.35)",
                    }}
                  >
                    {submitting && outreachConsent === true
                      ? <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      : <>✓ Yes, please</>}
                  </button>
                  <button
                    onClick={() => { setOutreachConsent(false); handleSubmit(false); }}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 py-3.5 rounded-[14px] font-semibold text-[14px] disabled:opacity-60"
                    style={{ background: "#F0F2F8", color: DS.textSub }}
                  >
                    {submitting && outreachConsent === false
                      ? <span className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                      : <><X className="h-4 w-4" />No thanks</>}
                  </button>
                </div>
                {error && (
                  <p className="text-[13px] px-3 py-2 rounded-[12px] text-center"
                     style={{ color: "#EF4444", background: "#FEE2E2" }}>{error}</p>
                )}
              </div>
            ) : !isNotesStep && question ? (
              /* ── Question step ── */
              <div className="space-y-5">
                {/* Pillar badge */}
                <div
                  className="inline-flex items-center px-3 py-1 rounded-[8px] text-[10px] font-bold uppercase tracking-widest text-white"
                  style={{ background: pillarCfg?.grad ?? "#5B8FF9" }}
                >
                  {PILLAR_LABELS[question.pillar]}
                </div>

                <p className="text-[17px] font-semibold leading-snug" style={{ color: DS.text }}>
                  {question.text}
                </p>

                {/* Score display */}
                <div className="flex items-center justify-center gap-4 py-3">
                  <span
                    className="text-[64px] font-bold tabular-nums leading-none"
                    style={{ color: valueColor(responses[question.id] ?? 5) }}
                  >
                    {responses[question.id] ?? 5}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: DS.textSub }}>
                      {valueLabel(responses[question.id] ?? 5)}
                    </p>
                    <p className="text-[11px]" style={{ color: DS.textMuted }}>out of 10</p>
                  </div>
                </div>

                <Slider
                  value={[responses[question.id] ?? 5]}
                  onValueChange={([v]) => setResponses(r => ({ ...r, [question.id]: v }))}
                  min={1} max={10} step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-[11px] mt-1" style={{ color: DS.textMuted }}>
                  <span>Not at all</span>
                  <span>Completely</span>
                </div>
              </div>
            ) : (
              /* ── Notes step ── */
              <div className="space-y-4">
                <div>
                  <p className="text-[17px] font-bold mb-0.5" style={{ color: DS.text }}>
                    Anything on your mind?
                  </p>
                  <p className="text-[13px]" style={{ color: DS.textMuted }}>
                    Optional · Private · Only you can see this.
                  </p>
                </div>
                <textarea
                  placeholder="Write whatever you need to get off your chest..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-[14px] text-[14px] resize-none leading-relaxed focus:outline-none transition-colors"
                  style={{
                    background: "#F8F9FC",
                    color: DS.textSub,
                    caretColor: "#5B8FF9",
                  }}
                />
                {error && (
                  <p className="text-[13px] px-3 py-2 rounded-[12px]"
                     style={{ color: "#EF4444", background: "#FEE2E2" }}>{error}</p>
                )}
              </div>
            )}
          </div>

          {/* Nav footer */}
          {!isOutreachStep && (
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ background: "#F8F9FC", borderTop: "1px solid #F0F2F8" }}
            >
              <button
                onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                disabled={currentQ === 0}
                className="flex items-center gap-1.5 h-10 px-4 text-[13px] font-semibold rounded-[12px] transition-all disabled:opacity-30"
                style={{ background: "#FFFFFF", color: DS.textSub,
                         boxShadow: "0 2px 8px rgba(31,38,135,0.07)" }}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>

              {!isNotesStep ? (
                <button
                  onClick={() => setCurrentQ(q => q + 1)}
                  className="flex items-center gap-1.5 h-10 px-5 text-[13px] font-semibold text-white rounded-[12px]"
                  style={{ background: "linear-gradient(135deg,#5B8FF9,#9B8FF9)",
                           boxShadow: "0 6px 20px rgba(91,143,249,0.3)" }}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowOutreachStep(true)}
                  className="h-10 px-5 text-[13px] font-semibold text-white rounded-[12px] flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg,#5B8FF9,#9B8FF9)",
                           boxShadow: "0 6px 20px rgba(91,143,249,0.3)" }}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-[11px]" style={{ color: DS.textMuted }}>
          About 3 minutes · Coaches never see individual responses
        </p>

      </div>
    </DashboardLayout>
  );
}
