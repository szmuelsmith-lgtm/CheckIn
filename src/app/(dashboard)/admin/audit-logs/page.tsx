"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { Download, FileText } from "lucide-react";

const T = {
  surface:   "#ffffff",
  raised:    "#f8fafc",
  border:    "#e8edf2",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#059669",
  greenDeep: "#065f46",
};

type ActiveTab = "system" | "consent" | "access";

interface AuditLogEntry {
  id: string;
  actor_name: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ACTION_STYLE: Record<string, { color: string; bg: string }> = {
  create: { color: "#047857", bg: "#d1fae5" },
  update: { color: "#0f766e", bg: "#ccfbf1" },
  delete: { color: "#dc2626", bg: "#fee2e2" },
  notify: { color: "#7c3aed", bg: "#ede9fe" },
  view:   { color: T.textMuted, bg: T.borderSub },
};

interface ConsentEntry {
  id: string;
  athlete_name: string | null;
  shared_with_name: string | null;
  scope: string;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface AccessEntry {
  id: string;
  viewer_name: string | null;
  athlete_name: string | null;
  access_type: string;
  accessed_at: string;
}

export default function AdminAuditLogsPage() {
  const [profile, setProfile] = useState<{ full_name: string; role: string; organization_id: string | null } | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("system");

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(0);
  const [logsHasMore, setLogsHasMore] = useState(true);
  const PAGE_SIZE = 50;

  const [consentLogs, setConsentLogs] = useState<ConsentEntry[]>([]);
  const [consentLoading, setConsentLoading] = useState(false);

  const [accessLogs, setAccessLogs] = useState<AccessEntry[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  const loadSystemLogs = async (pageNum: number, orgId?: string) => {
    setLogsLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("audit_logs")
      .select(`id, action, target_type, target_id, metadata, created_at,
        actor:profiles!audit_logs_actor_profile_id_fkey(full_name)`)
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);
    // Belt-and-suspenders: filter by org even though RLS enforces it server-side
    if (orgId) query = query.eq("organization_id", orgId);
    const { data } = await query;

    if (data) {
      const entries: AuditLogEntry[] = data.map((d) => ({
        id: d.id,
        actor_name: (d.actor as unknown as { full_name: string })?.full_name || "System",
        action: d.action,
        target_type: d.target_type,
        target_id: d.target_id,
        metadata: (d.metadata as Record<string, unknown>) || {},
        created_at: d.created_at,
      }));
      if (pageNum === 0) setLogs(entries);
      else setLogs((prev) => [...prev, ...entries]);
      setLogsHasMore(entries.length === PAGE_SIZE);
    }
    setLogsLoading(false);
  };

  const loadConsentLogs = async (orgId: string) => {
    setConsentLoading(true);
    const supabase = createClient();
    const { data: athletes } = await supabase.from("profiles").select("id").eq("organization_id", orgId).eq("role", "athlete");
    const athleteIds = (athletes || []).map((a) => a.id);
    if (athleteIds.length === 0) { setConsentLoading(false); return; }
    const { data } = await supabase
      .from("consent_logs")
      .select(`id, scope, granted_at, expires_at, is_active, athlete:athlete_id(full_name), target:target_profile_id(full_name)`)
      .in("athlete_id", athleteIds)
      .order("granted_at", { ascending: false });
    if (data) {
      setConsentLogs(data.map((d) => ({
        id: d.id,
        athlete_name: (d.athlete as unknown as { full_name: string } | null)?.full_name || null,
        shared_with_name: (d.target as unknown as { full_name: string } | null)?.full_name || null,
        scope: d.scope,
        granted_at: d.granted_at,
        expires_at: d.expires_at,
        is_active: d.is_active,
      })));
    }
    setConsentLoading(false);
  };

  const loadAccessLogs = async (orgId: string) => {
    setAccessLoading(true);
    const supabase = createClient();
    const { data: athletes } = await supabase.from("profiles").select("id").eq("organization_id", orgId).eq("role", "athlete");
    const athleteIds = (athletes || []).map((a) => a.id);
    if (athleteIds.length === 0) { setAccessLoading(false); return; }
    const { data } = await supabase
      .from("access_logs")
      .select(`id, access_type, accessed_at, viewer:viewer_profile_id(full_name), athlete:athlete_id(full_name)`)
      .in("athlete_id", athleteIds)
      .order("accessed_at", { ascending: false })
      .limit(200);
    if (data) {
      setAccessLogs(data.map((d) => ({
        id: d.id,
        viewer_name: (d.viewer as unknown as { full_name: string } | null)?.full_name || null,
        athlete_name: (d.athlete as unknown as { full_name: string } | null)?.full_name || null,
        access_type: d.access_type,
        accessed_at: d.accessed_at,
      })));
    }
    setAccessLoading(false);
  };

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("full_name, role, organization_id").eq("auth_user_id", user.id).single();
      if (prof) setProfile(prof);
      await loadSystemLogs(0, prof?.organization_id ?? undefined);
      setInitialLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile?.organization_id) return;
    if (activeTab === "consent" && consentLogs.length === 0) loadConsentLogs(profile.organization_id);
    if (activeTab === "access"  && accessLogs.length === 0)  loadAccessLogs(profile.organization_id);
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    const next = logsPage + 1;
    setLogsPage(next);
    loadSystemLogs(next, profile?.organization_id ?? undefined);
  };

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Actor", "Action", "Target Type", "Target ID", "Metadata"];
    const rows = logs.map((log) => [
      new Date(log.created_at).toISOString(), log.actor_name || "System",
      log.action, log.target_type, log.target_id || "", JSON.stringify(log.metadata),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (initialLoading) {
    return (
      <DashboardLayout role="admin" userName="...">
        <div className="flex items-center justify-center h-64">
          <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.green }} />
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "system",  label: "System Logs" },
    { key: "consent", label: "Consent History" },
    { key: "access",  label: "Access Logs" },
  ];

  const thStyle: React.CSSProperties = {
    textAlign: "left", padding: "12px 16px",
    fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const,
    letterSpacing: "0.05em", color: T.textMuted,
    borderBottom: `1px solid ${T.borderSub}`,
  };
  const tdStyle: React.CSSProperties = { padding: "12px 16px", fontSize: 13, color: T.textSub };

  return (
    <DashboardLayout role={(profile?.role as "admin") || "admin"} userName={profile?.full_name || "Admin"}>
      <div className="max-w-5xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>Audit Logs</h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>Complete record of all system actions and access</p>
          </div>
          {activeTab === "system" && (
            <button
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold rounded-xl border transition-colors disabled:opacity-40 self-start"
              style={{ borderColor: T.border, color: T.textSub, background: T.raised }}
            >
              <Download className="h-4 w-4" />Export CSV
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-2xl p-1 overflow-x-auto" style={{ background: T.raised, border: `1px solid ${T.borderSub}` }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 rounded-xl text-[13px] font-medium transition-colors"
              style={activeTab === tab.key
                ? { background: T.surface, color: T.text, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                : { color: T.textMuted }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: System Logs */}
        {activeTab === "system" && (
          <>
            {logs.length === 0 ? (
              <div className="rounded-3xl p-14 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <FileText className="h-10 w-10 mx-auto mb-4" style={{ color: "#cbd5e1" }} />
                <p className="text-[16px] font-semibold mb-1" style={{ color: T.text }}>No audit logs yet</p>
                <p className="text-[13px]" style={{ color: T.textMuted }}>Actions will be recorded here as users interact with the system.</p>
              </div>
            ) : (
              <>
                <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  {logs.map((log, idx) => {
                    const date = new Date(log.created_at);
                    const actionStyle = ACTION_STYLE[log.action] || ACTION_STYLE.view;
                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-4 px-5 py-3"
                        style={{ borderTop: idx > 0 ? `1px solid ${T.borderSub}` : undefined }}
                      >
                        <div className="text-[11px] w-24 sm:w-32 shrink-0 tabular-nums pt-0.5" style={{ color: T.textMuted }}>
                          {date.toLocaleDateString()}<br />
                          {date.toLocaleTimeString()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold" style={{ color: T.text }}>{log.actor_name}</span>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: actionStyle.bg, color: actionStyle.color }}
                            >
                              {log.action}
                            </span>
                            <span className="text-[13px]" style={{ color: T.textMuted }}>{log.target_type}</span>
                          </div>
                          {Object.keys(log.metadata).length > 0 && (
                            <p className="text-[11px] mt-0.5 font-mono truncate" style={{ color: T.textMuted }}>
                              {JSON.stringify(log.metadata)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {logsHasMore && (
                  <div className="text-center">
                    <button
                      onClick={handleLoadMore}
                      disabled={logsLoading}
                      className="h-9 px-5 text-[13px] font-semibold rounded-xl border transition-colors disabled:opacity-50"
                      style={{ borderColor: T.border, color: T.textSub, background: T.raised }}
                    >
                      {logsLoading ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Tab 2: Consent History */}
        {activeTab === "consent" && (
          <>
            {consentLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.green }} />
              </div>
            ) : consentLogs.length === 0 ? (
              <div className="rounded-3xl p-14 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <FileText className="h-10 w-10 mx-auto mb-4" style={{ color: "#cbd5e1" }} />
                <p className="text-[16px] font-semibold mb-1" style={{ color: T.text }}>No consent records yet</p>
                <p className="text-[13px]" style={{ color: T.textMuted }}>Athlete sharing grants will appear here.</p>
              </div>
            ) : (
              <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px]">
                    <thead>
                      <tr>
                        <th style={thStyle}>Athlete</th>
                        <th style={thStyle}>Shared With</th>
                        <th style={thStyle}>Scope</th>
                        <th style={thStyle}>Granted</th>
                        <th style={thStyle}>Expires</th>
                        <th style={thStyle}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consentLogs.map((entry, idx) => (
                        <tr key={entry.id} style={{ borderTop: idx > 0 ? `1px solid ${T.borderSub}` : undefined }}>
                          <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}>{entry.athlete_name || "—"}</td>
                          <td style={tdStyle}>{entry.shared_with_name || "—"}</td>
                          <td style={tdStyle}>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={entry.scope === "full"
                                ? { background: "#ede9fe", color: "#6d28d9" }
                                : { background: "#eff6ff", color: "#1d4ed8" }}
                            >
                              {entry.scope === "full" ? "FULL REPORT" : "SUMMARY"}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, fontFamily: "var(--font-mono, monospace)" }}>
                            {new Date(entry.granted_at).toLocaleDateString()}
                          </td>
                          <td style={{ ...tdStyle, fontFamily: "var(--font-mono, monospace)" }}>
                            {entry.expires_at ? new Date(entry.expires_at).toLocaleDateString() : "No expiry"}
                          </td>
                          <td style={tdStyle}>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={entry.is_active
                                ? { background: "#d1fae5", color: "#047857" }
                                : { background: T.borderSub, color: T.textMuted }}
                            >
                              {entry.is_active ? "Active" : "Revoked"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 3: Access Logs */}
        {activeTab === "access" && (
          <>
            {accessLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.green }} />
              </div>
            ) : accessLogs.length === 0 ? (
              <div className="rounded-3xl p-14 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <FileText className="h-10 w-10 mx-auto mb-4" style={{ color: "#cbd5e1" }} />
                <p className="text-[16px] font-semibold mb-1" style={{ color: T.text }}>No access records yet</p>
                <p className="text-[13px]" style={{ color: T.textMuted }}>Data access events will be logged here.</p>
              </div>
            ) : (
              <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[440px]">
                    <thead>
                      <tr>
                        <th style={thStyle}>Viewer</th>
                        <th style={thStyle}>Athlete</th>
                        <th style={thStyle}>Access Type</th>
                        <th style={thStyle}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessLogs.map((entry, idx) => (
                        <tr key={entry.id} style={{ borderTop: idx > 0 ? `1px solid ${T.borderSub}` : undefined }}>
                          <td style={{ ...tdStyle, fontWeight: 600, color: T.text }}>{entry.viewer_name || "System"}</td>
                          <td style={tdStyle}>{entry.athlete_name || "—"}</td>
                          <td style={tdStyle}>
                            <span
                              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg"
                              style={{ background: T.borderSub, color: T.textMuted }}
                            >
                              {entry.access_type}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, fontSize: 11, fontFamily: "var(--font-mono, monospace)" }}>
                            {new Date(entry.accessed_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
