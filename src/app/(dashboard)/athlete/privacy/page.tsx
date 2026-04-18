"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { getActiveConsents, createConsent, revokeConsent } from "@/lib/consent";
import { Lock, Shield, Eye, X, Plus, Clock, User, FileText, AlertCircle, Mail } from "lucide-react";
import type { ConsentLog, ConsentScope, ConsentTargetRole } from "@/types/database";

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

    try {
      const c = await getActiveConsents(prof.id, supabase);
      setConsents(c as ConsentWithTarget[]);
    } catch { setConsents([]); }

    const { data: logs } = await supabase
      .from("access_logs")
      .select("id, viewer_profile_id, access_type, accessed_at")
      .eq("athlete_id", prof.id)
      .order("accessed_at", { ascending: false })
      .limit(20);
    setAccessLogs(logs ?? []);

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
          <div className="h-5 w-5 rounded-full border-2 animate-spin"
               style={{ borderColor: T.border, borderTopColor: T.green }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: T.text }}>Privacy & Sharing</h1>
          <p className="text-[14px] mt-0.5" style={{ color: T.textMuted }}>Your data is private by default. Only you decide who sees it.</p>
        </div>

        {/* Privacy guarantee */}
        <div
          className="rounded-3xl p-5 animate-fade-in-up"
          style={{ background: "linear-gradient(135deg, #065f46, #047857)", boxShadow: "0 4px 20px rgba(5,150,105,0.2)" }}
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0"
                 style={{ background: "rgba(255,255,255,0.15)" }}>
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-white mb-1.5">Three-tier privacy protection</p>
              <ul className="space-y-1.5">
                {[
                  "Coaches only see anonymized team averages — never your scores",
                  "Support staff see flagged responses only when risk is detected",
                  "Journal entries are completely private to you",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-[12px]" style={{ color: "rgba(255,255,255,0.8)" }}>
                    <span className="mt-0.5 shrink-0 text-white/60">·</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Active sharing */}
        <div className="rounded-3xl overflow-hidden animate-fade-in-up"
             style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>Active Sharing</p>
              <p className="text-[12px] mt-0.5" style={{ color: T.textMuted }}>
                {consents.length === 0
                  ? "You haven't shared data with anyone"
                  : `Sharing with ${consents.length} person${consents.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <button
              onClick={() => setShowShare(!showShare)}
              className="flex items-center gap-1.5 h-9 px-3.5 text-[12px] font-bold text-white rounded-2xl"
              style={{ background: "linear-gradient(135deg, #065f46, #059669)", boxShadow: "0 2px 8px rgba(5,150,105,0.25)" }}
            >
              <Plus className="h-3.5 w-3.5" />Share
            </button>
          </div>

          {/* Share form */}
          {showShare && (
            <div className="px-5 py-5" style={{ background: T.raised, borderBottom: `1px solid ${T.borderSub}` }}>
              <p className="text-[13px] font-semibold mb-4" style={{ color: T.text }}>Share your data with someone you trust</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: T.textSub }}>Share with</label>
                  <select
                    value={selectedTarget}
                    onChange={e => setSelectedTarget(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-2xl text-[14px] focus:outline-none"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                  >
                    <option value="">Select a person...</option>
                    {targets.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.role === "psychiatrist" ? "Counselor" : "Trusted Adult"})
                      </option>
                    ))}
                  </select>
                  {targets.length === 0 && (
                    <p className="text-[11px] mt-1.5" style={{ color: T.textMuted }}>No counselors or trusted adults available yet.</p>
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: T.textSub }}>What to share</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["summary", "full"] as ConsentScope[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedScope(s)}
                        className="p-3 rounded-2xl text-left transition-all"
                        style={{
                          border: `1px solid ${selectedScope === s ? T.green : T.border}`,
                          background: selectedScope === s ? "#f0fdf4" : T.surface,
                        }}
                      >
                        <p className="text-[13px] font-semibold" style={{ color: selectedScope === s ? T.greenDeep : T.text }}>
                          {s === "summary" ? "Summary only" : "Full report"}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>
                          {s === "summary" ? "Pillar scores only" : "All responses + notes"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowShare(false); setSelectedTarget(""); setSelectedScope("summary"); }}
                    className="flex-1 h-10 font-medium text-[13px] rounded-2xl"
                    style={{ border: `1px solid ${T.border}`, color: T.textSub }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={!selectedTarget || sharing}
                    className="flex-1 h-10 disabled:opacity-50 text-white font-bold text-[13px] rounded-2xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}
                  >
                    {sharing
                      ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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
                <Lock className="h-7 w-7 mx-auto mb-2" style={{ color: T.border }} />
                <p className="text-[13px]" style={{ color: T.textMuted }}>Everything stays private unless you choose to share.</p>
              </div>
            ) : (
              <div>
                {consents.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between py-4 gap-3"
                       style={{ borderBottom: i < consents.length - 1 ? `1px solid ${T.borderSub}` : "none" }}>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-2xl flex items-center justify-center"
                           style={{ background: T.raised }}>
                        <User className="h-4 w-4" style={{ color: T.textMuted }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: T.text }}>
                          {c.target_profile?.full_name ?? "Unknown"}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
                                style={c.scope === "full"
                                  ? { background: "#f5f3ff", color: "#7c3aed" }
                                  : { background: "#eff6ff", color: "#2563eb" }}>
                            {c.scope === "full" ? "FULL REPORT" : "SUMMARY"}
                          </span>
                          {c.expires_at && (
                            <span className="text-[10px] flex items-center gap-0.5" style={{ color: T.textMuted }}>
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
                      className="flex items-center gap-1 h-8 px-3 text-[11px] font-semibold rounded-2xl disabled:opacity-50"
                      style={{ border: "1px solid #fecaca", color: "#ef4444" }}
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
        <div className="rounded-3xl overflow-hidden animate-fade-in-up"
             style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
            <Eye className="h-4 w-4" style={{ color: T.textMuted }} />
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>Who Viewed Your Data</p>
          </div>
          <div className="px-5">
            {accessLogs.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-[13px]" style={{ color: T.textMuted }}>No one has accessed your data yet.</p>
              </div>
            ) : (
              <div>
                {accessLogs.map((log, i) => (
                  <div key={log.id} className="flex items-center justify-between py-3"
                       style={{ borderBottom: i < accessLogs.length - 1 ? `1px solid ${T.borderSub}` : "none" }}>
                    <p className="text-[13px] capitalize" style={{ color: T.textSub }}>{log.access_type.replace(/_/g, " ")}</p>
                    <p className="text-[11px]" style={{ color: T.textMuted }}>{formatRelative(log.accessed_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* FERPA Rights */}
        <div className="rounded-3xl overflow-hidden animate-fade-in-up"
             style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
            <FileText className="h-4 w-4" style={{ color: T.textMuted }} />
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>Your FERPA Rights</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-[12px] leading-relaxed" style={{ color: T.textMuted }}>
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
              <div key={item.title} className="flex items-start gap-3 p-3.5 rounded-2xl" style={{ background: item.bg }}>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                     style={{ background: `${item.color}20`, color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: item.color }}>{item.title}</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: T.textSub }}>{item.body}</p>
                </div>
              </div>
            ))}

            <p className="text-[10px] leading-relaxed pt-1" style={{ color: T.textMuted }}>
              Data retention: wellness check-in records are retained for the duration of enrollment plus 3 years. Clinical notes (if any) are retained for 7 years per NCAA best practices. You may request deletion of non-required records at any time.
            </p>
          </div>
        </div>

        {/* Mandatory reporter notice */}
        <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5"
             style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
          <div>
            <p className="text-[12px] font-semibold mb-0.5" style={{ color: "#92400e" }}>Mandatory Reporter Notice</p>
            <p className="text-[11px] leading-relaxed" style={{ color: "#b45309" }}>
              Athletic staff and counselors may be mandatory reporters under state law. If a disclosure indicates risk of harm to yourself or others, they may be required to report it regardless of your privacy settings. This is covered under FERPA § 99.36 health and safety emergency provisions.
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
