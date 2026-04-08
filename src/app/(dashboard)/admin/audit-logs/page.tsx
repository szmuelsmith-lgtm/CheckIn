"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Download, FileText } from "lucide-react";

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
  view: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function AdminAuditLogsPage() {
  const [profile, setProfile] = useState<{ full_name: string; role: string } | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  const loadLogs = async (pageNum: number) => {
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

      if (pageNum === 0) {
        setLogs(entries);
      } else {
        setLogs((prev) => [...prev, ...entries]);
      }
      setHasMore(entries.length === PAGE_SIZE);
    }
  };

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
      await loadLogs(0);
      setLoading(false);
    }
    load();
  }, []);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadLogs(next);
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

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading audit logs...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={(profile?.role as "admin") || "admin"} userName={profile?.full_name || "Admin"}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
            <p className="text-slate-500 mt-1">
              Complete record of all system actions
            </p>
          </div>
          <Button variant="outline" onClick={handleExportCSV} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

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
                            <span className="text-sm font-medium text-slate-900">
                              {log.actor_name}
                            </span>
                            <Badge variant="outline" className={actionBadge}>
                              {log.action}
                            </Badge>
                            <span className="text-sm text-slate-500">
                              {log.target_type}
                            </span>
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

            {hasMore && (
              <div className="text-center mt-6">
                <Button variant="outline" onClick={handleLoadMore}>
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
