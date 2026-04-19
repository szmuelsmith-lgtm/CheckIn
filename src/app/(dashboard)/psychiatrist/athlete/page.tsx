"use client";

// Uses ?id= query param instead of dynamic [id] segment for static export compatibility.
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { AlertCircle, ChevronDown, ChevronUp, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Pillar, ConsentScope } from "@/types/database";

const T = {
  surface:   "#ffffff",
  raised:    "#f0f9ff",
  border:    "#bae6fd",
  borderSub: "#e0f2fe",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  teal:      "#0d9488",
  tealDeep:  "#134e4a",
};

interface PillarScores {
  emotional: number;
  resilience: number;
  recovery: number;
  support: number;
}

interface QuestionResponse {
  question_text?: string;
  text?: string;
  pillar: Pillar;
  response_value: number;
}

interface CheckinEntry {
  id: string;
  completed_at: string;
  mode: string;
  pillar_scores: PillarScores;
  notes_private: string | null;
  responses: QuestionResponse[] | null;
}

interface AthleteData {
  athlete_name: string;
  scope: ConsentScope;
  granted_at: string;
  checkins: CheckinEntry[];
}

const PILLAR_STYLE: Record<Pillar, { bg: string; color: string; border: string }> = {
  emotional:  { bg: "#f0fdf4", color: "#047857", border: "#a7f3d0" },
  resilience: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  recovery:   { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  support:    { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
};

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

function PillarCard({ pillar, score }: { pillar: Pillar; score: number }) {
  const style = PILLAR_STYLE[pillar];
  const pct = Math.round((score / 10) * 100);
  return (
    <div className="rounded-2xl p-4" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
      <p className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: style.color }}>
        {PILLAR_LABELS[pillar]}
      </p>
      <p className="text-[24px] font-bold" style={{ color: style.color }}>{score.toFixed(1)}</p>
      <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.6)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: style.color, opacity: 0.6 }} />
      </div>
    </div>
  );
}

function CollapsibleResponses({ responses, notes }: { responses: QuestionResponse[] | null; notes: string | null }) {
  const [open, setOpen] = useState(false);
  if (!responses || responses.length === 0) return null;
  return (
    <div className="mt-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-[13px] font-semibold transition-colors"
        style={{ background: T.raised, color: T.textSub }}
      >
        <span>Individual Responses</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="px-4 py-3" style={{ background: T.surface }}>
          {responses.map((r, i) => (
            <div
              key={i}
              className="py-2.5 flex items-start justify-between gap-4"
              style={{ borderTop: i > 0 ? `1px solid ${T.borderSub}` : undefined }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px]" style={{ color: T.textSub }}>{r.question_text ?? r.text}</p>
                <p className="text-[11px] mt-0.5 capitalize" style={{ color: T.textMuted }}>{r.pillar}</p>
              </div>
              <span className="text-[13px] font-semibold shrink-0" style={{ color: T.text }}>{r.response_value}</span>
            </div>
          ))}
          {notes && (
            <div className="py-3" style={{ borderTop: `1px solid ${T.borderSub}` }}>
              <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: T.textMuted }}>Private Notes</p>
              <p className="text-[13px] italic" style={{ color: T.textSub }}>&ldquo;{notes}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AthleteView() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData]           = useState<AthleteData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError]         = useState(false);
  const [userName, setUserName]   = useState("...");

  useEffect(() => {
    if (!id) { setError(true); setLoading(false); return; }

    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError(true); setLoading(false); return; }

        const { data: prof } = await supabase.from("profiles").select("id, full_name").eq("auth_user_id", user.id).single();
        if (!prof) { setError(true); setLoading(false); return; }
        setUserName(prof.full_name);

        type ConsentResult = {
          scope: "summary" | "full";
          granted_at: string;
          athlete: { full_name: string }[] | { full_name: string } | null;
        };
        const { data: consent } = await supabase
          .from("consent_logs")
          .select("scope, granted_at, athlete:athlete_id(full_name)")
          .eq("target_profile_id", prof.id)
          .eq("athlete_id", id)
          .eq("is_active", true)
          .maybeSingle() as { data: ConsentResult | null };

        if (!consent) { setForbidden(true); setLoading(false); return; }

        const athleteObj = Array.isArray(consent.athlete) ? consent.athlete[0] : consent.athlete;

        const { data: checkins } = await supabase
          .from("checkins")
          .select("id, completed_at, mode, emotional_score, resilience_score, recovery_score, support_score, notes_private, responses, question_ids")
          .eq("athlete_id", id)
          .order("completed_at", { ascending: false })
          .limit(20);

        let questionMap: Record<string, { text: string; pillar: string }> = {};
        if (consent.scope === "full" && checkins && checkins.length > 0) {
          const allQIds = Array.from(new Set(checkins.flatMap((c: { question_ids?: string[] }) => c.question_ids ?? [])));
          if (allQIds.length > 0) {
            const { data: questions } = await supabase.from("questions").select("id, text, pillar").in("id", allQIds);
            questionMap = Object.fromEntries((questions ?? []).map((q: { id: string; text: string; pillar: string }) => [q.id, { text: q.text, pillar: q.pillar }]));
          }
        }

        const entries: CheckinEntry[] = (checkins ?? []).map((c: {
          id: string; completed_at: string; mode: string;
          emotional_score?: number; resilience_score?: number; recovery_score?: number; support_score?: number;
          notes_private?: string | null; responses?: Record<string, number> | null;
        }) => ({
          id: c.id, completed_at: c.completed_at, mode: c.mode,
          pillar_scores: {
            emotional: c.emotional_score ?? 5, resilience: c.resilience_score ?? 5,
            recovery: c.recovery_score ?? 5, support: c.support_score ?? 5,
          },
          notes_private: consent.scope === "full" ? (c.notes_private ?? null) : null,
          responses: consent.scope === "full" && c.responses
            ? Object.entries(c.responses).map(([qid, val]) => ({
                question_text: questionMap[qid]?.text ?? "Question",
                pillar: (questionMap[qid]?.pillar ?? "emotional") as Pillar,
                response_value: val as number,
              }))
            : null,
        }));

        setData({ athlete_name: athleteObj?.full_name ?? "Unknown", scope: consent.scope, granted_at: consent.granted_at, checkins: entries });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.teal }} />
      </div>
    </DashboardLayout>
  );

  if (forbidden) return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl p-14 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <Lock className="h-12 w-12 mx-auto mb-4" style={{ color: "#cbd5e1" }} />
          <p className="text-[17px] font-semibold mb-2" style={{ color: T.text }}>This patient has not shared data with you.</p>
          <p className="text-[13px] mb-6" style={{ color: T.textMuted }}>Access requires the patient to grant consent through their Check-In app.</p>
          <Link href="/psychiatrist/dashboard">
            <button className="h-9 px-5 text-[13px] font-semibold rounded-xl border transition-colors" style={{ borderColor: T.border, color: T.textSub, background: T.raised }}>
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );

  if (error || !data) return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl p-10 text-center" style={{ background: "#fff5f5", border: "1px solid #fca5a5", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color: "#dc2626" }} />
          <p className="text-[14px] mb-4" style={{ color: "#dc2626" }}>Failed to load patient data.</p>
          <Link href="/psychiatrist/dashboard" className="text-[13px] hover:underline" style={{ color: "#dc2626" }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );

  const grantedDate = new Date(data.granted_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href="/psychiatrist/dashboard"
          className="inline-flex items-center gap-2 text-[13px] transition-colors hover:opacity-70"
          style={{ color: T.textMuted }}
        >
          <ArrowLeft className="h-4 w-4" />Back to Dashboard
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>{data.athlete_name}</h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>Access granted {grantedDate}</p>
          </div>
          <span
            className="text-[11px] font-bold px-3 py-1.5 rounded-full"
            style={data.scope === "full"
              ? { background: "#f0fdfa", color: T.teal }
              : { background: "#e0f2fe", color: "#0369a1" }}
          >
            {data.scope === "full" ? "FULL REPORT" : "SUMMARY"}
          </span>
        </div>

        <div className="flex items-start gap-3 rounded-2xl p-4" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#b45309" }} />
          <p className="text-[13px]" style={{ color: "#92400e" }}>
            Viewing <strong>{data.scope === "full" ? "full clinical report" : "summary scores"}</strong>. This access is logged.
          </p>
        </div>

        {data.checkins.length === 0 ? (
          <div className="rounded-3xl p-12 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p className="text-[14px]" style={{ color: T.textMuted }}>No check-ins available for this patient.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[13px]" style={{ color: T.textMuted }}>
              {data.checkins.length} check-in{data.checkins.length !== 1 ? "s" : ""} on record
            </p>
            {data.checkins.map((checkin) => {
              const date = new Date(checkin.completed_at).toLocaleDateString("en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              });
              return (
                <div key={checkin.id} className="rounded-3xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <p className="text-[14px] font-semibold" style={{ color: T.text }}>{date}</p>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={checkin.mode === "screening"
                        ? { background: "#f0fdfa", color: T.teal }
                        : { background: T.borderSub, color: T.textMuted }}
                    >
                      {checkin.mode === "screening" ? "Screening" : "Weekly"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PILLARS.map(pillar => (
                      <PillarCard key={pillar} pillar={pillar} score={checkin.pillar_scores[pillar]} />
                    ))}
                  </div>
                  {data.scope === "full" && (
                    <CollapsibleResponses responses={checkin.responses} notes={checkin.notes_private} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function PsychiatristAthletePage() {
  return (
    <Suspense fallback={
      <DashboardLayout role="psychiatrist" userName="...">
        <div className="flex items-center justify-center h-64">
          <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.teal }} />
        </div>
      </DashboardLayout>
    }>
      <AthleteView />
    </Suspense>
  );
}
