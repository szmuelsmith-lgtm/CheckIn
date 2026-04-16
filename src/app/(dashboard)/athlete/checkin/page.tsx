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


// Design tokens — aligned to login page
const OB = {
  surface:   "#ffffff",
  raised:    "#f8fafc",
  border:    "#e2e8f0",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#047857",
};

const PILLAR_TOP: Record<Pillar, string> = {
  emotional:  "#059669",
  resilience: "#2563eb",
  recovery:   "#7c3aed",
  support:    "#0891b2",
};

function valueLabel(v: number) {
  if (v <= 2) return "Really struggling";
  if (v <= 4) return "Not great";
  if (v <= 6) return "Okay";
  if (v <= 8) return "Doing well";
  return "Thriving";
}

function valueColor(v: number): string {
  if (v <= 3) return "#dc2626";
  if (v <= 5) return "#64748b";
  return "#047857";
}

function ResultView({ pillarScores, triggerSupport, onDone }: {
  pillarScores: PillarScores;
  triggerSupport: boolean;
  onDone: () => void;
}) {
  const pillars: Pillar[] = ["emotional", "resilience", "recovery", "support"];
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="rounded-2xl p-6 text-center" style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
        <div className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4"
             style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}>
          <CheckCircle className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-[22px] font-bold mb-1" style={{ color: OB.text }}>Check-in complete</h2>
        <p className="text-[14px]" style={{ color: OB.textMuted }}>Thanks for being honest. That takes courage.</p>
      </div>

      {triggerSupport && (
        <div className="rounded-2xl p-4 flex items-start gap-3"
             style={{ background: OB.raised, border: `1px solid ${OB.border}` }}>
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: OB.textMuted }} />
          <div>
            <p className="text-[14px] font-semibold" style={{ color: OB.textSub }}>We noticed you might be struggling</p>
            <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: OB.textMuted }}>
              A support person — not your coach — may reach out. You can also call or text <strong style={{ color: OB.textSub }}>988</strong> anytime, free and confidential.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {pillars.map(pillar => {
          const score = pillarScores[pillar];
          const pct   = Math.round((score / 10) * 100);
          return (
            <div key={pillar} className="rounded-2xl p-4"
                 style={{ background: OB.surface, border: `1px solid ${OB.border}`, borderTop: `2px solid ${PILLAR_TOP[pillar]}` }}>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: OB.textMuted }}>
                {PILLAR_LABELS[pillar]}
              </p>
              <p className="text-[28px] font-bold leading-none mb-2 tabular-nums" style={{ color: OB.text }}>{score.toFixed(1)}</p>
              <div className="h-[2px] rounded-full overflow-hidden" style={{ background: OB.borderSub }}>
                <div className="h-full rounded-full transition-all duration-500"
                     style={{ width: `${pct}%`, background: PILLAR_TOP[pillar] }} />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-center" style={{ color: OB.textMuted }}>
        These scores are private — coaches see anonymized team averages only.
      </p>

      <button
        onClick={onDone}
        className="w-full flex items-center justify-center gap-2 h-12 font-semibold text-[15px] rounded-xl transition-opacity"
        style={{ background: "linear-gradient(135deg,#065f46,#047857)", color: "#fff" }}
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

  // Store profile in state so we can use it on submit
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

      // Fetch questions directly — no API route needed
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

      // Fetch recent usage for question rotation
      const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentUsage } = await supabase
        .from("question_usage")
        .select("*")
        .eq("athlete_id", prof.id)
        .gte("used_at", cutoff);

      const selected = selectQuestionsForSession(
        prof.id,
        "weekly",
        allQuestions as Question[],
        recentUsage ?? []
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

      // Fetch the full question objects for scoring
      const questionIds = Object.keys(responses);
      const { data: questionRows } = await supabase
        .from("questions")
        .select("*")
        .in("id", questionIds);

      const qs = (questionRows ?? []) as Question[];
      const scores  = computePillarScores(responses, qs);
      const trigger = evaluateSupportTrigger(scores);

      // Insert checkin directly
      const checkinId = crypto.randomUUID();
      const { error: checkinErr } = await supabase.from("checkins").insert({
        id:               checkinId,
        athlete_id:       profileId,
        team_id:          teamId,
        mode:             "weekly",
        is_private:       true,
        emotional_score:  scores.emotional,
        resilience_score: scores.resilience,
        recovery_score:   scores.recovery,
        support_score:    scores.support,
        question_ids:     questionIds,
        responses:        responses,
        notes_private:    notes || null,
      });

      if (checkinErr) { setError(`Submission failed: ${checkinErr.message}`); setSubmitting(false); return; }

      // Insert question_usage (non-fatal)
      await supabase.from("question_usage").insert(
        questionIds.map(qid => ({
          athlete_id: profileId, question_id: qid,
          checkin_id: checkinId, used_at: new Date().toISOString(),
        }))
      );

      // Audit log (non-fatal)
      await supabase.from("audit_logs").insert({
        actor_profile_id: profileId,
        action: "checkin_submitted",
        target_type: "checkin",
        target_id: checkinId,
        metadata: { mode: "weekly", outreach_consent: consent ?? false },
      });

      setPillarScores(scores);
      setTriggerSupport(trigger);
    } catch (e) {
      setError(`An error occurred: ${String(e)}`);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <DashboardLayout role="athlete" userName={userName}>
        <div className="flex items-center justify-center h-64">
          <div className="h-5 w-5 rounded-full border-2 animate-spin"
               style={{ borderColor: "#e2e8f0", borderTopColor: "#047857" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout role="athlete" userName={userName}>
        <div className="max-w-lg mx-auto mt-8">
          <div className="rounded-2xl p-6 text-center"
               style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
            <p className="text-[14px] font-medium mb-1" style={{ color: "#f87171" }}>Couldn&apos;t load check-in questions.</p>
            <p className="text-[12px] font-mono mb-4" style={{ color: "#64748b" }}>{loadError}</p>
            <button onClick={loadQuestions} className="text-[13px] font-semibold" style={{ color: "#047857" }}>Retry</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (pillarScores) {
    return (
      <DashboardLayout role="athlete" userName={userName}>
        <ResultView pillarScores={pillarScores} triggerSupport={triggerSupport} onDone={() => router.push("/athlete/dashboard")} />
      </DashboardLayout>
    );
  }

  const isNotesStep    = currentQ >= questions.length && !showOutreachStep;
  const isOutreachStep = showOutreachStep;
  const question       = !isNotesStep && !isOutreachStep ? questions[currentQ] : null;
  const total          = questions.length + 1;
  const pct            = Math.round((currentQ / total) * 100);

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto space-y-4">

        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: OB.text }}>Weekly Check-In</h1>
          <p className="text-[13px] mt-0.5" style={{ color: OB.textMuted }}>Be honest. This is just for you.</p>
        </div>

        <div className="rounded-xl px-4 py-3" style={{ background: OB.raised, border: `1px solid ${OB.border}` }}>
          <p className="text-[12px] leading-relaxed" style={{ color: OB.textMuted }}>
            <strong style={{ color: OB.textSub }}>In crisis?</strong> Call or text <strong style={{ color: OB.textSub }}>988</strong> or call <strong style={{ color: OB.textSub }}>911</strong>. This app is a wellness tool, not a crisis service.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px]" style={{ color: OB.textMuted }}>{currentQ + 1} of {total}</span>
            <span className="text-[11px]" style={{ color: OB.textMuted }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: OB.borderSub }}>
            <div className="h-full rounded-full transition-all duration-300"
                 style={{ width: `${pct}%`, background: `linear-gradient(to right,#065f46,#047857)` }} />
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
          <div className="p-5">
            {isOutreachStep ? (
              <div className="space-y-5">
                <div className="flex items-center justify-center h-12 w-12 rounded-full mx-auto"
                     style={{ background: "#fef3c7" }}>
                  <Heart className="h-6 w-6" style={{ color: "#d97706" }} />
                </div>
                <div className="text-center">
                  <p className="text-[17px] font-semibold mb-1" style={{ color: OB.text }}>
                    Would it be OK for a counselor to reach out to you?
                  </p>
                  <p className="text-[13px] leading-relaxed" style={{ color: OB.textMuted }}>
                    Your coach will <strong style={{ color: OB.textSub }}>never</strong> be told. This is between you and a licensed counselor only.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => { setOutreachConsent(true); handleSubmit(true); }}
                    disabled={submitting}
                    className="flex flex-col items-center gap-1.5 py-4 rounded-xl font-semibold text-[14px] transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg,#065f46,#047857)", color: "#fff" }}
                  >
                    {submitting && outreachConsent === true
                      ? <span className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      : <>✓ Yes, please</>
                    }
                  </button>
                  <button
                    onClick={() => { setOutreachConsent(false); handleSubmit(false); }}
                    disabled={submitting}
                    className="flex flex-col items-center gap-1.5 py-4 rounded-xl font-semibold text-[14px] transition-all disabled:opacity-60"
                    style={{ background: OB.raised, border: `1px solid ${OB.border}`, color: OB.textSub }}
                  >
                    {submitting && outreachConsent === false
                      ? <span className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                      : <><X className="h-4 w-4 inline mr-1" />No thanks</>
                    }
                  </button>
                </div>
                {error && <p className="text-[13px] px-3 py-2 rounded-lg text-center" style={{ color: "#dc2626", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>{error}</p>}
              </div>
            ) : !isNotesStep && question ? (
              <div className="space-y-6">
                <div
                  className="inline-flex items-center px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-white"
                  style={{ background: PILLAR_TOP[question.pillar] }}
                >
                  {PILLAR_LABELS[question.pillar]}
                </div>

                <p className="text-[16px] font-semibold leading-snug" style={{ color: OB.text }}>{question.text}</p>

                <div>
                  <Slider
                    value={[responses[question.id] ?? 5]}
                    onValueChange={([v]) => setResponses(r => ({ ...r, [question.id]: v }))}
                    min={1} max={10} step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[11px] mt-1.5" style={{ color: OB.textMuted }}>
                    <span>Not at all</span>
                    <span>Completely</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 py-2">
                  <span className="text-[52px] font-bold tabular-nums leading-none"
                        style={{ color: valueColor(responses[question.id] ?? 5) }}>
                    {responses[question.id] ?? 5}
                  </span>
                  <span className="text-[14px] font-medium" style={{ color: OB.textMuted }}>{valueLabel(responses[question.id] ?? 5)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[16px] font-semibold mb-0.5" style={{ color: OB.text }}>Anything on your mind?</p>
                  <p className="text-[13px]" style={{ color: OB.textMuted }}>Optional · Private · Only you can see this.</p>
                </div>
                <textarea
                  placeholder="Write whatever you need to get off your chest..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={5}
                  className="w-full px-3.5 py-2.5 rounded-xl text-[14px] resize-none leading-relaxed focus:outline-none transition-colors"
                  style={{
                    background: OB.raised, border: `1px solid ${OB.border}`,
                    color: OB.textSub, caretColor: OB.green,
                  }}
                />
                {error && <p className="text-[13px] px-3 py-2 rounded-lg" style={{ color: "#dc2626", background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.15)" }}>{error}</p>}
              </div>
            )}
          </div>

          {!isOutreachStep && (
            <div className="flex items-center justify-between px-5 py-4" style={{ background: OB.raised, borderTop: `1px solid ${OB.borderSub}` }}>
              <button
                onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                disabled={currentQ === 0}
                className="flex items-center gap-1 h-9 px-3 text-[13px] font-medium rounded-lg transition-colors disabled:opacity-30"
                style={{ color: OB.textSub, border: `1px solid ${OB.border}` }}
              >
                <ChevronLeft className="h-4 w-4" />Back
              </button>

              {!isNotesStep ? (
                <button
                  onClick={() => setCurrentQ(q => q + 1)}
                  className="flex items-center gap-1 h-9 px-4 text-[13px] font-semibold text-white rounded-lg transition-opacity"
                  style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}
                >
                  Next<ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowOutreachStep(true)}
                  className="h-9 px-5 text-[13px] font-semibold text-white rounded-lg transition-opacity flex items-center gap-1.5"
                  style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}
                >
                  Next<ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400">
          About 3 minutes · Coaches never see individual responses
        </p>
      </div>
    </DashboardLayout>
  );
}
