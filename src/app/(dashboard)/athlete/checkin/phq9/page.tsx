"use client";

/**
 * PHQ-9 Depression Screening
 * ---------------------------------------------------------------------------
 * Presents all 9 PHQ-9 items with the validated 4-point response scale.
 * Computes the raw PHQ-9 total (0–27) for the clinically-scored result, and
 * maps answers to the 1–10 scale before submitting so the pillar-scoring
 * system stays consistent.
 *
 * Safety: Item 9 (self-harm) is handled with extra care — any response other
 * than "Not at all" triggers the crisis-resource overlay on the result screen,
 * and a score of 1 (Nearly every day) submits a raw value of 1 to the
 * emotional pillar, which will cross the <3 threshold and fire an alert.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { apiFetch } from "@/lib/api-url";
import type { Question } from "@/types/database";
import { phq9Severity, PHQ9_SEVERITY_LABEL } from "@/types/database";
import { CheckCircle, ChevronLeft, ChevronRight, AlertCircle, Phone, Shield } from "lucide-react";

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
  purple:    "#7c3aed",
  purpleLight: "#f5f3ff",
  purpleBorder: "#ddd6fe",
};

// PHQ-9 4-point response options
const PHQ9_OPTIONS = [
  { value: 0, label: "Not at all",             short: "Not at all"   },
  { value: 1, label: "Several days",           short: "Several days" },
  { value: 2, label: "More than half the days",short: "Half the days"},
  { value: 3, label: "Nearly every day",       short: "Nearly every day" },
] as const;

// Map raw PHQ-9 score (0–3) to the 1–10 pillar scale
// Not at all (0) → 10  |  Several days (1) → 7  |  Half days (2) → 4  |  Nearly every (3) → 1
function phq9ToScale(raw: 0 | 1 | 2 | 3): number {
  return [10, 7, 4, 1][raw];
}

// PHQ-9 severity color
function severityColor(total: number) {
  if (total <= 4)  return { color: T.green,   bg: "#f0fdf4", border: "#bbf7d0" };
  if (total <= 9)  return { color: "#d97706",  bg: "#fefce8", border: "#fde68a" };
  if (total <= 14) return { color: "#ea580c",  bg: "#fff7ed", border: "#fed7aa" };
  if (total <= 19) return { color: "#dc2626",  bg: "#fef2f2", border: "#fecaca" };
  return                  { color: "#9f1239",  bg: "#fff1f2", border: "#fecdd3" };
}

// ─── Result view ───────────────────────────────────────────────────────────────
function Phq9Result({
  total,
  safetyFlagged,
  onDone,
}: {
  total: number;
  safetyFlagged: boolean;
  onDone: () => void;
}) {
  const sev     = phq9Severity(total);
  const sevLabel= PHQ9_SEVERITY_LABEL[sev];
  const { color, bg, border } = severityColor(total);

  return (
    <div className="max-w-lg mx-auto space-y-4">

      {/* Safety item — shown if item 9 scored > 0 */}
      {safetyFlagged && (
        <div className="rounded-3xl p-5 space-y-3"
             style={{ background: "#fff1f2", border: "1px solid #fecdd3" }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#e11d48" }} />
            <div>
              <p className="text-[14px] font-bold" style={{ color: "#9f1239" }}>You don&apos;t have to carry this alone</p>
              <p className="text-[13px] mt-0.5 leading-relaxed" style={{ color: "#be123c" }}>
                You mentioned having some difficult thoughts. These are free, confidential, and available 24/7.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a href="tel:988"
               className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-center"
               style={{ background: "#fff", border: "1px solid #fecdd3" }}>
              <Phone className="h-4 w-4" style={{ color: "#e11d48" }} />
              <span className="text-[13px] font-bold" style={{ color: "#9f1239" }}>988</span>
              <span className="text-[10px]" style={{ color: "#be123c" }}>Call or Text</span>
            </a>
            <a href="sms:741741&body=HELLO"
               className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-center"
               style={{ background: "#fff", border: "1px solid #fecdd3" }}>
              <Phone className="h-4 w-4" style={{ color: "#e11d48" }} />
              <span className="text-[13px] font-bold" style={{ color: "#9f1239" }}>741741</span>
              <span className="text-[10px]" style={{ color: "#be123c" }}>Crisis Text Line</span>
            </a>
          </div>
        </div>
      )}

      {/* Score card */}
      <div className="rounded-3xl p-6 text-center"
           style={{ background: bg, border: `1px solid ${border}` }}>
        <div className="h-16 w-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
             style={{ background: color, boxShadow: `0 4px 16px ${color}44` }}>
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-[22px] font-bold mb-1" style={{ color: T.text }}>PHQ-9 Complete</h2>
        <p className="text-[14px] mb-5" style={{ color }}>Thanks for being honest with yourself.</p>

        {/* Score */}
        <div className="inline-flex flex-col items-center gap-1 px-8 py-4 rounded-2xl mb-4"
             style={{ background: T.surface, border: `1px solid ${border}` }}>
          <span className="text-[48px] font-bold tabular-nums leading-none" style={{ color }}>
            {total}
          </span>
          <span className="text-[13px] font-medium" style={{ color: T.textMuted }}>out of 27</span>
          <span className="text-[14px] font-bold mt-1 px-3 py-1 rounded-full"
                style={{ background: bg, color, border: `1px solid ${border}` }}>
            {sevLabel}
          </span>
        </div>

        {/* PHQ-9 severity scale */}
        <div className="text-left rounded-2xl overflow-hidden border mt-2"
             style={{ borderColor: border }}>
          {[
            { range: "0 – 4",   label: "None – Minimal",       threshold: 4  },
            { range: "5 – 9",   label: "Mild",                  threshold: 9  },
            { range: "10 – 14", label: "Moderate",              threshold: 14 },
            { range: "15 – 19", label: "Moderately Severe",     threshold: 19 },
            { range: "20 – 27", label: "Severe",                threshold: 27 },
          ].map((row, i) => {
            const active = total <= row.threshold && (i === 0 || total > [4,9,14,19][i-1]);
            return (
              <div key={row.label}
                   className="flex items-center justify-between px-4 py-2.5"
                   style={{
                     background: active ? bg : T.surface,
                     borderTop: i > 0 ? `1px solid ${border}` : undefined,
                   }}>
                <span className="text-[12px] font-mono" style={{ color: active ? color : T.textMuted }}>{row.range}</span>
                <span className="text-[12px] font-semibold" style={{ color: active ? color : T.textMuted }}>{row.label}</span>
                {active && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>You</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Guidance based on severity */}
      {total >= 10 && (
        <div className="rounded-3xl p-4 flex items-start gap-3"
             style={{ background: "#fefce8", border: "1px solid #fde68a" }}>
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "#92400e" }}>
              {total >= 15 ? "Consider reaching out to a counselor" : "Support is available"}
            </p>
            <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "#d97706" }}>
              {total >= 15
                ? "Your score suggests it would be helpful to talk with someone. You can request a confidential follow-up from your dashboard."
                : "Your score is in the moderate range. Talking to someone — a friend, counselor, or via 988 — can help."}
            </p>
          </div>
        </div>
      )}

      <p className="text-[11px] text-center px-4" style={{ color: T.textMuted }}>
        The PHQ-9 is a validated clinical screening tool, not a diagnosis.
        Share these results with a licensed professional for a full evaluation.
        Your scores are private — coaches never see them.
      </p>

      <button onClick={onDone}
              className="w-full flex items-center justify-center gap-2 py-4 font-bold text-[15px] rounded-2xl"
              style={{ background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})`, color: "#fff",
                       boxShadow: "0 4px 16px rgba(5,150,105,0.25)" }}>
        Back to Dashboard <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function Phq9CheckinPage() {
  const router = useRouter();
  const [userName,    setUserName]    = useState("...");
  const [questions,   setQuestions]   = useState<Question[]>([]);
  const [responses,   setResponses]   = useState<Record<string, 0|1|2|3>>({});
  const [currentQ,    setCurrentQ]    = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadError,   setLoadError]   = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState("");
  const [result,      setResult]      = useState<{ total: number; safetyFlagged: boolean } | null>(null);
  const loadCalled = useRef(false);

  const loadQuestions = useCallback(async () => {
    setLoading(true); setLoadError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: prof, error: profErr } = await supabase
        .from("profiles").select("full_name").eq("auth_user_id", user.id).single();
      if (profErr || !prof) { setLoadError("Profile not found."); setLoading(false); return; }
      setUserName(prof.full_name);

      // Load the 9 PHQ-9 questions ordered by phq9_item
      const { data: qs, error: qErr } = await supabase
        .from("questions")
        .select("*")
        .eq("active", true)
        .not("phq9_item", "is", null)
        .order("phq9_item", { ascending: true });

      if (qErr || !qs?.length) {
        setLoadError("PHQ-9 questions not found. Ask your admin to apply migration 027.");
        setLoading(false); return;
      }

      setQuestions(qs as Question[]);
      const init: Record<string, 0|1|2|3> = {};
      for (const q of qs) init[q.id] = 0;  // default: "Not at all"
      setResponses(init);
    } catch (e) { setLoadError(String(e)); }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (loadCalled.current) return;
    loadCalled.current = true;
    loadQuestions();
  }, [loadQuestions]);

  async function handleSubmit() {
    setSubmitting(true); setError("");
    try {
      // Compute PHQ-9 total (raw 0–3 sum)
      const phq9Total = Object.values(responses).reduce((acc: number, v) => acc + v, 0);

      // Map each response to 1–10 for pillar scoring
      const mappedResponses: Record<string, number> = {};
      for (const [qid, raw] of Object.entries(responses)) {
        mappedResponses[qid] = phq9ToScale(raw as 0|1|2|3);
      }

      // Check if safety item (phq9_item=9) was answered > 0
      const safetyQ = questions.find(q => q.phq9_item === 9);
      const safetyFlagged = safetyQ ? (responses[safetyQ.id] ?? 0) > 0 : false;

      const res = await apiFetch("/api/checkins", {
        method: "POST",
        body: JSON.stringify({
          mode: "phq9",
          responses: mappedResponses,
          phq9_total: phq9Total,
          wants_followup: false,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(`Submission failed: ${data.error ?? res.statusText}`);
        setSubmitting(false); return;
      }

      setResult({ total: phq9Total, safetyFlagged });
    } catch (e) { setError(`An error occurred: ${String(e)}`); }
    setSubmitting(false);
  }

  // ── Loading / error states ──────────────────────────────────────────────────
  if (loading) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin"
             style={{ borderColor: "#e2e8f0", borderTopColor: T.purple }} />
      </div>
    </DashboardLayout>
  );

  if (loadError) return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto mt-8">
        <div className="rounded-3xl p-6 text-center"
             style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <AlertCircle className="h-6 w-6 mx-auto mb-3" style={{ color: "#ef4444" }} />
          <p className="text-[14px] font-semibold mb-1" style={{ color: "#ef4444" }}>Couldn&apos;t load PHQ-9 questions.</p>
          <p className="text-[12px] font-mono mb-4" style={{ color: T.textMuted }}>{loadError}</p>
          <button onClick={loadQuestions} className="text-[13px] font-bold" style={{ color: T.purple }}>Retry</button>
        </div>
      </div>
    </DashboardLayout>
  );

  if (result) return (
    <DashboardLayout role="athlete" userName={userName}>
      <Phq9Result total={result.total} safetyFlagged={result.safetyFlagged} onDone={() => router.push("/athlete/dashboard")} />
    </DashboardLayout>
  );

  const question  = questions[currentQ];
  const isLast    = currentQ === questions.length - 1;
  const isSafety  = question?.phq9_item === 9;
  const current   = question ? (responses[question.id] ?? 0) : 0;
  const answered  = questions.filter(q => responses[q.id] !== undefined).length;
  const pct       = Math.round(((currentQ + 1) / questions.length) * 100);

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-xl flex items-center justify-center"
                 style={{ background: T.purpleLight }}>
              <Shield className="h-3.5 w-3.5" style={{ color: T.purple }} />
            </div>
            <h1 className="text-[20px] font-bold tracking-tight" style={{ color: T.text }}>
              PHQ-9 Screening
            </h1>
          </div>
          <p className="text-[13px]" style={{ color: T.textMuted }}>
            Over the last 2 weeks, how often have you been bothered by any of the following?
          </p>
        </div>

        {/* Crisis banner */}
        <div className="rounded-2xl px-4 py-3" style={{ background: T.raised, border: `1px solid ${T.border}` }}>
          <p className="text-[12px] leading-relaxed" style={{ color: T.textMuted }}>
            <strong style={{ color: T.textSub }}>In crisis?</strong> Call or text{" "}
            <strong style={{ color: T.textSub }}>988</strong> or call{" "}
            <strong style={{ color: T.textSub }}>911</strong>.
          </p>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium" style={{ color: T.textMuted }}>
              Question {currentQ + 1} of {questions.length}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: T.purple }}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: T.borderSub }}>
            <div className="h-full rounded-full transition-all duration-400"
                 style={{ width: `${pct}%`, background: `linear-gradient(to right, #5b21b6, ${T.purple})` }} />
          </div>
        </div>

        {/* Question card */}
        {question && (
          <div className="rounded-3xl overflow-hidden"
               style={{ background: T.surface, border: `1px solid ${isSafety ? "#fecdd3" : T.border}`,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>

            {/* Safety item banner */}
            {isSafety && (
              <div className="px-5 py-3 flex items-center gap-2"
                   style={{ background: "#fff1f2", borderBottom: "1px solid #fecdd3" }}>
                <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "#e11d48" }} />
                <p className="text-[11px] font-semibold" style={{ color: "#9f1239" }}>
                  If you&apos;re in crisis, call or text 988 — free and confidential, 24/7.
                </p>
              </div>
            )}

            {/* Pillar chip */}
            <div className="px-6 pt-6 pb-1">
              <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style={{ background: T.purpleLight, color: T.purple, border: `1px solid ${T.purpleBorder}` }}>
                PHQ-9 · Item {question.phq9_item}
              </span>
            </div>

            {/* Question text */}
            <div className="px-6 pt-3 pb-2">
              <p className="text-[17px] font-semibold leading-snug" style={{ color: T.text }}>
                {question.text}
              </p>
              {question.sub_text && (
                <p className="text-[13px] mt-2 leading-relaxed" style={{ color: T.textMuted }}>
                  {question.sub_text}
                </p>
              )}
            </div>

            {/* 4-point response buttons */}
            <div className="px-6 pb-6 pt-4 space-y-2.5">
              {PHQ9_OPTIONS.map(opt => {
                const selected = current === opt.value;
                return (
                  <button key={opt.value}
                          onClick={() => setResponses(r => ({ ...r, [question.id]: opt.value }))}
                          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all active:scale-[0.99]"
                          style={{
                            background: selected ? T.purpleLight : T.raised,
                            border:     `2px solid ${selected ? T.purple : T.border}`,
                            boxShadow:  selected ? `0 0 0 1px ${T.purple}22` : undefined,
                          }}>
                    {/* Radio dot */}
                    <div className="h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center"
                         style={{ borderColor: selected ? T.purple : "#cbd5e1",
                                  background:  selected ? T.purple : T.surface }}>
                      {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                    {/* Score dot (0–3) */}
                    <span className="text-[11px] font-bold tabular-nums w-4 text-center shrink-0"
                          style={{ color: selected ? T.purple : T.textMuted }}>
                      {opt.value}
                    </span>
                    <span className="text-[14px] font-medium flex-1" style={{ color: selected ? T.text : T.textSub }}>
                      {opt.label}
                    </span>
                    {selected && <CheckCircle className="h-4 w-4 shrink-0" style={{ color: T.purple }} />}
                  </button>
                );
              })}
            </div>

            {/* Nav row */}
            <div className="px-6 pb-6 flex items-center gap-3">
              <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                      disabled={currentQ === 0}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold border disabled:opacity-40 transition-colors"
                      style={{ background: T.surface, borderColor: T.border, color: T.textSub }}>
                <ChevronLeft className="h-4 w-4" /> Back
              </button>

              {isLast ? (
                <button onClick={handleSubmit}
                        disabled={submitting || answered < questions.length}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold text-white disabled:opacity-50 transition-opacity"
                        style={{ background: `linear-gradient(135deg, #5b21b6, ${T.purple})`,
                                 boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}>
                  {submitting
                    ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : <><CheckCircle className="h-4 w-4" /> Submit Screening</>}
                </button>
              ) : (
                <button onClick={() => setCurrentQ(q => Math.min(questions.length - 1, q + 1))}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold text-white transition-opacity"
                        style={{ background: `linear-gradient(135deg, #5b21b6, ${T.purple})`,
                                 boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}>
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl px-4 py-3" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <p className="text-[13px]" style={{ color: "#dc2626" }}>{error}</p>
          </div>
        )}

        <p className="text-[11px] text-center" style={{ color: T.textMuted }}>
          Your answers are private — coaches never see individual responses.
        </p>
      </div>
    </DashboardLayout>
  );
}
