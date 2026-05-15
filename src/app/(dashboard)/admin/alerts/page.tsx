"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, AlertTriangle, Clock, User, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const T = {
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
  organization_id: string | null;
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

// Low score = concerning (red). High score = healthy (green).
function scoreColor(val: number | null): string {
  if (val === null) return T.textMuted;
  if (val <= 3) return T.red;
  if (val <= 5) return T.amber;
  return T.green;
}

export default function AdminAlertsPage() {
  const router = useRouter();
  const [alerts,      setAlerts]      = useState<AlertWithDetails[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [profile,     setProfile]     = useState<{ full_name: string; role: string; id: string; organization_id: string | null } | null>(null);
  const [creatingFollowup, setCreatingFollowup] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, role, organization_id")
        .eq("auth_user_id", user.id)
        .single();
      if (prof) setProfile(prof);

      // Build query — filter by org if the user has one
      let query = supabase
        .from("alerts")
        .select(`id, severity, trigger_type, status, created_at, resolved_at, organization_id,
          athlete:profiles!alerts_athlete_id_fkey(id, full_name, team_id),
          checkin:checkins!alerts_checkin_id_fkey(emotional_score, resilience_score, recovery_score, support_score)`)
        .order("created_at", { ascending: false })
        .limit(100);

      // Scope to the admin's org if they have one (prevents cross-org data leakage)
      if (prof?.organization_id) {
        query = query.eq("organization_id", prof.organization_id);
      }

      const { data: alertData } = await query;
      if (alertData) setAlerts(alertData as unknown as AlertWithDetails[]);
      setLoading(false);

      // Real-time: subscribe to new alerts and status changes for this org
      const filter = prof?.organization_id
        ? `organization_id=eq.${prof.organization_id}`
        : undefined;
      const channel = supabase
        .channel("alerts-realtime")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "alerts", ...(filter ? { filter } : {}) },
          async (payload) => {
            // Fetch full alert with joins since realtime payload lacks joined fields
            const { data: newAlert } = await supabase
              .from("alerts")
              .select(`id, severity, trigger_type, status, created_at, resolved_at, organization_id,
                athlete:profiles!alerts_athlete_id_fkey(id, full_name, team_id),
                checkin:checkins!alerts_checkin_id_fkey(emotional_score, resilience_score, recovery_score, support_score)`)
              .eq("id", payload.new.id)
              .single();
            if (newAlert) setAlerts(prev => [newAlert as unknown as AlertWithDetails, ...prev]);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "alerts", ...(filter ? { filter } : {}) },
          (payload) => {
            setAlerts(prev => prev.map(a =>
              a.id === payload.new.id ? { ...a, status: payload.new.status, resolved_at: payload.new.resolved_at } : a
            ));
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
    let channelCleanup: (() => void) | undefined;
    load().then(fn => { channelCleanup = fn; });
    return () => { channelCleanup?.(); };
  }, []);

  const handleStatusChange = async (alertId: string, newStatus: "acknowledged" | "resolved") => {
    setActionError(null);
    const supabase = createClient();
    const update: Record<string, unknown> = { status: newStatus };
    if (newStatus === "resolved") update.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("alerts").update(update).eq("id", alertId);
    if (error) {
      setActionError(
        error.code === "42501"
          ? "Permission denied — your account may not have rights to update alerts."
          : (error.message ?? "Failed to update alert. Please try again.")
      );
      return;
    }
    setAlerts(prev => prev.map(a =>
      a.id === alertId
        ? { ...a, status: newStatus, ...(newStatus === "resolved" ? { resolved_at: new Date().toISOString() } : {}) }
        : a
    ));
    if (profile?.id) {
      await supabase.from("audit_logs").insert({
        actor_profile_id: profile.id,
        action: "update",
        target_type: "alert",
        target_id: alertId,
        metadata: { new_status: newStatus },
      });
    }
  };

  // Create a followup task for this alert then navigate to followups page
  const handleCreateFollowup = async (alert: AlertWithDetails) => {
    if (!profile?.id) return;
    setCreatingFollowup(alert.id);
    setActionError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("followups").insert({
        athlete_id:             alert.athlete.id,
        alert_id:               alert.id,
        assigned_to_profile_id: null,          // unassigned — admin assigns on followups page
        reason:                 alert.trigger_type === "wants_followup"
          ? "Athlete requested to be contacted"
          : "Risk score triggered alert",
        status: "open",
      });

      if (error) {
        setActionError(
          error.code === "42501"
            ? "Permission denied — your account may not have rights to create follow-ups."
            : (error.message ?? "Failed to create follow-up. Please try again.")
        );
        return;
      }

      // Acknowledge the alert so it's clear someone is handling it
      await supabase.from("alerts").update({ status: "acknowledged" }).eq("id", alert.id);
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, status: "acknowledged" } : a));
      await supabase.from("audit_logs").insert({
        actor_profile_id: profile.id,
        action: "create",
        target_type: "followup",
        target_id: alert.id,
        metadata: { from_alert: alert.id, trigger: alert.trigger_type },
      });
      router.push("/admin/followups");
    } finally {
      setCreatingFollowup(null);
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
          <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.green }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support" | "psychiatrist" | "trusted_adult") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div>
          <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>Alert Queue</h1>
          <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>
            {openAlerts.length} open alert{openAlerts.length !== 1 ? "s" : ""} requiring attention
          </p>
        </div>

        {/* Action error banner */}
        {actionError && (
          <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
               style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
            <span className="text-[13px] font-medium" style={{ color: "#991b1b" }}>{actionError}</span>
            <button onClick={() => setActionError(null)} style={{ color: "#991b1b" }}>
              <span className="text-[18px] leading-none">×</span>
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Open",         count: openAlerts.length,         color: T.red,   bg: "#fee2e2", icon: <AlertTriangle className="h-4 w-4" /> },
            { label: "Acknowledged", count: acknowledgedAlerts.length, color: T.amber, bg: "#fef3c7", icon: <Clock className="h-4 w-4" /> },
            { label: "Resolved",     count: resolvedAlerts.length,     color: T.green, bg: "#d1fae5", icon: <CheckCircle className="h-4 w-4" /> },
          ].map(item => (
            <div key={item.label} className="rounded-2xl p-4 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: item.bg, color: item.color }}>
                {item.icon}
              </div>
              <p className="text-[28px] font-bold tabular-nums leading-none" style={{ color: item.color }}>{item.count}</p>
              <p className="text-[11px] font-medium mt-1" style={{ color: T.textMuted }}>{item.label}</p>
            </div>
          ))}
        </div>

        {/* Alert list */}
        {alerts.length === 0 ? (
          <div className="rounded-2xl p-14 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#d1fae5" }}>
              <CheckCircle className="h-6 w-6" style={{ color: T.green }} />
            </div>
            <p className="text-[17px] font-semibold mb-1" style={{ color: T.text }}>All clear</p>
            <p className="text-[13px]" style={{ color: T.textMuted }}>No alerts at this time.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => {
              const isSevere   = alert.severity === "red";
              const isOpen     = alert.status === "open";
              const isResolved = alert.status === "resolved";
              const isWantsFollowup = alert.trigger_type === "wants_followup";
              const severityColor = isSevere ? T.red : T.amber;
              const severityBg    = isSevere ? "#fee2e2" : "#fef3c7";
              const statusLabel   = isOpen ? "Open" : alert.status === "acknowledged" ? "Acknowledged" : "Resolved";
              const statusColor   = isOpen ? T.red : isResolved ? T.green : T.amber;
              const isCreating    = creatingFollowup === alert.id;

              return (
                <div
                  key={alert.id}
                  className="rounded-2xl p-4"
                  style={{
                    background: isWantsFollowup && isOpen ? "#fffbeb" : T.surface,
                    border: `1px solid ${isOpen ? severityColor + "40" : T.border}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: severityBg }}>
                        <User className="h-4 w-4" style={{ color: severityColor }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[14px]" style={{ color: T.text }}>
                            {alert.athlete?.full_name || "Unknown Athlete"}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: severityBg, color: severityColor }}>
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: statusColor }}>{statusLabel}</span>
                        </div>

                        {/* Highlight athlete-requested outreach */}
                        {isWantsFollowup ? (
                          <p className="text-[12px] font-semibold mt-1" style={{ color: "#92400e" }}>
                            ✋ This athlete asked to be contacted by a counselor
                          </p>
                        ) : (
                          <p className="text-[12px] mt-1" style={{ color: T.textMuted }}>
                            Risk score triggered · {getTimeAgo(alert.created_at)}
                          </p>
                        )}
                        {isWantsFollowup && (
                          <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>
                            {getTimeAgo(alert.created_at)}
                          </p>
                        )}

                        {/* Pillar scores — low is bad, high is good */}
                        {alert.checkin && (
                          <div className="flex gap-3 mt-2 flex-wrap">
                            {[
                              { label: "Emotional",  val: alert.checkin.emotional_score },
                              { label: "Resilience", val: alert.checkin.resilience_score },
                              { label: "Recovery",   val: alert.checkin.recovery_score },
                              { label: "Support",    val: alert.checkin.support_score },
                            ].map(({ label, val }) => (
                              <div key={label} className="flex items-center gap-1 px-2 py-0.5 rounded-lg" style={{ background: T.raised }}>
                                <span className="text-[10px] font-medium" style={{ color: T.textMuted }}>{label}</span>
                                <span className="text-[11px] font-bold tabular-nums" style={{ color: scoreColor(val) }}>
                                  {val ?? "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 shrink-0">
                      {/* Primary action for wants_followup: create a followup task */}
                      {isWantsFollowup && !isResolved && (
                        <button
                          onClick={() => handleCreateFollowup(alert)}
                          disabled={isCreating}
                          className="h-8 px-3 text-[12px] font-semibold text-white rounded-lg transition-opacity disabled:opacity-60 flex items-center gap-1.5"
                          style={{ background: "linear-gradient(135deg, #92400e, #d97706)" }}
                        >
                          {isCreating
                            ? <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            : <><Plus className="h-3 w-3" />Assign follow-up</>}
                        </button>
                      )}

                      {isOpen && (
                        <button
                          onClick={() => handleStatusChange(alert.id, "acknowledged")}
                          className="h-8 px-3 text-[12px] font-semibold rounded-lg border transition-colors"
                          style={{ borderColor: T.border, color: T.textSub, background: T.raised }}
                        >
                          Acknowledge
                        </button>
                      )}
                      {!isResolved && (
                        <button
                          onClick={() => handleStatusChange(alert.id, "resolved")}
                          className="h-8 px-3 text-[12px] font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
                          style={{ background: `linear-gradient(135deg,#065f46,${T.green})` }}
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
