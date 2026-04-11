"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { Lock, Shield, Eye, X, Plus } from "lucide-react";
import type { ConsentLog, ConsentScope, ConsentTargetRole } from "@/types/database";

interface ConsentWithTarget extends ConsentLog {
  target_profile?: { id: string; full_name: string; role: string };
}

interface AccessLogEntry {
  id: string;
  viewer_profile_id: string;
  access_type: string;
  accessed_at: string;
  viewer?: { full_name: string };
}

interface ShareTarget {
  id: string;
  full_name: string;
  role: string;
}

export default function PrivacyPage() {
  const [profile, setProfile] = useState<{ id: string; full_name: string } | null>(null);
  const [consents, setConsents] = useState<ConsentWithTarget[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>([]);
  const [targets, setTargets] = useState<ShareTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Share form state
  const [selectedTarget, setSelectedTarget] = useState("");
  const [selectedScope, setSelectedScope] = useState<ConsentScope>("summary");
  const [sharing, setSharing] = useState(false);

  async function loadAll() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from("profiles").select("id, full_name").eq("auth_user_id", user.id).single();
    if (!prof) return;
    setProfile(prof);

    // Fetch active consents
    const cRes = await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list" }),
    });
    if (cRes.ok) {
      const cData = await cRes.json();
      setConsents(cData.consents ?? []);
    }

    // Fetch access logs
    const { data: logs } = await supabase
      .from("access_logs")
      .select("id, viewer_profile_id, access_type, accessed_at")
      .eq("athlete_id", prof.id)
      .order("accessed_at", { ascending: false })
      .limit(20);
    setAccessLogs(logs ?? []);

    // Fetch potential share targets
    const { data: tgts } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["psychiatrist", "trusted_adult"]);
    setTargets(tgts ?? []);

    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRevoke(consentId: string) {
    setRevoking(consentId);
    await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", id: consentId }),
    });
    await loadAll();
    setRevoking(null);
  }

  async function handleShare() {
    if (!selectedTarget) return;
    setSharing(true);
    const target = targets.find(t => t.id === selectedTarget);
    if (!target) { setSharing(false); return; }

    await fetch("/api/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create",
        target_profile_id: selectedTarget,
        target_role: target.role as ConsentTargetRole,
        scope: selectedScope,
      }),
    });
    setShowShare(false);
    setSelectedTarget("");
    setSelectedScope("summary");
    await loadAll();
    setSharing(false);
  }

  if (loading) {
    return (
      <DashboardLayout role="athlete" userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Lock className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Your Privacy</h1>
            <p className="text-slate-500 text-sm">Your data is private by default. Only you decide who sees it.</p>
          </div>
        </div>

        {/* Privacy guarantee */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 mt-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-800">Your answers are private.</p>
              <p className="text-sm text-emerald-700 mt-0.5">
                Coaches never see your individual responses. Sharing with a counselor or trusted adult is always your choice and can be revoked at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Active sharing */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg">Active Sharing</CardTitle>
            <Button size="sm" onClick={() => setShowShare(!showShare)} className="gap-1">
              <Plus className="h-4 w-4" />Share My Data
            </Button>
          </CardHeader>
          <CardContent>
            {consents.length === 0 ? (
              <div className="text-center py-8">
                <Lock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">You haven&apos;t shared your data with anyone.</p>
                <p className="text-xs text-slate-400 mt-1">Everything stays private unless you choose to share.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {consents.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {(c as ConsentWithTarget & { target_profile?: { full_name: string } }).target_profile?.full_name ?? "Unknown"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={c.scope === "full" ? "bg-violet-50 text-violet-700 border-violet-200 text-xs" : "bg-blue-50 text-blue-700 border-blue-200 text-xs"}>
                            {c.scope === "full" ? "FULL REPORT" : "SUMMARY"}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {c.expires_at ? `Expires ${new Date(c.expires_at).toLocaleDateString()}` : "No expiry"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm" variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                      disabled={revoking === c.id}
                      onClick={() => handleRevoke(c.id)}
                    >
                      <X className="h-3 w-3" />
                      {revoking === c.id ? "Revoking..." : "Revoke"}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Share modal inline */}
            {showShare && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-900 mb-3">Share your data</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Share with</label>
                    <select
                      value={selectedTarget}
                      onChange={e => setSelectedTarget(e.target.value)}
                      className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white"
                    >
                      <option value="">Select a person...</option>
                      {targets.map(t => (
                        <option key={t.id} value={t.id}>{t.full_name} ({t.role === "psychiatrist" ? "Counselor" : "Trusted Adult"})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">What to share</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["summary", "full"] as ConsentScope[]).map(s => (
                        <button
                          key={s}
                          onClick={() => setSelectedScope(s)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-colors text-left ${selectedScope === s ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                        >
                          <p className="font-semibold">{s === "summary" ? "Summary" : "Full Report"}</p>
                          <p className="text-xs font-normal mt-0.5 opacity-70">{s === "summary" ? "Pillar scores only" : "All responses + notes"}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowShare(false)} className="flex-1">Cancel</Button>
                    <Button size="sm" onClick={handleShare} disabled={!selectedTarget || sharing} className="flex-1">
                      {sharing ? "Sharing..." : "Confirm Share"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Access log */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-slate-400" />Who Has Viewed Your Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accessLogs.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No one has accessed your data yet.</p>
            ) : (
              <div className="space-y-2">
                {accessLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm text-slate-700">{log.access_type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-slate-400">{new Date(log.accessed_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
