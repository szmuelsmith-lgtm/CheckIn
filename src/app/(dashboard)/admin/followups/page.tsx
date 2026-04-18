"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Plus, X, User, Calendar, Clock } from "lucide-react";

const OB = {
  bg:        "#f8fafc",
  surface:   "#ffffff",
  raised:    "#f8fafc",
  border:    "#e2e8f0",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#047857",
  red:       "#dc2626",
  amber:     "#d97706",
};

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

interface StaffMember { id: string; full_name: string; role: string; }

const STATUS_CONFIG = {
  open:        { label: "Open",        color: OB.amber,     bg: "#fef3c7" },
  in_progress: { label: "In Progress", color: "#2563eb",    bg: "#dbeafe" },
  completed:   { label: "Completed",   color: OB.green,     bg: "#d1fae5" },
};

export default function AdminFollowupsPage() {
  const [profile, setProfile]       = useState<{ full_name: string; id: string; role: string; organization_id: string | null } | null>(null);
  const [followups, setFollowups]   = useState<FollowupItem[]>([]);
  const [filter, setFilter]         = useState<"active" | "completed" | "all">("active");
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [alerts, setAlerts]         = useState<AlertForFollowup[]>([]);
  const [staff, setStaff]           = useState<StaffMember[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [reason, setReason]         = useState("");
  const [dueDate, setDueDate]       = useState("");
  const [creating, setCreating]     = useState(false);

  const loadFollowups = async () => {
    const supabase = createClient();
    const { data: followupData } = await supabase
      .from("followups")
      .select(`id, athlete_id, alert_id, assigned_to_profile_id, reason, status, due_date, created_at, completed_at,
        athlete:profiles!followups_athlete_id_fkey(full_name),
        assignee:profiles!followups_assigned_to_profile_id_fkey(full_name)`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (followupData) {
      setFollowups(followupData.map(f => ({
        id: f.id, athlete_id: f.athlete_id, alert_id: f.alert_id,
        assigned_to_profile_id: f.assigned_to_profile_id,
        athlete_name: (f.athlete as unknown as { full_name: string })?.full_name || "Unknown",
        assigned_to_name: (f.assignee as unknown as { full_name: string })?.full_name || null,
        reason: f.reason, status: f.status as FollowupItem["status"],
        due_date: f.due_date, created_at: f.created_at, completed_at: f.completed_at,
      })));
    }
  };

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("id, full_name, role, organization_id").eq("auth_user_id", user.id).single();
      if (!prof) return;
      setProfile(prof);
      await loadFollowups();
      const { data: alertData } = await supabase
        .from("alerts")
        .select(`id, severity, trigger_type, created_at, athlete:profiles!alerts_athlete_id_fkey(id, full_name)`)
        .in("status", ["open", "acknowledged"]).order("created_at", { ascending: false }).limit(50);
      if (alertData) {
        setAlerts(alertData.map(a => ({
          id: a.id, severity: a.severity, trigger_type: a.trigger_type,
          athlete_name: (a.athlete as unknown as { full_name: string })?.full_name || "Unknown",
          athlete_id: (a.athlete as unknown as { id: string })?.id || "", created_at: a.created_at,
        })));
      }
      const { data: staffData } = await supabase.from("profiles").select("id, full_name, role")
        .eq("organization_id", prof.organization_id).in("role", ["coach", "support", "admin"]).order("full_name");
      if (staffData) setStaff(staffData);
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!selectedAlertId || !reason.trim()) return;
    setCreating(true);
    const supabase = createClient();
    const selectedAlert = alerts.find(a => a.id === selectedAlertId);
    const { error } = await supabase.from("followups").insert({
      athlete_id: selectedAlert?.athlete_id, alert_id: selectedAlertId,
      assigned_to_profile_id: assignedTo || null, assigned_by_profile_id: profile?.id,
      reason: reason.trim(), status: "open", due_date: dueDate || null,
    });
    if (!error) {
      await supabase.from("audit_logs").insert({ actor_profile_id: profile?.id, action: "create", target_type: "followup", target_id: selectedAlertId, metadata: { alert_id: selectedAlertId, assigned_to: assignedTo || null } });
      await loadFollowups();
      setShowCreate(false); setSelectedAlertId(""); setAssignedTo(""); setReason(""); setDueDate("");
    }
    setCreating(false);
  };

  const handleStatusChange = async (followupId: string, newStatus: "in_progress" | "completed") => {
    const supabase = createClient();
    const update: Record<string, unknown> = { status: newStatus };
    if (newStatus === "completed") update.completed_at = new Date().toISOString();
    await supabase.from("followups").update(update).eq("id", followupId);
    setFollowups(prev => prev.map(f => f.id === followupId ? { ...f, status: newStatus, ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}) } : f));
    await supabase.from("audit_logs").insert({ actor_profile_id: profile?.id, action: "update", target_type: "followup", target_id: followupId, metadata: { new_status: newStatus } });
  };

  const filtered = followups.filter(f => {
    if (filter === "active") return f.status !== "completed";
    if (filter === "completed") return f.status === "completed";
    return true;
  });
  const activeCount = followups.filter(f => f.status !== "completed").length;
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

  const inputCls = "w-full h-10 px-3.5 rounded-lg border text-[13px] bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors";

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: OB.text }}>Follow-ups</h1>
            <p className="text-[13px] mt-0.5" style={{ color: OB.textMuted }}>{activeCount} active follow-up{activeCount !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold rounded-xl transition-all"
            style={showCreate ? { border: `1px solid ${OB.border}`, color: OB.textSub, background: OB.raised } : { background: "linear-gradient(135deg,#065f46,#047857)", color: "#fff" }}
          >
            {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreate ? "Cancel" : "Create Follow-up"}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#065f46" }}>Create Follow-up from Alert</p>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: OB.textSub }}>Alert</label>
                <select value={selectedAlertId} onChange={e => setSelectedAlertId(e.target.value)}
                  className={inputCls} style={{ borderColor: OB.border, color: OB.text }}>
                  <option value="">Select an alert…</option>
                  {alerts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.athlete_name} — {a.severity.toUpperCase()} ({a.trigger_type}) — {new Date(a.created_at).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: OB.textSub }}>Assign To</label>
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                  className={inputCls} style={{ borderColor: OB.border, color: OB.text }}>
                  <option value="">Unassigned</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: OB.textSub }}>Reason / Notes</label>
                <textarea
                  placeholder="Describe the follow-up action needed..."
                  value={reason} onChange={e => setReason(e.target.value)} rows={3}
                  className="w-full px-3.5 py-2.5 rounded-lg border text-[13px] bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors resize-none"
                  style={{ borderColor: OB.border, color: OB.text }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: OB.textSub }}>Due Date <span style={{ color: OB.textMuted, fontWeight: 400 }}>(optional)</span></label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className={inputCls} style={{ borderColor: OB.border, color: OB.text }} />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={!selectedAlertId || !reason.trim() || creating}
              className="h-9 px-5 text-[13px] font-semibold text-white rounded-xl disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}
            >
              {creating ? "Creating…" : "Create Follow-up"}
            </button>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["active", "completed", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="h-8 px-3 text-[12px] font-semibold rounded-full border transition-all"
              style={filter === f
                ? { background: "linear-gradient(135deg,#065f46,#047857)", color: "#fff", borderColor: "transparent" }
                : { background: OB.surface, color: OB.textMuted, borderColor: OB.border }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === "active" && activeCount > 0 && (
                <span className="ml-1.5 px-1.5 text-[10px] font-bold rounded-full" style={{ background: "rgba(255,255,255,0.25)" }}>
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Follow-up list */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl p-14 text-center" style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
            <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#d1fae5" }}>
              <CheckCircle className="h-6 w-6" style={{ color: OB.green }} />
            </div>
            <p className="text-[17px] font-semibold mb-1" style={{ color: OB.text }}>{filter === "active" ? "All caught up!" : "No follow-ups"}</p>
            <p className="text-[13px]" style={{ color: OB.textMuted }}>{filter === "active" ? "No active follow-ups at this time." : "Create follow-ups from the alert queue."}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(followup => {
              const cfg = STATUS_CONFIG[followup.status];
              const isOverdue = followup.due_date && new Date(followup.due_date) < new Date() && followup.status !== "completed";
              return (
                <div key={followup.id} className="rounded-2xl p-4" style={{ background: OB.surface, border: `1px solid ${OB.border}` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" style={{ color: OB.textMuted }} />
                          <span className="font-semibold text-[14px]" style={{ color: OB.text }}>{followup.athlete_name}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {isOverdue && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#fee2e2", color: OB.red }}>Overdue</span>}
                      </div>
                      <p className="text-[13px] mb-2" style={{ color: OB.textSub }}>{followup.reason}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 text-[11px]" style={{ color: OB.textMuted }}>
                          <Clock className="h-3 w-3" />
                          Created {new Date(followup.created_at).toLocaleDateString()}
                        </div>
                        {followup.due_date && (
                          <div className="flex items-center gap-1 text-[11px]" style={{ color: isOverdue ? OB.red : OB.textMuted }}>
                            <Calendar className="h-3 w-3" />
                            Due {new Date(followup.due_date).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[11px]" style={{ color: OB.textMuted }}>
                          <User className="h-3 w-3" />
                          {followup.assigned_to_name || "Unassigned"}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {followup.status === "open" && (
                        <button
                          onClick={() => handleStatusChange(followup.id, "in_progress")}
                          className="h-8 px-3 text-[12px] font-semibold rounded-lg border transition-colors"
                          style={{ borderColor: OB.border, color: OB.textSub, background: OB.raised }}
                        >
                          Start
                        </button>
                      )}
                      {followup.status !== "completed" && (
                        <button
                          onClick={() => handleStatusChange(followup.id, "completed")}
                          className="h-8 px-3 text-[12px] font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
                          style={{ background: `linear-gradient(135deg,#065f46,${OB.green})` }}
                        >
                          Complete
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
