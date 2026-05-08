"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { Trash2, AlertTriangle, LogOut } from "lucide-react";

const T = {
  surface:   "#ffffff",
  border:    "#e8edf2",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  red:       "#ef4444",
  redLight:  "#fef2f2",
  redBorder: "#fecaca",
};

export default function AccountPage() {
  const router = useRouter();
  const [phase, setPhase]         = useState<"idle" | "confirm" | "deleting" | "done">("idle");
  const [confirmText, setConfirm] = useState("");
  const [error, setError]         = useState("");
  const [userName, setUserName]   = useState("Athlete");

  // Fetch name on mount
  useState(() => {
    createClient().from("profiles")
      .select("full_name")
      .eq("auth_user_id", (async () => (await createClient().auth.getUser()).data.user?.id ?? "")())
      .single()
      .then(({ data }) => { if (data?.full_name) setUserName(data.full_name.split(" ")[0]); });
  });

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push("/login");
  };

  const handleDelete = async () => {
    if (confirmText.trim().toLowerCase() !== "delete my account") return;
    setPhase("deleting");
    setError("");
    try {
      const res  = await fetch("/api/account/delete", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Unknown error");
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPhase("confirm");
    }
  };

  if (phase === "done") {
    return (
      <DashboardLayout role="athlete" userName={userName}>
        <div className="max-w-lg mx-auto pt-12 text-center px-4">
          <p className="text-[22px] font-bold mb-2" style={{ color: T.text }}>Account deleted</p>
          <p className="text-[14px] mb-6" style={{ color: T.textMuted }}>
            Your data has been permanently removed. You will be signed out shortly.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="text-[13px] font-semibold"
            style={{ color: "#059669" }}
          >
            Go to sign in
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="athlete" userName={userName}>
      <div className="max-w-lg mx-auto space-y-4 px-4">

        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: T.text }}>Account</h1>
          <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>Manage your account settings</p>
        </div>

        {/* Sign out */}
        <div
          className="rounded-3xl p-5"
          style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-semibold" style={{ color: T.textSub }}>Sign out</p>
              <p className="text-[12px] mt-0.5" style={{ color: T.textMuted }}>Sign out of this device</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold"
              style={{ background: T.borderSub, color: T.textSub }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>

        {/* Delete account */}
        <div
          className="rounded-3xl p-5"
          style={{ background: T.surface, border: `1px solid ${T.redBorder}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <div className="flex items-start gap-3 mb-4">
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: T.redLight }}
            >
              <Trash2 className="h-4 w-4" style={{ color: T.red }} />
            </div>
            <div>
              <p className="text-[14px] font-semibold" style={{ color: T.red }}>Delete account</p>
              <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: T.textMuted }}>
                Permanently deletes your check-in history, journal entries, and personal data.
                This cannot be undone.
              </p>
            </div>
          </div>

          {phase === "idle" && (
            <button
              onClick={() => setPhase("confirm")}
              className="w-full py-2.5 rounded-2xl text-[13px] font-semibold"
              style={{ background: T.redLight, color: T.red, border: `1px solid ${T.redBorder}` }}
            >
              Delete my account
            </button>
          )}

          {phase === "confirm" && (
            <div className="space-y-3">
              <div
                className="flex items-start gap-2 rounded-2xl p-3 text-[12px] leading-relaxed"
                style={{ background: T.redLight, color: "#b91c1c" }}
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  This will permanently delete all your check-ins, journal entries, wellness trends,
                  and personal notes. Anonymized audit records required for compliance will be retained.
                </span>
              </div>

              <div>
                <p className="text-[12px] mb-1.5" style={{ color: T.textMuted }}>
                  Type <span className="font-semibold" style={{ color: T.text }}>delete my account</span> to confirm
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="delete my account"
                  className="w-full px-3 py-2.5 rounded-xl text-[13px] outline-none"
                  style={{
                    border: `1px solid ${T.redBorder}`,
                    background: "#fff",
                    color: T.text,
                  }}
                />
              </div>

              {error && (
                <p className="text-[12px]" style={{ color: T.red }}>{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setPhase("idle"); setConfirm(""); setError(""); }}
                  className="flex-1 py-2.5 rounded-2xl text-[13px] font-semibold"
                  style={{ background: T.borderSub, color: T.textSub }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText.trim().toLowerCase() !== "delete my account"}
                  className="flex-1 py-2.5 rounded-2xl text-[13px] font-semibold disabled:opacity-40"
                  style={{ background: T.red, color: "#fff" }}
                >
                  Delete permanently
                </button>
              </div>
            </div>
          )}

          {phase === "deleting" && (
            <div className="flex items-center justify-center py-4 gap-2">
              <div
                className="h-4 w-4 rounded-full border-2 animate-spin"
                style={{ borderColor: T.redBorder, borderTopColor: T.red }}
              />
              <span className="text-[13px]" style={{ color: T.textMuted }}>Deleting your account...</span>
            </div>
          )}
        </div>

        {/* Legal note */}
        <p className="text-[11px] text-center px-4" style={{ color: T.textMuted }}>
          Aggregate, anonymized wellness records required for institutional compliance may be
          retained per FERPA record retention requirements.
        </p>

      </div>
    </DashboardLayout>
  );
}
