"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Plus, X } from "lucide-react";

interface FollowupItem {
  id: string;
  athlete_id: string;
  athlete_name: string;
  alert_id: string;
  assigned_to_name: string | null;
  assigned_to_profile_id: string | null;
  reason: string;
  status: "open" | "in_progress" | "completed";
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
}

interface AlertForFollowup {
  id: string;
  severity: string;
  trigger_type: string;
  athlete_name: string;
  athlete_id: string;
  created_at: string;
}

interface StaffMember {
  id: string;
  full_name: string;
  role: string;
}

const STATUS_CONFIG = {
  open: { label: "Open", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  in_progress: { label: "In Progress", badge: "bg-teal-100 text-teal-700 border-teal-200" },
  completed: { label: "Completed", badge: "bg-green-100 text-green-700 border-green-200" },
};

export default function AdminFollowupsPage() {
  const [profile, setProfile] = useState<{ full_name: string; id: string; role: string; organization_id: string | null } | null>(null);
  const [followups, setFollowups] = useState<FollowupItem[]>([]);
  const [filter, setFilter] = useState<"active" | "completed" | "all">("active");
  const [loading, setLoading] = useState(true);

  // Create followup state
  const [showCreate, setShowCreate] = useState(false);
  const [alerts, setAlerts] = useState<AlertForFollowup[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  const loadFollowups = async () => {
    const supabase = createClient();

    const { data: followupData } = await supabase
      .from("followups")
      .select(`
        id,
        athlete_id,
        alert_id,
        assigned_to_profile_id,
        reason,
        status,
        due_date,
        created_at,
        completed_at,
        athlete:profiles!followups_athlete_id_fkey(full_name),
        assignee:profiles!followups_assigned_to_profile_id_fkey(full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (followupData) {
      const items: FollowupItem[] = followupData.map((f) => ({
        id: f.id,
        athlete_id: f.athlete_id,
        athlete_name: (f.athlete as unknown as { full_name: string })?.full_name || "Unknown",
        alert_id: f.alert_id,
        assigned_to_name: (f.assignee as unknown as { full_name: string })?.full_name || null,
        assigned_to_profile_id: f.assigned_to_profile_id,
        reason: f.reason,
        status: f.status as FollowupItem["status"],
        due_date: f.due_date,
        created_at: f.created_at,
        completed_at: f.completed_at,
      }));
      setFollowups(items);
    }
  };

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, role, organization_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!prof) return;
      setProfile(prof);

      await loadFollowups();

      // Get unresolved alerts (for create form)
      const { data: alertData } = await supabase
        .from("alerts")
        .select(`
          id,
          severity,
          trigger_type,
          created_at,
          athlete:profiles!alerts_athlete_id_fkey(id, full_name)
        `)
        .in("status", ["open", "acknowledged"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (alertData) {
        setAlerts(
          alertData.map((a) => ({
            id: a.id,
            severity: a.severity,
            trigger_type: a.trigger_type,
            athlete_name: (a.athlete as unknown as { full_name: string })?.full_name || "Unknown",
            athlete_id: (a.athlete as unknown as { id: string })?.id || "",
            created_at: a.created_at,
          }))
        );
      }

      // Get staff members (coaches, support, admin) in the org for assignment
      const { data: staffData } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("organization_id", prof.organization_id)
        .in("role", ["coach", "support", "admin"])
        .order("full_name");

      if (staffData) setStaff(staffData);

      setLoading(false);
    }
    load();
  }, []);

  const handleCreate = async () => {
    if (!selectedAlertId || !reason.trim()) return;
    setCreating(true);

    const supabase = createClient();
    const selectedAlert = alerts.find((a) => a.id === selectedAlertId);

    const { error } = await supabase.from("followups").insert({
      athlete_id: selectedAlert?.athlete_id,
      alert_id: selectedAlertId,
      assigned_to_profile_id: assignedTo || null,
      assigned_by_profile_id: profile?.id,
      reason: reason.trim(),
      status: "open",
      due_date: dueDate || null,
    });

    if (!error) {
      // Audit log
      await supabase.from("audit_logs").insert({
        actor_profile_id: profile?.id,
        action: "create",
        target_type: "followup",
        target_id: selectedAlertId,
        metadata: { alert_id: selectedAlertId, assigned_to: assignedTo || null },
      });

      await loadFollowups();
      setShowCreate(false);
      setSelectedAlertId("");
      setAssignedTo("");
      setReason("");
      setDueDate("");
    }
    setCreating(false);
  };

  const handleStatusChange = async (followupId: string, newStatus: "in_progress" | "completed") => {
    const supabase = createClient();
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    await supabase.from("followups").update(updateData).eq("id", followupId);

    setFollowups((prev) =>
      prev.map((f) =>
        f.id === followupId
          ? { ...f, status: newStatus, ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}) }
          : f
      )
    );

    await supabase.from("audit_logs").insert({
      actor_profile_id: profile?.id,
      action: "update",
      target_type: "followup",
      target_id: followupId,
      metadata: { new_status: newStatus },
    });
  };

  const filtered = followups.filter((f) => {
    if (filter === "active") return f.status !== "completed";
    if (filter === "completed") return f.status === "completed";
    return true;
  });

  const activeCount = followups.filter((f) => f.status !== "completed").length;
  const roleName = profile?.role === "support" ? "Support" : "Admin";

  if (loading) {
    return (
      <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading follow-ups...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Follow-ups</h1>
            <p className="text-slate-500 mt-1">
              {activeCount} active follow-up{activeCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showCreate ? "Cancel" : "Create Follow-up"}
          </Button>
        </div>

        {/* Create follow-up form */}
        {showCreate && (
          <Card className="mb-8 border-emerald-200 bg-emerald-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Create Follow-up from Alert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Alert</Label>
                <select
                  value={selectedAlertId}
                  onChange={(e) => setSelectedAlertId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select an alert...</option>
                  {alerts.map((alert) => (
                    <option key={alert.id} value={alert.id}>
                      {alert.athlete_name} — {alert.severity.toUpperCase()} ({alert.trigger_type}) — {new Date(alert.created_at).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Assign To</Label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Reason / Notes</Label>
                <Textarea
                  placeholder="Describe the follow-up action needed..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Due Date <span className="text-slate-400">(optional)</span></Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <Button
                onClick={handleCreate}
                disabled={!selectedAlertId || !reason.trim() || creating}
              >
                {creating ? "Creating..." : "Create Follow-up"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {(["active", "completed", "all"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "active" && activeCount > 0 && (
                <span className="ml-1.5 bg-white/20 rounded-full px-1.5 text-xs">
                  {activeCount}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Follow-up list */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-900">
                {filter === "active" ? "All caught up!" : "No follow-ups"}
              </p>
              <p className="text-slate-500 mt-1">
                {filter === "active"
                  ? "No active follow-ups at this time."
                  : "Create follow-ups from the alert queue."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((followup) => {
              const config = STATUS_CONFIG[followup.status];
              const isOverdue = followup.due_date && new Date(followup.due_date) < new Date() && followup.status !== "completed";

              return (
                <Card key={followup.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-900">
                            {followup.athlete_name}
                          </span>
                          <Badge variant="outline" className={config.badge}>
                            {config.label}
                          </Badge>
                          {isOverdue && (
                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{followup.reason}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                          <span>Created {new Date(followup.created_at).toLocaleDateString()}</span>
                          {followup.due_date && <span>Due {new Date(followup.due_date).toLocaleDateString()}</span>}
                          <span>
                            Assigned to: {followup.assigned_to_name || "Unassigned"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {followup.status === "open" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(followup.id, "in_progress")}
                          >
                            Start
                          </Button>
                        )}
                        {followup.status !== "completed" && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(followup.id, "completed")}
                          >
                            Complete
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
