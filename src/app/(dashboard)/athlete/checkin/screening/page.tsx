"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Question, Pillar, PillarScores } from "@/types/database";
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Heart,
  Shield,
  Zap,
  Users,
  ClipboardList,
} from "lucide-react";

const PILLAR_ICONS: Record<Pillar, React.ReactNode> = {
  emotional:  <Heart className="h-4 w-4" />,
  resilience: <Zap className="h-4 w-4" />,
  recovery:   <Shield className="h-4 w-4" />,
  support:    <Users className="h-4 w-4" />,
};

const PILLAR_STYLE: Record<Pillar, { bg: string; text: string; border: string; bar: string }> = {
  emotional:  { bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200",  bar: "bg-emerald-500"  },
  resilience: { bg: "bg-blue-50",     text: "text-blue-700",     border: "border-blue-200",     bar: "bg-blue-500"     },
  recovery:   { bg: "bg-violet-50",   text: "text-violet-700",   border: "border-violet-200",   bar: "bg-violet-500"   },
  support:    { bg: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200",    bar: "bg-amber-500"    },
};

function valueLabel(v: number) {
  if (v <= 2) return "Struggling";
  if (v <= 4) return "Not great";
  if (v <= 6) return "Okay";
  if (v <= 8) return "Good";
  return "Thriving";
}

function valueColor(v: number) {
  if (v <= 3) return "text-red-500";
  if (v <= 5) return "text-amber-500";
  return "text-emerald-600";
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400">{current} of {total}</span>
        <span className="text-xs text-slate-400">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
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
    <div className="max-w-2xl mx-auto mt-8">
      <div className="text-center mb-8">
        <div className="inline-flex p-4 bg-emerald-50 rounded-full mb-4">
          <CheckCircle className="h-12 w-12 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Screening complete</h2>
        <p className="text-slate-500">Thank you for taking the time. Your honesty matters.</p>
      </div>

      {triggerSupport && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">We want to support you</p>
            <p className="text-sm text-amber-800 mt-0.5">
              Based on your responses, a support person — not your coach — may reach out soon. You can also text <strong>988</strong> anytime, day or night.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        {pillars.map((pillar) => {
          const score = pillarScores[pillar];
          const style = PILLAR_STYLE[pillar];
          const pct = Math.round((score / 10) * 100);
          return (
            <div key={pillar} className={`rounded-xl p-4 border ${style.bg} ${style.border}`}>
              <div className={`flex items-center gap-1.5 mb-1 ${style.text}`}>
                {PILLAR_ICONS[pillar]}
                <p className="text-xs uppercase tracking-wide font-medium">{PILLAR_LABELS[pillar]}</p>
              </div>
              <p className={`text-2xl font-bold ${style.text}`}>{score.toFixed(1)}</p>
              <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 text-center">
        <p className="text-xs text-slate-500">
          Your screening results are private. Licensed counselors with your consent can view them. Coaches never see individual data.
        </p>
      </div>

      <Button onClick={onDone} className="w-full" size="lg">Back to Dashboard</Button>
    </div>
  );
}

// Consent gate before screening
function ConsentGate({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="max-w-lg mx-auto mt-8">
      <div className="text-center mb-6">
        <div className="inline-flex p-3 bg-blue-50 rounded-full mb-3">
          <ClipboardList className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Mental Health Screening</h2>
        <p className="text-slate-500 text-sm">
          This is a deeper check-in covering all four pillars. It takes about 10 minutes.
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-5 pb-5 space-y-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Before you begin, please know:</p>
          <ul className="space-y-2 list-none">
            {[
              "Your responses are private by default — coaches never see them.",
              "You may choose to share your results with a counselor or trusted adult.",
              "This screening does not replace professional mental health care.",
              "If you are in crisis, please call or text 988 immediately.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0 mt-0.5 h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] flex items-center justify-center font-bold">{i + 1}</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onDecline} className="flex-1">
          Not right now
        </Button>
        <Button onClick={onAccept} className="flex-1">
          I understand — begin
        </Button>
      </div>
    </div>
  );
}

export default function ScreeningCheckinPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("...");
  const [phase, setPhase] = useState<"consent" | "questions" | "result">("consent");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pillarScores, setPillarScores] = useState<PillarScores | null>(null);
  const [triggerSupport, setTriggerSupport] = useState(false);
  const [error, setError] = useState("");

  // Load user name on mount
  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: prof } = await supabase
        .from("profiles").select("full_name").eq("auth_user_id", user.id).single();
      if (prof) setUserName(prof.full_name);
    }
    loadUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadQuestions() {
    setLoading(true);
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "screening" }),
    });
    if (res.ok) {
      const data = await res.json();
      const qs: Question[] = data.questions ?? [];
      setQuestions(qs);
      const initial: Record<string, number> = {};
      for (const q of qs) initial[q.id] = 5;
      setResponses(initial);
    } else {
      setError("Failed to load screening questions. Please try again.");
    }
    setLoading(false);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "screening", responses, notes: notes || null }),
      });
      if (!res.ok) {
        setError("Failed to submit. Please try again.");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setPillarScores(data.pillarScores);
      setTriggerSupport(data.triggerSupport ?? false);
      setPhase("result");
    } catch {
      setError("An error occurred. Please try again.");
    }
    setSubmitting(false);
  }

  const handleAcceptConsent = async () => {
    await loadQuestions();
    setPhase("questions");
  };

  if (phase === "consent") {
    return (
      <DashboardLayout role="athlete" userName={userName}>
        <ConsentGate
          onAccept={handleAcceptConsent}
          onDecline={() => router.push("/athlete/dashboard")}
        />
      </DashboardLayout>
    );
  }

  if (phase === "result" && pillarScores) {
    return (
      <DashboardLayout role="athlete" userName={userName}>
        <ResultCard
          pillarScores={pillarScores}
          triggerSupport={triggerSupport}
          onDone={() => router.push("/athlete/dashboard")}
        />
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout role="athlete" userName={userName}>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Preparing your screening...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isNotesStep = currentQ >= questions.length;
  const question = !isNotesStep ? questions[currentQ] : null;

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-slate-900">Mental Health Screening</h1>
          <p className="text-sm text-slate-500 mt-0.5">Answer honestly. There are no wrong answers.</p>
        </div>

        {/* Crisis banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Crisis?</strong> Call or text <strong>988</strong> or call <strong>911</strong>. This is a wellness tool, not a crisis service.
          </p>
        </div>

        <ProgressBar current={currentQ} total={questions.length + 1} />

        <Card>
          <CardContent className="pt-6 pb-6">
            {!isNotesStep && question ? (
              <div className="space-y-6">
                {/* Pillar badge */}
                {(() => {
                  const style = PILLAR_STYLE[question.pillar];
                  return (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${style.bg} ${style.text} ${style.border}`}>
                      {PILLAR_ICONS[question.pillar]}
                      {PILLAR_LABELS[question.pillar]}
                    </div>
                  );
                })()}

                <p className="text-base font-semibold text-slate-900 leading-snug">
                  {question.text}
                </p>

                {/* Slider */}
                <div>
                  <Slider
                    value={[responses[question.id] ?? 5]}
                    onValueChange={([v]) => setResponses(r => ({ ...r, [question.id]: v }))}
                    min={1} max={10} step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                    <span>Not at all</span>
                    <span>Completely</span>
                  </div>
                </div>

                {/* Value display */}
                <div className="flex items-center justify-center gap-3">
                  <span className={`text-4xl font-bold tabular-nums ${valueColor(responses[question.id] ?? 5)}`}>
                    {responses[question.id] ?? 5}
                  </span>
                  <span className="text-sm text-slate-400">{valueLabel(responses[question.id] ?? 5)}</span>
                </div>

                {/* Question counter within pillar */}
                <p className="text-xs text-slate-400 text-center">
                  Question {currentQ + 1} of {questions.length}
                </p>
              </div>
            ) : (
              // Notes step
              <div className="space-y-4">
                <div>
                  <p className="text-base font-semibold text-slate-900 mb-1">Final thoughts?</p>
                  <p className="text-sm text-slate-400">
                    Optional. Write anything you want. This is completely private.
                  </p>
                </div>
                <Textarea
                  placeholder="Is there anything else you want to share about how you've been feeling?"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentQ(q => Math.max(0, q - 1))}
                disabled={currentQ === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />Back
              </Button>

              {!isNotesStep ? (
                <Button
                  size="sm"
                  onClick={() => setCurrentQ(q => q + 1)}
                  className="gap-1"
                >
                  Next<ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6"
                >
                  {submitting ? "Submitting..." : "Submit Screening"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-5">
          About 10 minutes · Private by default · Licensed staff only with your consent
        </p>
      </div>
    </DashboardLayout>
  );
}
