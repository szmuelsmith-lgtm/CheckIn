"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { PILLAR_LABELS } from "@/lib/pillar-scoring";
import type { Pillar } from "@/types/database";
import Link from "next/link";
import {
  ClipboardCheck,
  TrendingUp,
  Heart,
  Zap,
  Shield,
  Users,
  Lock,
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

const PILLARS: Pillar[] = ["emotional", "resilience", "recovery", "support"];

interface LatestCheckin {
  completed_at: string;
  emotional_score: number | null;
  resilience_score: number | null;
  recovery_score: number | null;
  support_score: number | null;
  mode: string;
}

export default function AthleteDashboard() {
  const [userName, setUserName] = useState("...");
  const [firstName, setFirstName] = useState("Athlete");
  const [latestCheckin, setLatestCheckin] = useState<LatestCheckin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("auth_user_id", user.id)
        .single();

      if (profErr || !prof) { setError(true); return; }
      setUserName(prof.full_name);
      setFirstName(prof.full_name?.split(" ")[0] || "Athlete");

      const { data: checkins, error: checkinErr } = await supabase
        .from("checkins")
        .select("completed_at, emotional_score, resilience_score, recovery_score, support_score, mode")
        .eq("athlete_id", prof.id)
        .order("completed_at", { ascending: false })
        .limit(1);

      if (checkinErr) { setError(true); return; }
      if (checkins && checkins.length > 0) setLatestCheckin(checkins[0] as LatestCheckin);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <DashboardLayout role="athlete" userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="athlete" userName={userName}>
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <p className="text-red-700 mb-4">Couldn&apos;t load your dashboard.</p>
              <button onClick={load} className="text-sm text-red-600 hover:underline font-medium">Retry</button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const daysSinceCheckin = latestCheckin
    ? Math.floor((Date.now() - new Date(latestCheckin.completed_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const pillarScores: Record<Pillar, number | null> = {
    emotional:  latestCheckin?.emotional_score ?? null,
    resilience: latestCheckin?.resilience_score ?? null,
    recovery:   latestCheckin?.recovery_score ?? null,
    support:    latestCheckin?.support_score ?? null,
  };

  const hasScores = latestCheckin && PILLARS.some(p => pillarScores[p] !== null);

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-4xl mx-auto">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Hey, {firstName}</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {daysSinceCheckin === null
              ? "Welcome! Start your first check-in below."
              : daysSinceCheckin === 0
                ? "You checked in today. Keep it up."
                : daysSinceCheckin <= 7
                  ? `Last check-in ${daysSinceCheckin} day${daysSinceCheckin === 1 ? "" : "s"} ago.`
                  : "It's been a while — how are you doing?"}
          </p>
        </div>

        {/* Pillar scores */}
        {hasScores ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {PILLARS.map(pillar => {
              const score = pillarScores[pillar];
              const style = PILLAR_STYLE[pillar];
              const pct = score !== null ? Math.round((score / 10) * 100) : 0;
              return (
                <div key={pillar} className={`rounded-xl p-4 border ${style.bg} ${style.border}`}>
                  <div className={`flex items-center gap-1.5 mb-1 ${style.text}`}>
                    {PILLAR_ICONS[pillar]}
                    <p className="text-xs uppercase tracking-wide font-medium">{PILLAR_LABELS[pillar]}</p>
                  </div>
                  <p className={`text-2xl font-bold ${style.text}`}>
                    {score !== null ? score.toFixed(1) : "–"}
                  </p>
                  <div className="mt-2 h-1.5 bg-white/60 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">/ 10</p>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="mb-6 border-dashed border-slate-200">
            <CardContent className="py-8 text-center">
              <TrendingUp className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Your pillar scores will appear here after your first check-in.</p>
            </CardContent>
          </Card>
        )}

        {/* CTA buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <Link href="/athlete/checkin">
            <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Weekly Check-In
            </Button>
          </Link>
          <Link href="/athlete/checkin/screening">
            <Button size="lg" variant="outline" className="w-full gap-2 border-slate-300">
              <ClipboardList className="h-5 w-5 text-slate-500" />
              Mental Health Screening
            </Button>
          </Link>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/athlete/trends">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-4 flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">View Trends</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/athlete/resources">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-4 flex items-center gap-3">
                <Heart className="h-5 w-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Resources</span>
              </CardContent>
            </Card>
          </Link>
          <Link href="/athlete/privacy">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-4 flex items-center gap-3">
                <Lock className="h-5 w-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Privacy & Sharing</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Privacy note */}
        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <p className="text-xs text-emerald-800">
            <strong>Your data is private.</strong> Coaches only see anonymized team averages — never your individual responses.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
