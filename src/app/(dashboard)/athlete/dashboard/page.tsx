"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Checkin, Profile, RiskLevel } from "@/types/database";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";
import {
  ClipboardCheck,
  BookOpen,
  Heart,
  TrendingUp,
  Smile,
  Frown,
  Meh,
} from "lucide-react";

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  green: {
    label: "You're doing well",
    color: "text-green-700",
    bgColor: "bg-green-50",
    icon: <Smile className="h-6 w-6 text-green-500" />,
  },
  yellow: {
    label: "Some areas need attention",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    icon: <Meh className="h-6 w-6 text-amber-500" />,
  },
  red: {
    label: "We're here for you",
    color: "text-red-700",
    bgColor: "bg-red-50",
    icon: <Frown className="h-6 w-6 text-red-500" />,
  },
};

export default function AthleteDashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [latestCheckin, setLatestCheckin] = useState<Checkin | null>(null);
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
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (profErr || !prof) { setError(true); return; }
      setProfile(prof);

      const { data: checkins, error: checkinErr } = await supabase
        .from("checkins")
        .select("*")
        .eq("athlete_id", prof.id)
        .order("completed_at", { ascending: false })
        .limit(1);

      if (checkinErr) { setError(true); return; }
      if (checkins && checkins.length > 0) setLatestCheckin(checkins[0]);
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
      <DashboardLayout role="athlete" userName="...">
        <ErrorState message="Couldn't load your dashboard. Check your connection and try again." onRetry={load} />
      </DashboardLayout>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] || "Athlete";
  const riskLevel = latestCheckin?.risk_level || "green";
  const riskInfo = RISK_CONFIG[riskLevel];

  const daysSinceCheckin = latestCheckin
    ? Math.floor(
        (Date.now() - new Date(latestCheckin.completed_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-4xl mx-auto">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Hey, {firstName}
          </h1>
          <p className="text-slate-500 mt-1">
            {daysSinceCheckin === null
              ? "Welcome! Start your first check-in."
              : daysSinceCheckin === 0
              ? "You checked in today. Nice work."
              : daysSinceCheckin <= 7
              ? `You last checked in ${daysSinceCheckin} day${daysSinceCheckin === 1 ? "" : "s"} ago.`
              : "It's been a while. How are you doing?"}
          </p>
        </div>

        {/* Status Card */}
        <Card className={`mb-6 border-0 ${riskInfo.bgColor}`}>
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              {riskInfo.icon}
              <div>
                <p className={`text-lg font-semibold ${riskInfo.color}`}>
                  {riskInfo.label}
                </p>
                {latestCheckin && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    Based on your latest check-in
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Latest Scores */}
        {latestCheckin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Mood", value: latestCheckin.mood_score },
              { label: "Stress", value: latestCheckin.stress_score },
              { label: "Sleep", value: latestCheckin.sleep_score },
              { label: "Support", value: latestCheckin.support_score },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="py-4 text-center">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {item.value}
                  </p>
                  <p className="text-xs text-slate-400">/10</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <Link href="/athlete/checkin">
              <Button size="lg" className="w-full text-base">
                <ClipboardCheck className="h-5 w-5 mr-2" />
                {latestCheckin ? "Start Weekly Check-In" : "Start Your First Check-In"}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/athlete/journal">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-4 flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Journal</span>
              </CardContent>
            </Card>
          </Link>
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
        </div>
      </div>
    </DashboardLayout>
  );
}
