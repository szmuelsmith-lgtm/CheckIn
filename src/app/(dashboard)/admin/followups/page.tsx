"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, Plus, X, User, Calendar, Clock } from "lucide-react";

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
  open:        { label: "Open",        color: T.amber,     bg: "#fef3c7" },
  in_progress: { label: "In Progress", color: "#2563eb",    bg: "#dbeafe" },
  completed:   { label: "Completed",   color: T.green,     bg: "#d1fae5" },
};

export default function AdminFollowupsPage() {
  const [profile, setProfile]       = useState<{ full_name: string; id: string; role: string; organization_id: string | null } | null>(null);
  const [followups, setFollowups]   = useState<FollowupItem[]>([]);
  const [filter, setFilter]         = useState<"active" | "completed" | "all">("active");
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [alerts, setAlerts]         = useState<AlertForFollowup[]>([]);
  const [athletes, setAthletes]     = useState<{ id: string; full_name: string }[]>([]);
  const [staff, setStaff]           = useState<StaffMember[]>([]);
  const [selectedAlertId, setSelectedAlertId]   = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [reason, setReason]         = useState("");
  const [dueDate, setDueDate]       = useState("");
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const loadFollowups = async (orgAthleteIds?: string[]) => {
    const supabase = createClient();
    let query = supabase
      .from("followups")
      .select(`id, athlete_id, alert_id, assigned_to_profile_id, reason, status, due_date, created_at, completed_at,
        athlete:profiles!followups_athlete_id_fkey(full_name),
        assignee:profiles!followups_assigned_to_profile_id_fkey(full_name)`)
      .order("created_at", { ascending: false })
      .limit(100);
    // Scope to org: only show followups for athletes in this organization
    if (orgAthleteIds && orgAthleteIds.length > 0) {
      query = query.in("athlete_id", orgAthleteIds);
    }
    const { data: followupData } = await query;
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

      // Load athletes first so we can org-scope the followups query
      const { data: athleteData } = await supabase.from("profiles").select("id, full_name")
        .eq("organization_id", prof.organization_id)
        .eq("role", "athlete")
        .order("full_name");
      if (athleteData) setAthletes(athleteData);
      const orgAthleteIds = (athleteData ?? []).map(a => a.id);

      await loadFollowups(orgAthleteIds);

      let alertQuery = supabase
        .from("alerts")
        .select(`id, severity, trigger_type, created_at, athlete:profiles!alerts_athlete_id_fkey(id, full_name)`)
        .in("status", ["open", "acknowledged"]).order("created_at", { ascending: false }).limit(50);
      // Scope to org to avoid cross-org leakage and improve perf
      if (prof.organization_id) {
        alertQuery = alertQuery.eq("organization_id", prof.organization_id);
      }
      const { data: alertData } = await alertQuery;
      if (alertData) {
        setAlerts(alertData.map(a => ({
          id: a.id, severity: a.severity, trigger_type: a.trigger_type,
          athlete_name: (a.athlete as unknown as { full_name: string })?.full_name || "Unknown",
          athlete_id: (a.athlete as unknown as { id: string })?.id || "", created_at: a.created_at,
        })));
      }
      // Include counseling staff (psychiatrists/trusted adults) alongside admin staff
      const { data: staffData } = await supabase.from("profiles").select("id, full_name, role")
        .eq("organization_id", prof.organization_id)
        .in("role", ["admin", "support", "psychiatrist"])
        .order("full_name");
      if (staffData) setStaff(staffData);

      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedAthleteId = selectedAlertId
    ? (alerts.find(a => a.id === selectedAlertId)?.athlete_id ?? "")
    : selectedAthleteId;

  const handleCreate = async () => {
    // Require a reason always; require either an alert OR a manually selected athlete
    if (!reason.trim()) { setCreateError("Please enter a reason for this follow-up."); return; }
    if (!selectedAlertId && !selectedAthleteId) { setCreateError("Select an alert or an athlete to link this follow-up."); return; }
    if (!resolvedAthleteId) { setCreateError("Could not determine athlete — please reselect the alert or athlete."); return; }
    setCreating(true);
    setCreateError(null);
    const supabase = createClient();
    const { error } = await supabase.from("followups").insert({
      athlete_id:             resolvedAthleteId,
      alert_id:               selectedAlertId || null,
      assigned_to_profile_id: assignedTo || null,
      assigned_by_profile_id: profile?.id,
      reason:                 reason.trim(),
      status:                 "open",
      due_date:               dueDate || null,
    });
    if (error) {
      setCreateError(
        error.code === "42501"
          ? "Permission denied — your account may not have rights to create follow-ups."
          : (error.message ?? "Failed to create follow-up. Please try again.")
      );
      setCreating(false);
      return;
    }
    await supabase.from("audit_logs").insert({
      actor_profile_id: profile?.id, action: "create", target_type: "followup",
      target_id: selectedAlertId || resolvedAthleteId,
      metadata: { alert_id: selectedAlertId || null, athlete_id: resolvedAthleteId, assigned_to: assignedTo || null },
    });
    await loadFollowups();
    setShowCreate(false);
    setSelectedAlertId(""); setSelectedAthleteId(""); setAssignedTo(""); setReason(""); setDueDate("");
    setCreating(false);
  };

  const handleStatusChange = async (followupId: string, newStatus: "in_progress" | "completed") => {
    setStatusError(null);
    const supabase = createClient();
    const update: Record<string, unknown> = { status: newStatus };
    if (newStatus === "completed") update.completed_at = new Date().toISOString();
    const { error } = await supabase.from("followups").update(update).eq("id", followupId);
    if (error) {
      setStatusError(
        error.code === "42501"
          ? "Permission denied — your account may not have rights to update follow-ups."
          : (error.message ?? "Failed to update follow-up status. Please try again.")
      );
      return;
    }
    setFollowups(prev => prev.map(f => f.id === followupId ? { ...f, status: newStatus, ...(newStatus === "completed" ? { completed_at: new Date().toISOString() } : {}) } : f));
    await supabase.from("audit_logs").insert({ actor_profile_id: profile?.id, action: "update", target_type: "followup", target_id: followupId, metadata: { new_status: newStatus } });
  };

  const filtered = followups.filter(f => {
    if (filter === "active") return f.status !== "completed";
    if (filter === "completed") return f.status === "completed";
    return true;
  });
  const activeCount = followups.filter(f => f.status !== "completed").length;
  const roleName = profile?.role === "support" ? "Support" : profile?.role === "psychiatrist" ? "Psychiatrist" : "Admin";

  if (loading) {
    return (
      <DashboardLayout role={(profile?.role as "admin" | "support" | "psychiatrist") || "admin"} userName="...">
        <div className="flex items-center justify-center h-64">
          <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.green }} />
        </div>
      </DashboardLayout>
    );
  }

  const inputCls = "w-full h-10 px-3.5 rounded-xl border text-[13px] bg-white focus:outline-none transition-colors";

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support" | "psychiatrist") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>Follow-ups</h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>{activeCount} active follow-up{activeCount !== 1 ? "s" : ""}</p>
          </div>
          <button
            onClick={() => { setShowCreate(!showCreate); setCreateError(null); }}
            className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold rounded-xl transition-all self-start"
            style={showCreate ? { border: `1px solid ${T.border}`, color: T.textSub, background: T.raised } : { background: "linear-gradient(135deg,#065f46,#047857)", color: "#fff" }}
          >
            {showCreate ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showCreate ? "Cancel" : "Create Follow-up"}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <p className="text-[13px] font-semibold" style={{ color: "#065f46" }}>Create Follow-up</p>

            {/* Error banner */}
            {createError && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
                <span className="text-[12px] font-medium" style={{ color: "#991b1b" }}>{createError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              {/* Linked alert (optional) */}
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.textSub }}>
                  Linked Alert <span style={{ color: T.textMuted, fontWeight: 400 }}>(optional)</span>
                </label>
                <select value={selectedAlertId} onChange={e => { setSelectedAlertId(e.target.value); setSelectedAthleteId(""); setCreateError(null); }}
                  className={inputCls} style={{ borderColor: T.border, color: T.text }}>
                  <option value="">No linked alert</option>
                  {alerts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.athlete_name} — {a.severity.toUpperCase()} ({a.trigger_type}) — {new Date(a.created_at).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Athlete selector — only shown when no alert is selected */}
              {!selectedAlertId && (
                <div>
                  <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.textSub }}>
                    Athlete <span style={{ color: T.red, fontSize: 10 }}>required</span>
                  </label>
                  <select value={selectedAthleteId} onChange={e => { setSelectedAthleteId(e.target.value); setCreateError(null); }}
                    className={inputCls} style={{ borderColor: T.border, color: T.text }}>
                    <option value="">Select athlete…</option>
                    {athletes.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                  </select>
                  {athletes.length === 0 && (
                    <p className="text-[11px] mt-1" style={{ color: T.textMuted }}>No athletes in your organization yet.</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.textSub }}>Assign To</label>
                <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)}
                  className={inputCls} style={{ borderColor: T.border, color: T.text }}>
                  <option value="">Unassigned</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.textSub }}>Reason / Notes <span style={{ color: T.red, fontSize: 10 }}>required</span></label>
                <textarea
                  placeholder="Describe the follow-up action needed..."
                  value={reason} onChange={e => { setReason(e.target.value); if (createError) setCreateError(null); }} rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] bg-white focus:outline-none transition-colors resize-none"
                  style={{ borderColor: T.border, color: T.text }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.textSub }}>Due Date <span style={{ color: T.textMuted, fontWeight: 400 }}>(optional)</span></label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className={inputCls} style={{ borderColor: T.border, color: T.text }} />
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="h-9 px-5 text-[13px] font-semibold text-white rounded-xl disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}
            >
              {creating ? "Creating…" : "Create Follow-up"}
            </button>
          </div>
        )}

        {/* Status change error banner */}
        {statusError && (
          <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
               style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
            <span className="text-[13px] font-medium" style={{ color: "#991b1b" }}>{statusError}</span>
            <button onClick={() => setStatusError(null)} style={{ color: "#991b1b" }}>
              <span className="text-[18px] leading-none">×</span>
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
                : { background: T.surface, color: T.textMuted, borderColor: T.border }}
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
          <div className="rounded-2xl p-14 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#d1fae5" }}>
              <CheckCircle className="h-6 w-6" style={{ color: T.green }} />
            </div>
            <p className="text-[17px] font-semibold mb-1" style={{ color: T.text }}>{filter === "active" ? "All caught up!" : "No follow-ups"}</p>
            <p className="text-[13px]" style={{ color: T.textMuted }}>{filter === "active" ? "No active follow-ups at this time." : "Create follow-ups from the alert queue."}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(followup => {
              const cfg = STATUS_CONFIG[followup.status];
              const isOverdue = followup.due_date && new Date(followup.due_date) < new Date() && followup.status !== "completed";
              return (
                <div key={followup.id} className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" style={{ color: T.textMuted }} />
                          <span className="font-semibold text-[14px]" style={{ color: T.text }}>{followup.athlete_name}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        {isOverdue && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#fee2e2", color: T.red }}>Overdue</span>}
                      </div>
                      <p className="text-[13px] mb-2" style={{ color: T.textSub }}>{followup.reason}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1 text-[11px]" style={{ color: T.textMuted }}>
                          <Clock className="h-3 w-3" />
                          Created {new Date(followup.created_at).toLocaleDateString()}
                        </div>
                        {followup.due_date && (
                          <div className="flex items-center gap-1 text-[11px]" style={{ color: isOverdue ? T.red : T.textMuted }}>
                            <Calendar className="h-3 w-3" />
                            Due {new Date(followup.due_date).toLocaleDateString()}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[11px]" style={{ color: T.textMuted }}>
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
                          style={{ borderColor: T.border, color: T.textSub, background: T.raised }}
                        >
                          Start
                        </button>
                      )}
                      {followup.status !== "completed" && (
                        <button
                          onClick={() => handleStatusChange(followup.id, "completed")}
                          className="h-8 px-3 text-[12px] font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
                          style={{ background: `linear-gradient(135deg,#065f46,${T.green})` }}
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
