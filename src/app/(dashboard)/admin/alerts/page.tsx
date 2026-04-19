"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, AlertTriangle, Clock, User } from "lucide-react";

const OB = {
  bg:        "#f8fafc",
  surface:   "#ffffff",
  raised:    "#f8fafc",
  border:    "#e8edf2",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#059669",
  red:       "#dc2626",
  amber:     "#d97706",
};

interface AlertWithDetails {
  id: string;
  severity: "yellow" | "red";
  trigger_type: string;
  status: "open" | "acknowledged" | "resolved";
  created_at: string;
  resolved_at: string | null;
  athlete: { id: string; full_name: string; team_id: string | null };
  checkin: {
    emotional_score: number | null; resilience_score: number | null;
    recovery_score: number | null;  support_score: number | null;
  } | null;
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminAlertsPage() {
  const [alerts, setAlerts]   = useState<AlertWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("full_name, role").eq("auth_user_id", user.id).single();
      if (prof) setProfile(prof);
      const { data: alertData } = await supabase
        .from("alerts")
        .select(`id, severity, trigger_type, status, created_at, resolved_at,
          athlete:profiles!alerts_athlete_id_fkey(id, full_name, team_id),
          checkin:checkins!alerts_checkin_id_fkey(emotional_score, resilience_score, recovery_score, support_score)`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (alertData) setAlerts(alertData as unknown as AlertWithDetails[]);
      setLoading(false);
    }
    load();
  }, []);

  const handleStatusChange = async (alertId: string, newStatus: "acknowledged" | "resolved") => {
    const supabase = createClient();
    const update: Record<string, unknown> = { status: newStatus };
    if (newStatus === "resolved") update.resolved_at = new Date().toISOString();
    await supabase.from("alerts").update(update).eq("id", alertId);
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: newStatus, ...(newStatus === "resolved" ? { resolved_at: new Date().toISOString() } : {}) } : a));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
      if (prof) await supabase.from("audit_logs").insert({ actor_profile_id: prof.id, action: "update", target_type: "alert", target_id: alertId, metadata: { new_status: newStatus } });
    }
  };

  const openAlerts         = alerts.filter(a => a.status === "open");
  const acknowledgedAlerts = alerts.filter(a => a.status === "acknowledged");
  const resolvedAlerts     = alerts.filter(a => a.status === "resolved");
  const roleName = profile?.role === "support" ? "Support" : "Admin";

  if (loading) {
    return (
      <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName="...">
        <div className="flex items-center justify-center h-64">
          <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: OB.border, borderTopColor: OB.green }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: OB.text }}>Alert Queue</h1>
          <p className="text-[13px] mt-0.5" style={{ color: OB.textMuted }}>
            {openAlerts.length} open alert{openAlerts.length !== 1 ? "s" : ""} requiring attention
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Open",         count: openAlerts.length,         color: OB.red,   bg: "#fee2e2", icon: <AlertTriangle className="h-4 w-4" /> },
            { label: "Acknowledged", count: acknowledgedAlerts.length, color: OB.amber, bg: "#fef3c7", icon: <Clock className="h-4 w-4" /> },
            { label: "Resolved",     count: resolvedAlerts.length,     color: OB.green, bg: "#d1fae5", icon: <CheckCircle className="h-4 w-4" /> },
          ].map(item => (
            <div key={item.label} className="rounded-2xl p-4 text-center" style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: item.bg, color: item.color }}>
                {item.icon}
              </div>
              <p className="text-[28px] font-bold tabular-nums leading-none" style={{ color: item.color }}>{item.count}</p>
              <p className="text-[11px] font-medium mt-1" style={{ color: OB.textMuted }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Alert list */}
        {alerts.length === 0 ? (
          <div className="rounded-2xl p-14 text-center" style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
            <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#d1fae5" }}>
              <CheckCircle className="h-6 w-6" style={{ color: OB.green }} />
            </div>
            <p className="text-[17px] font-semibold mb-1" style={{ color: OB.text }}>All clear</p>
            <p className="text-[13px]" style={{ color: OB.textMuted }}>No alerts at this time.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => {
              const isSevere  = alert.severity === "red";
              const isOpen    = alert.status === "open";
              const isResolved = alert.status === "resolved";
              const severityColor = isSevere ? OB.red : OB.amber;
              const severityBg    = isSevere ? "#fee2e2" : "#fef3c7";
              const statusLabel   = isOpen ? "Open" : alert.status === "acknowledged" ? "Acknowledged" : "Resolved";
              const statusColor   = isOpen ? OB.red : isResolved ? OB.green : OB.amber;

              return (
                <div key={alert.id} className="rounded-2xl p-4" style={{ background: OB.surface, border: `1px solid ${isOpen ? severityColor + "40" : OB.border}` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: severityBg }}>
                        <User className="h-4 w-4" style={{ color: severityColor }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[14px]" style={{ color: OB.text }}>{alert.athlete?.full_name || "Unknown Athlete"}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: severityBg, color: severityColor }}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: statusColor }}>{statusLabel}</span>
                        </div>
                        <p className="text-[12px] mt-1" style={{ color: OB.textMuted }}>
                          {alert.trigger_type === "wants_followup" ? "Requested follow-up" : "Risk score triggered"} · {getTimeAgo(alert.created_at)}
                        </p>
                        {alert.checkin && (
                          <div className="flex gap-3 mt-2 flex-wrap">
                            {[
                              { label: "Emotional",  val: alert.checkin.emotional_score },
                              { label: "Resilience", val: alert.checkin.resilience_score },
                              { label: "Recovery",   val: alert.checkin.recovery_score },
                              { label: "Support",    val: alert.checkin.support_score },
                            ].map(({ label, val }) => (
                              <div key={label} className="flex items-center gap-1 px-2 py-0.5 rounded-lg" style={{ background: OB.raised }}>
                                <span className="text-[10px] font-medium" style={{ color: OB.textMuted }}>{label}</span>
                                <span className="text-[11px] font-bold tabular-nums" style={{ color: val !== null && val > 7 ? OB.red : OB.textSub }}>{val ?? "—"}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0">
                      {isOpen && (
                        <button
                          onClick={() => handleStatusChange(alert.id, "acknowledged")}
                          className="h-8 px-3 text-[12px] font-semibold rounded-lg border transition-colors"
                          style={{ borderColor: OB.border, color: OB.textSub, background: OB.raised }}
                        >
                          Acknowledge
                        </button>
                      )}
                      {!isResolved && (
                        <button
                          onClick={() => handleStatusChange(alert.id, "resolved")}
                          className="h-8 px-3 text-[12px] font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
                          style={{ background: `linear-gradient(135deg,#065f46,${OB.green})` }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
