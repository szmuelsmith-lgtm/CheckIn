"use client";

// Uses ?id= query param instead of dynamic [id] segment for static export compatibility.
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronDown, ChevronUp, ArrowLeft, Lock } from "lucide-react";
import Link from "next/link";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Pillar, ConsentScope } from "@/types/database";

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
  emotional_score?: number;
  resilience_score?: number;
  recovery_score?: number;
  support_score?: number;
  notes_private: string | null;
  responses: QuestionResponse[] | null;
}

interface AthleteData {
  athlete_name: string;
  scope: ConsentScope;
  granted_at: string;
  checkins: CheckinEntry[];
}

const PILLAR_STYLE: Record<Pillar, { bg: string; text: string; border: string }> = {
  emotional:  { bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200" },
  resilience: { bg: "bg-blue-50",     text: "text-blue-700",     border: "border-blue-200" },
  recovery:   { bg: "bg-violet-50",   text: "text-violet-700",   border: "border-violet-200" },
  support:    { bg: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200" },
};

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

function PillarCard({ pillar, score }: { pillar: Pillar; score: number }) {
  const style = PILLAR_STYLE[pillar];
  const pct = Math.round((score / 10) * 100);
  return (
    <div className={`rounded-xl p-4 border ${style.bg} ${style.border}`}>
      <p className={`text-xs uppercase tracking-wide font-medium mb-1 ${style.text}`}>
        {PILLAR_LABELS[pillar]}
      </p>
      <p className={`text-2xl font-bold ${style.text}`}>{score.toFixed(1)}</p>
      <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${style.text.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CollapsibleResponses({ responses, notes }: { responses: QuestionResponse[] | null; notes: string | null }) {
  const [open, setOpen] = useState(false);
  if (!responses || responses.length === 0) return null;
  return (
    <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-sm font-medium text-slate-700"
      >
        <span>Individual Responses</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="px-4 py-3 divide-y divide-slate-100">
          {responses.map((r, i) => (
            <div key={i} className="py-2.5 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{r.question_text ?? r.text}</p>
                <p className="text-xs text-slate-400 mt-0.5 capitalize">{r.pillar}</p>
              </div>
              <span className="text-sm font-semibold text-slate-900 shrink-0">{r.response_value}</span>
            </div>
          ))}
          {notes && (
            <div className="py-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Private Notes</p>
              <p className="text-sm text-slate-700 italic">&ldquo;{notes}&rdquo;</p>
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
  const [data, setData] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState(false);
  const [userName, setUserName] = useState("...");

  useEffect(() => {
    if (!id) { setError(true); setLoading(false); return; }
    async function load() {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase.from("profiles").select("full_name").eq("auth_user_id", user.id).single();
          if (prof) setUserName(prof.full_name);
        }

        const res = await fetch(`/api/psychiatrist/athlete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (res.status === 403) { setForbidden(true); return; }
        if (!res.ok) { setError(true); return; }
        setData(await res.json());
      } catch { setError(true); }
      finally { setLoading(false); }
    }
    load();
  }, [id]);

  if (loading) return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="flex items-center justify-center h-64"><p className="text-slate-500">Loading...</p></div>
    </DashboardLayout>
  );

  if (forbidden) return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-3xl mx-auto">
        <Card><CardContent className="py-16 text-center">
          <Lock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-900">This athlete has not shared data with you.</p>
          <p className="text-slate-500 mt-2 text-sm">Access requires the athlete to grant consent through their Check-In app.</p>
          <Link href="/psychiatrist/dashboard" className="mt-6 inline-block"><Button variant="outline">Back</Button></Link>
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );

  if (error || !data) return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-3xl mx-auto">
        <Card className="border-red-200 bg-red-50"><CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-700">Failed to load data.</p>
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );

  const grantedDate = new Date(data.granted_at).toLocaleDateString();

  return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-4xl mx-auto">
        <Link href="/psychiatrist/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to Dashboard
        </Link>

        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">{data.athlete_name}</h1>
        </div>

        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Viewing <strong>{data.scope === "full" ? "full report" : "summary"}</strong> — shared {grantedDate}. Access is logged.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Badge variant="outline" className={data.scope === "full" ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
            {data.scope === "full" ? "FULL REPORT" : "SUMMARY"}
          </Badge>
          <span className="text-sm text-slate-500">{data.checkins.length} check-in{data.checkins.length !== 1 ? "s" : ""}</span>
        </div>

        {data.checkins.length === 0 && (
          <Card><CardContent className="py-12 text-center"><p className="text-slate-500">No check-ins shared yet.</p></CardContent></Card>
        )}

        <div className="space-y-6">
          {data.checkins.map((checkin) => {
            const scores: PillarScores = checkin.pillar_scores ?? {
              emotional:  checkin.emotional_score  ?? 5,
              resilience: checkin.resilience_score ?? 5,
              recovery:   checkin.recovery_score   ?? 5,
              support:    checkin.support_score     ?? 5,
            };
            const date = new Date(checkin.completed_at).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
            return (
              <Card key={checkin.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base">{date}</CardTitle>
                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-600 border-slate-200">
                      {checkin.mode === "screening" ? "Screening" : "Weekly"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PILLARS.map(pillar => <PillarCard key={pillar} pillar={pillar} score={scores[pillar]} />)}
                  </div>
                  {data.scope === "full" && <CollapsibleResponses responses={checkin.responses} notes={checkin.notes_private} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function PsychiatristAthletePage() {
  return (
    <Suspense fallback={<DashboardLayout role="psychiatrist" userName="..."><div className="flex items-center justify-center h-64"><p className="text-slate-500">Loading...</p></div></DashboardLayout>}>
      <AthleteView />
    </Suspense>
  );
}
