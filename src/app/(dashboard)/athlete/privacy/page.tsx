"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { getActiveConsents, createConsent, revokeConsent } from "@/lib/consent";
import { Lock, Shield, Eye, X, Plus, Clock, User, FileText, AlertCircle, Mail } from "lucide-react";
import type { ConsentLog, ConsentScope, ConsentTargetRole } from "@/types/database";

interface ConsentWithTarget extends ConsentLog {
  target_profile?: { id: string; full_name: string; role: string };
}

interface AccessLogEntry {
  id: string;
  viewer_profile_id: string;
  access_type: string;
  accessed_at: string;
}

interface ShareTarget {
  id: string;
  full_name: string;
  role: string;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function PrivacyPage() {
  const [profile, setProfile]   = useState<{ id: string; full_name: string } | null>(null);
  const [consents, setConsents] = useState<ConsentWithTarget[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>([]);
  const [targets, setTargets]   = useState<ShareTarget[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [selectedScope, setSelectedScope]   = useState<ConsentScope>("summary");
  const [sharing, setSharing]   = useState(false);

  async function loadAll(supabase = createClient()) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase
      .from("profiles").select("id, full_name").eq("auth_user_id", user.id).single();
    if (!prof) return;
    setProfile(prof);

    // Fetch consents directly — no API route needed
    try {
      const c = await getActiveConsents(prof.id, supabase);
      setConsents(c as ConsentWithTarget[]);
    } catch { setConsents([]); }

    // Access logs
    const { data: logs } = await supabase
      .from("access_logs")
      .select("id, viewer_profile_id, access_type, accessed_at")
      .eq("athlete_id", prof.id)
      .order("accessed_at", { ascending: false })
      .limit(20);
    setAccessLogs(logs ?? []);

    // Share targets
    const { data: tgts } = await supabase
      .from("profiles").select("id, full_name, role").in("role", ["psychiatrist", "trusted_adult"]);
    setTargets(tgts ?? []);

    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRevoke(consentId: string) {
    if (!profile) return;
    setRevoking(consentId);
    const supabase = createClient();
    try {
      await revokeConsent(consentId, undefined, supabase);
      await supabase.from("audit_logs").insert({
        actor_profile_id: profile.id, action: "revoke_consent",
        target_type: "consent_log", target_id: consentId,
      });
    } catch { /* non-fatal */ }
    await loadAll(supabase);
    setRevoking(null);
  }

  async function handleShare() {
    if (!selectedTarget || !profile) return;
    setSharing(true);
    const target = targets.find(t => t.id === selectedTarget);
    if (!target) { setSharing(false); return; }
    const supabase = createClient();
    try {
      const consent = await createConsent({
        athleteId: profile.id,
        targetProfileId: selectedTarget,
        targetRole: target.role as ConsentTargetRole,
        scope: selectedScope,
      }, supabase);
      await supabase.from("audit_logs").insert({
        actor_profile_id: profile.id, action: "create_consent",
        target_type: "consent_log", target_id: consent.id,
        metadata: { target_profile_id: selectedTarget, target_role: target.role, scope: selectedScope },
      });
    } catch { /* non-fatal */ }
    setShowShare(false);
    setSelectedTarget("");
    setSelectedScope("summary");
    await loadAll(supabase);
    setSharing(false);
  }

  if (loading) {
    return (
      <DashboardLayout role="athlete" userName="...">
        <div className="flex items-center justify-center h-64">
          <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-emerald-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Privacy & Sharing</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">Your data is private by default. Only you decide who sees it.</p>
        </div>

        {/* Privacy guarantee */}
        <div className="bg-emerald-700 text-white rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[14px] font-bold mb-1">Three-tier privacy protection</p>
              <ul className="space-y-1">
                {[
                  "Coaches only see anonymized team averages — never your scores",
                  "Support staff see flagged responses only when risk is detected",
                  "Journal entries are completely private to you",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-[12px] text-emerald-100">
                    <span className="mt-0.5 shrink-0">·</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Active sharing */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Active Sharing</p>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {consents.length === 0
                  ? "You haven't shared data with anyone"
                  : `Sharing with ${consents.length} person${consents.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              onClick={() => setShowShare(!showShare)}
              className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}
            >
              <Plus className="h-3.5 w-3.5" /> Share
            </button>
          </div>

          {/* Share form */}
          {showShare && (
            <div className="px-5 py-5 bg-slate-50 border-b border-slate-100">
              <p className="text-[13px] font-semibold text-slate-900 mb-4">Share your data with someone you trust</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-slate-600 mb-1.5">Share with</label>
                  <select
                    value={selectedTarget}
                    onChange={e => setSelectedTarget(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                  >
                    <option value="">Select a person...</option>
                    {targets.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.role === "psychiatrist" ? "Counselor" : "Trusted Adult"})
                      </option>
                    ))}
                  </select>
                  {targets.length === 0 && (
                    <p className="text-[11px] text-slate-400 mt-1.5">No counselors or trusted adults available yet.</p>
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-slate-600 mb-1.5">What to share</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["summary", "full"] as ConsentScope[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedScope(s)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedScope === s
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <p className={`text-[13px] font-semibold ${selectedScope === s ? "text-emerald-700" : "text-slate-800"}`}>
                          {s === "summary" ? "Summary only" : "Full report"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {s === "summary" ? "Pillar scores only" : "All responses + notes"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowShare(false); setSelectedTarget(""); setSelectedScope("summary"); }}
                    className="flex-1 h-9 border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium text-[13px] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={!selectedTarget || sharing}
                    className="flex-1 h-9 disabled:opacity-50 text-white font-semibold text-[13px] rounded-lg transition-opacity hover:opacity-90 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}
                  >
                    {sharing
                      ? <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      : "Confirm Share"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Consent list */}
          <div className="px-5">
            {consents.length === 0 && !showShare ? (
              <div className="py-8 text-center">
                <Lock className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                <p className="text-[13px] text-slate-500">Everything stays private unless you choose to share.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {consents.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">
                          {c.target_profile?.full_name ?? "Unknown"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            c.scope === "full" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {c.scope === "full" ? "FULL REPORT" : "SUMMARY"}
                          </span>
                          {c.expires_at && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              expires {new Date(c.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevoke(c.id)}
                      disabled={revoking === c.id}
                      className="flex items-center gap-1 h-7 px-2.5 text-[11px] font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="h-3 w-3" />
                      {revoking === c.id ? "..." : "Revoke"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Access log */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Eye className="h-4 w-4 text-slate-400" />
            <p className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Who Viewed Your Data</p>
          </div>
          <div className="px-5">
            {accessLogs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[13px] text-slate-500">No one has accessed your data yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {accessLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between py-3">
                    <p className="text-[13px] text-slate-700 capitalize">{log.access_type.replace(/_/g, " ")}</p>
                    <p className="text-[11px] text-slate-400">{formatRelative(log.accessed_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FERPA Rights */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileText className="h-4 w-4 text-slate-400" />
            <p className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Your FERPA Rights</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <p className="text-[12px] text-slate-500 leading-relaxed">
              Your wellness data may constitute an education record protected under FERPA (20 U.S.C. § 1232g). You have the following rights:
            </p>

            {[
              {
                icon: <Eye className="h-4 w-4" />,
                title: "Right to Inspect",
                body: "You may request to inspect your education records within 45 days of the request. Contact your program administrator to submit an inspection request.",
                color: "#2563eb", bg: "#eff6ff",
              },
              {
                icon: <FileText className="h-4 w-4" />,
                title: "Right to Request Amendment",
                body: "If you believe your records are inaccurate or misleading, you may request an amendment. If denied, you have the right to a hearing.",
                color: "#7c3aed", bg: "#f5f3ff",
              },
              {
                icon: <Lock className="h-4 w-4" />,
                title: "Right to Consent to Disclosure",
                body: "Your individual wellness data will not be disclosed to third parties without your written consent, except as permitted by FERPA § 99.31 (e.g., health or safety emergencies under § 99.36).",
                color: "#047857", bg: "#f0fdf4",
              },
              {
                icon: <AlertCircle className="h-4 w-4" />,
                title: "Right to File a Complaint",
                body: "You may file a complaint with the U.S. Department of Education's Family Policy Compliance Office (FPCO) if you believe your FERPA rights have been violated.",
                color: "#d97706", bg: "#fffbeb",
              },
              {
                icon: <Mail className="h-4 w-4" />,
                title: "Contact for FERPA Requests",
                body: "To exercise any of these rights, contact your program's Privacy Coordinator or email privacy@athleteanchor.com. Requests will be acknowledged within 5 business days.",
                color: "#64748b", bg: "#f8fafc",
              },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: item.bg }}>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                     style={{ background: `${item.color}20`, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: item.color }}>{item.title}</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}

            <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
              Data retention: wellness check-in records are retained for the duration of enrollment plus 3 years. Clinical notes (if any) are retained for 7 years per NCAA best practices. You may request deletion of non-required records at any time.
            </p>
          </div>
        </div>

        {/* Mandatory reporter notice */}
        <div className="rounded-2xl p-4" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#c2410c" }} />
            <div>
              <p className="text-[12px] font-semibold mb-1" style={{ color: "#9a3412" }}>Mandatory Reporter Notice</p>
              <p className="text-[11px] leading-relaxed" style={{ color: "#c2410c" }}>
                Athletic staff and counselors may be mandatory reporters under state law. If a disclosure indicates risk of harm to yourself or others, they may be required to report it regardless of your privacy settings. This is covered under FERPA § 99.36 health and safety emergency provisions.
              </p>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
