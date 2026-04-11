"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stethoscope, AlertCircle, Users } from "lucide-react";
import Link from "next/link";

interface SharedAthlete {
  athlete_id: string;
  athlete_name: string;
  scope: "summary" | "full";
  last_checkin_at: string | null;
  granted_at: string;
  expires_at: string | null;
}

export default function PsychiatristDashboard() {
  const [athletes, setAthletes] = useState<SharedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState("...");

  useEffect(() => {
    async function load() {
      try {
        // Get user name from profile
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("auth_user_id", user.id)
            .single();
          if (prof) setUserName(prof.full_name);
        }

        const res = await fetch("/api/psychiatrist/athletes", { method: "POST" });
        if (!res.ok) {
          setError("Failed to load athlete data.");
          return;
        }
        const data = await res.json();
        setAthletes(data.athletes || []);
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="psychiatrist" userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading your athletes...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="psychiatrist" userName={userName}>
        <div className="max-w-3xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="psychiatrist" userName={userName}>
      <div className="max-w-4xl mx-auto">
        {/* Important banner */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>You are viewing shared data only.</strong> Access is logged and athletes can revoke access at any time.
          </p>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Stethoscope className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Athletes</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              You are viewing data that athletes have chosen to share with you.
            </p>
          </div>
        </div>

        {/* Empty state */}
        {athletes.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-900">No athletes have shared data with you yet.</p>
              <p className="text-slate-500 mt-2 text-sm max-w-sm mx-auto">
                When an athlete grants you access through Check-In, they will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {athletes.map((athlete) => {
              const grantedDate = new Date(athlete.granted_at).toLocaleDateString();
              const expiresDate = athlete.expires_at
                ? new Date(athlete.expires_at).toLocaleDateString()
                : null;
              const lastCheckin = athlete.last_checkin_at
                ? new Date(athlete.last_checkin_at).toLocaleDateString()
                : "No check-ins yet";

              const isExpired = athlete.expires_at
                ? new Date(athlete.expires_at) < new Date()
                : false;

              return (
                <Card key={athlete.athlete_id} className={isExpired ? "opacity-60" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{athlete.athlete_name}</CardTitle>
                      <Badge
                        variant="outline"
                        className={
                          athlete.scope === "full"
                            ? "bg-violet-50 text-violet-700 border-violet-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }
                      >
                        {athlete.scope === "full" ? "FULL REPORT" : "SUMMARY"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Last Check-In</p>
                        <p className="text-slate-700 font-medium">{lastCheckin}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Access Granted</p>
                        <p className="text-slate-700 font-medium">{grantedDate}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Expires</p>
                        <p className={`font-medium ${isExpired ? "text-red-600" : "text-slate-700"}`}>
                          {expiresDate ? (isExpired ? `Expired ${expiresDate}` : expiresDate) : "No expiry"}
                        </p>
                      </div>
                    </div>
                    {!isExpired && (
                      <Link href={`/psychiatrist/athlete?id=${athlete.athlete_id}`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          View Check-Ins
                        </Button>
                      </Link>
                    )}
                    {isExpired && (
                      <p className="text-xs text-slate-400 italic">Access has expired. The athlete can renew access.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
