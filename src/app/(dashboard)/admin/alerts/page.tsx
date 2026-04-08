"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle } from "lucide-react";

interface AlertWithDetails {
  id: string;
  severity: "yellow" | "red";
  trigger_type: string;
  status: "open" | "acknowledged" | "resolved";
  created_at: string;
  resolved_at: string | null;
  athlete: {
    id: string;
    full_name: string;
    team_id: string | null;
  };
  checkin: {
    mood_score: number;
    stress_score: number;
    sleep_score: number;
    support_score: number;
  };
}

const SEVERITY_STYLES = {
  red: { badge: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  yellow: { badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
};

const STATUS_STYLES = {
  open: { label: "Open", color: "text-red-600" },
  acknowledged: { label: "Acknowledged", color: "text-amber-600" },
  resolved: { label: "Resolved", color: "text-green-600" },
};

export default function AdminAlertsPage() {
  const [alerts, setAlerts] = useState<AlertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("auth_user_id", user.id)
        .single();

      if (prof) setProfile(prof);

      const { data: alertData } = await supabase
        .from("alerts")
        .select(`
          id,
          severity,
          trigger_type,
          status,
          created_at,
          resolved_at,
          athlete:profiles!alerts_athlete_id_fkey(id, full_name, team_id),
          checkin:checkins!alerts_checkin_id_fkey(mood_score, stress_score, sleep_score, support_score)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (alertData) {
        setAlerts(alertData as unknown as AlertWithDetails[]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleStatusChange = async (alertId: string, newStatus: "acknowledged" | "resolved") => {
    const supabase = createClient();
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }

    await supabase.from("alerts").update(updateData).eq("id", alertId);

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, status: newStatus, ...(newStatus === "resolved" ? { resolved_at: new Date().toISOString() } : {}) } : a
      )
    );

    // Audit log
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (prof) {
        await supabase.from("audit_logs").insert({
          actor_profile_id: prof.id,
          action: "update",
          target_type: "alert",
          target_id: alertId,
          metadata: { new_status: newStatus },
        });
      }
    }
  };

  const openAlerts = alerts.filter((a) => a.status === "open");
  const acknowledgedAlerts = alerts.filter((a) => a.status === "acknowledged");
  const resolvedAlerts = alerts.filter((a) => a.status === "resolved");

  const roleName = profile?.role === "support" ? "Support" : "Admin";

  if (loading) {
    return (
      <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading alerts...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Alert Queue</h1>
          <p className="text-slate-500 mt-1">
            {openAlerts.length} open alert{openAlerts.length !== 1 ? "s" : ""} requiring attention
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-red-600">{openAlerts.length}</p>
              <p className="text-sm text-slate-500">Open</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{acknowledgedAlerts.length}</p>
              <p className="text-sm text-slate-500">Acknowledged</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-green-600">{resolvedAlerts.length}</p>
              <p className="text-sm text-slate-500">Resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert list */}
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-900">All clear</p>
              <p className="text-slate-500">No alerts at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const severityStyle = SEVERITY_STYLES[alert.severity];
              const statusStyle = STATUS_STYLES[alert.status];
              const timeAgo = getTimeAgo(alert.created_at);

              return (
                <Card key={alert.id} className="overflow-hidden">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${severityStyle.dot}`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-900">
                              {alert.athlete?.full_name || "Unknown Athlete"}
                            </span>
                            <Badge variant="outline" className={severityStyle.badge}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <span className={`text-xs font-medium ${statusStyle.color}`}>
                              {statusStyle.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">
                            Trigger: {alert.trigger_type === "wants_followup" ? "Requested follow-up" : "Risk score"}{" "}
                            &middot; {timeAgo}
                          </p>
                          {alert.checkin && (
                            <div className="flex gap-4 mt-2 text-xs text-slate-400">
                              <span>Mood: {alert.checkin.mood_score}</span>
                              <span>Stress: {alert.checkin.stress_score}</span>
                              <span>Sleep: {alert.checkin.sleep_score}</span>
                              <span>Support: {alert.checkin.support_score}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {alert.status === "open" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(alert.id, "acknowledged")}
                          >
                            Acknowledge
                          </Button>
                        )}
                        {alert.status !== "resolved" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(alert.id, "resolved")}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
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

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
