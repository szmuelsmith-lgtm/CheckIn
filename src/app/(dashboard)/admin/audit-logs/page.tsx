"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Download, FileText } from "lucide-react";

type ActiveTab = "system" | "consent" | "access";

// --- System Logs ---
interface AuditLogEntry {
  id: string;
  actor_name: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

const ACTION_BADGE: Record<string, string> = {
  create: "bg-green-100 text-green-700 border-green-200",
  update: "bg-teal-100 text-teal-700 border-teal-200",
  delete: "bg-red-100 text-red-700 border-red-200",
  notify: "bg-purple-100 text-purple-700 border-purple-200",
  view:   "bg-slate-100 text-slate-700 border-slate-200",
};

// --- Consent History ---
interface ConsentEntry {
  id: string;
  athlete_name: string | null;
  shared_with_name: string | null;
  scope: string;
  granted_at: string;
  expires_at: string | null;
  is_active: boolean;
}

// --- Access Logs ---
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

  // System Logs state
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPage, setLogsPage] = useState(0);
  const [logsHasMore, setLogsHasMore] = useState(true);
  const PAGE_SIZE = 50;

  // Consent History state
  const [consentLogs, setConsentLogs] = useState<ConsentEntry[]>([]);
  const [consentLoading, setConsentLoading] = useState(false);

  // Access Logs state
  const [accessLogs, setAccessLogs] = useState<AccessEntry[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  const loadSystemLogs = async (pageNum: number) => {
    setLogsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("audit_logs")
      .select(`
        id,
        action,
        target_type,
        target_id,
        metadata,
        created_at,
        actor:profiles!audit_logs_actor_profile_id_fkey(full_name)
      `)
      .order("created_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

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

    // Get athlete IDs in org
    const { data: athletes } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", orgId)
      .eq("role", "athlete");

    const athleteIds = (athletes || []).map((a) => a.id);
    if (athleteIds.length === 0) {
      setConsentLoading(false);
      return;
    }

    const { data } = await supabase
      .from("consent_logs")
      .select(`
        id,
        scope,
        granted_at,
        expires_at,
        is_active,
        athlete:athlete_id(full_name),
        target:target_profile_id(full_name)
      `)
      .in("athlete_id", athleteIds)
      .order("granted_at", { ascending: false });

    if (data) {
      const entries: ConsentEntry[] = data.map((d) => ({
        id: d.id,
        athlete_name: (d.athlete as unknown as { full_name: string } | null)?.full_name || null,
        shared_with_name: (d.target as unknown as { full_name: string } | null)?.full_name || null,
        scope: d.scope,
        granted_at: d.granted_at,
        expires_at: d.expires_at,
        is_active: d.is_active,
      }));
      setConsentLogs(entries);
    }
    setConsentLoading(false);
  };

  const loadAccessLogs = async (orgId: string) => {
    setAccessLoading(true);
    const supabase = createClient();

    const { data: athletes } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", orgId)
      .eq("role", "athlete");

    const athleteIds = (athletes || []).map((a) => a.id);
    if (athleteIds.length === 0) {
      setAccessLoading(false);
      return;
    }

    const { data } = await supabase
      .from("access_logs")
      .select(`
        id,
        access_type,
        accessed_at,
        viewer:viewer_profile_id(full_name),
        athlete:athlete_id(full_name)
      `)
      .in("athlete_id", athleteIds)
      .order("accessed_at", { ascending: false })
      .limit(200);

    if (data) {
      const entries: AccessEntry[] = data.map((d) => ({
        id: d.id,
        viewer_name: (d.viewer as unknown as { full_name: string } | null)?.full_name || null,
        athlete_name: (d.athlete as unknown as { full_name: string } | null)?.full_name || null,
        access_type: d.access_type,
        accessed_at: d.accessed_at,
      }));
      setAccessLogs(entries);
    }
    setAccessLoading(false);
  };

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, role, organization_id")
        .eq("auth_user_id", user.id)
        .single();

      if (prof) setProfile(prof);
      await loadSystemLogs(0);
      setInitialLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile?.organization_id) return;
    if (activeTab === "consent" && consentLogs.length === 0) {
      loadConsentLogs(profile.organization_id);
    }
    if (activeTab === "access" && accessLogs.length === 0) {
      loadAccessLogs(profile.organization_id);
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    const next = logsPage + 1;
    setLogsPage(next);
    loadSystemLogs(next);
  };

  const handleExportCSV = () => {
    const headers = ["Timestamp", "Actor", "Action", "Target Type", "Target ID", "Metadata"];
    const rows = logs.map((log) => [
      new Date(log.created_at).toISOString(),
      log.actor_name || "System",
      log.action,
      log.target_type,
      log.target_id || "",
      JSON.stringify(log.metadata),
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
          <p className="text-slate-500">Loading audit logs...</p>
        </div>
      </DashboardLayout>
    );
  }

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "system",  label: "System Logs" },
    { key: "consent", label: "Consent History" },
    { key: "access",  label: "Access Logs" },
  ];

  return (
    <DashboardLayout role={(profile?.role as "admin") || "admin"} userName={profile?.full_name || "Admin"}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
            <p className="text-slate-500 mt-1">Complete record of all system actions and access</p>
          </div>
          {activeTab === "system" && (
            <Button variant="outline" onClick={handleExportCSV} disabled={logs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: System Logs */}
        {activeTab === "system" && (
          <>
            {logs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900">No audit logs yet</p>
                  <p className="text-slate-500 mt-1">Actions will be recorded here as users interact with the system.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardContent className="py-0">
                    <div className="divide-y divide-slate-100">
                      {logs.map((log) => {
                        const date = new Date(log.created_at);
                        const actionBadge = ACTION_BADGE[log.action] || ACTION_BADGE.view;
                        return (
                          <div key={log.id} className="flex items-start gap-4 py-3">
                            <div className="text-xs text-slate-400 w-32 shrink-0 tabular-nums pt-0.5">
                              {date.toLocaleDateString()}<br />
                              {date.toLocaleTimeString()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-slate-900">{log.actor_name}</span>
                                <Badge variant="outline" className={actionBadge}>{log.action}</Badge>
                                <span className="text-sm text-slate-500">{log.target_type}</span>
                              </div>
                              {Object.keys(log.metadata).length > 0 && (
                                <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">
                                  {JSON.stringify(log.metadata)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                {logsHasMore && (
                  <div className="text-center mt-6">
                    <Button variant="outline" onClick={handleLoadMore} disabled={logsLoading}>
                      {logsLoading ? "Loading..." : "Load More"}
                    </Button>
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
                <p className="text-slate-500 text-sm">Loading consent history...</p>
              </div>
            ) : consentLogs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900">No consent records yet</p>
                  <p className="text-slate-500 mt-1">Athlete sharing grants will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Athlete</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Shared With</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Scope</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Granted</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Expires</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consentLogs.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium text-slate-900">{entry.athlete_name || "—"}</td>
                            <td className="py-3 px-4 text-slate-600">{entry.shared_with_name || "—"}</td>
                            <td className="py-3 px-4">
                              <Badge
                                variant="outline"
                                className={
                                  entry.scope === "full"
                                    ? "bg-violet-50 text-violet-700 border-violet-200"
                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                }
                              >
                                {entry.scope === "full" ? "FULL REPORT" : "SUMMARY"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-600 tabular-nums">
                              {new Date(entry.granted_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-slate-600 tabular-nums">
                              {entry.expires_at ? new Date(entry.expires_at).toLocaleDateString() : "No expiry"}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant="outline"
                                className={
                                  entry.is_active
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                }
                              >
                                {entry.is_active ? "Active" : "Revoked"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Tab 3: Access Logs */}
        {activeTab === "access" && (
          <>
            {accessLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-slate-500 text-sm">Loading access logs...</p>
              </div>
            ) : accessLogs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-slate-900">No access records yet</p>
                  <p className="text-slate-500 mt-1">Data access events will be logged here.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Viewer</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Athlete</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Access Type</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase tracking-wide">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {accessLogs.map((entry) => (
                          <tr key={entry.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-medium text-slate-900">{entry.viewer_name || "System"}</td>
                            <td className="py-3 px-4 text-slate-600">{entry.athlete_name || "—"}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 font-mono text-xs">
                                {entry.access_type}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-500 tabular-nums text-xs">
                              {new Date(entry.accessed_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
