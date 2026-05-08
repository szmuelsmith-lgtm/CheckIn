"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor, Check } from "lucide-react";
import { UserRole } from "@/types/database";

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

const inputCls = "w-full h-11 px-3.5 rounded-xl border text-[13px] bg-white focus:outline-none transition-colors";

export default function SignupPage() {
  const [fullName, setFullName]         = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [inviteCode, setInviteCode]     = useState("");
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    let orgId: string | null = null;
    let teamId: string | null = null;
    let role: UserRole = "athlete";

    if (inviteCode.trim()) {
      const { data: invite, error: inviteError } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", inviteCode.trim())
        .single();

      if (inviteError || !invite) {
        setError("Invalid invite code.");
        setLoading(false);
        return;
      }

      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        setError("This invite code has expired.");
        setLoading(false);
        return;
      }

      if (invite.uses_remaining !== null && invite.uses_remaining <= 0) {
        setError("This invite code has been fully used.");
        setLoading(false);
        return;
      }

      orgId  = invite.organization_id;
      teamId = invite.team_id;
      role   = invite.role;

      if (invite.uses_remaining !== null) {
        await supabase
          .from("invite_codes")
          .update({ uses_remaining: invite.uses_remaining - 1 })
          .eq("id", invite.id);
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      let profileError: { message: string } | null = null;

      const { error: rpcError } = await supabase.rpc("create_signup_profile", {
        p_auth_user_id:    authData.user.id,
        p_full_name:       fullName,
        p_email:           email,
        p_role:            role,
        p_organization_id: orgId,
        p_team_id:         teamId,
      });

      if (rpcError) {
        const { error: insertError } = await supabase.from("profiles").insert({
          auth_user_id:    authData.user.id,
          full_name:       fullName,
          email,
          role,
          organization_id: orgId,
          team_id:         teamId,
        });
        profileError = insertError;
      }

      if (profileError) {
        setError("Account created but profile setup failed. Please contact support.");
        setLoading(false);
        return;
      }

      if (!inviteCode.trim()) {
        setSuccess(true);
        setLoading(false);
        return;
      }

      const redirectMap: Record<string, string> = {
        athlete: "/athlete/dashboard",
        coach:   "/coach/dashboard",
        admin:   "/admin/dashboard",
        support: "/admin/dashboard",
      };
      router.push(redirectMap[role] || "/athlete/dashboard");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: T.raised }}>
        <div className="w-full max-w-sm rounded-3xl p-8 text-center"
             style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style={{ background: "linear-gradient(135deg, #065f46, #059669)", boxShadow: "0 4px 14px rgba(5,150,105,0.3)" }}>
            <Check className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
          <h2 className="text-[20px] font-bold mb-2" style={{ color: T.text }}>Check your email</h2>
          <p className="text-[14px] leading-relaxed" style={{ color: T.textMuted }}>
            We sent a confirmation link to{" "}
            <span className="font-medium" style={{ color: T.textSub }}>{email}</span>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-[13px] font-medium hover:underline"
            style={{ color: T.green }}
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: T.raised }}>
      {/* Logo — matches login page */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3"
             style={{ background: "linear-gradient(135deg, #065f46, #059669)", boxShadow: "0 4px 14px rgba(5,150,105,0.3)" }}>
          <Anchor className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
        <p className="text-[15px] font-bold tracking-tight" style={{ color: T.text }}>Check-In</p>
        <p className="text-[11px] tracking-widest uppercase mt-0.5" style={{ color: T.textMuted }}>Athlete Anchor</p>
      </div>

      <div className="w-full max-w-sm rounded-3xl p-8"
           style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <h1 className="text-[22px] font-bold tracking-tight mb-1" style={{ color: T.text }}>Create account</h1>
        <p className="text-[13px] mb-7" style={{ color: T.textMuted }}>Join Check-In by Athlete Anchor</p>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Full name */}
          <div>
            <label htmlFor="fullName" className="block text-[12px] font-semibold uppercase tracking-wide mb-1.5"
                   style={{ color: T.textMuted }}>
              Full Name
            </label>
            <input
              id="fullName" type="text" placeholder="Alex Johnson"
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              required
              className={inputCls}
              style={{ borderColor: T.border, color: T.text }}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-[12px] font-semibold uppercase tracking-wide mb-1.5"
                   style={{ color: T.textMuted }}>
              Email
            </label>
            <input
              id="email" type="email" placeholder="you@school.edu"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required
              className={inputCls}
              style={{ borderColor: T.border, color: T.text }}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-[12px] font-semibold uppercase tracking-wide mb-1.5"
                   style={{ color: T.textMuted }}>
              Password
            </label>
            <input
              id="password" type="password" placeholder="At least 6 characters"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={6}
              className={inputCls}
              style={{ borderColor: T.border, color: T.text }}
            />
          </div>

          {/* Invite code */}
          <div>
            <label htmlFor="inviteCode" className="block text-[12px] font-semibold uppercase tracking-wide mb-1.5"
                   style={{ color: T.textMuted }}>
              Invite Code <span className="normal-case font-normal" style={{ color: T.textMuted }}>— optional</span>
            </label>
            <input
              id="inviteCode" type="text" placeholder="Team invite code"
              value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
              className={inputCls}
              style={{ borderColor: T.border, color: T.text }}
            />
          </div>

          {/* FERPA / Privacy notice */}
          <div className="rounded-2xl p-4 space-y-3"
               style={{ background: T.raised, border: `1px solid ${T.border}` }}>
            <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: T.textSub }}>
              Privacy Notice (FERPA)
            </p>
            <ul className="space-y-1.5">
              {[
                "Coaches see only anonymized team averages — never your individual scores",
                "Counselors may see your data only if you grant consent or an alert is triggered",
                "Journal entries are private to you only",
                "You may inspect, amend, or request deletion of your records at any time",
                "Staff may be mandatory reporters under state law",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-[11px]" style={{ color: T.textMuted }}>
                  <span className="font-bold shrink-0 mt-0.5" style={{ color: T.green }}>·</span>
                  {item}
                </li>
              ))}
            </ul>
            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="peer sr-only"
                  required
                />
                <div
                  className="h-4 w-4 rounded flex items-center justify-center transition-colors"
                  style={{
                    border: `2px solid ${consentChecked ? T.green : T.border}`,
                    background: consentChecked ? T.green : T.surface,
                  }}
                >
                  {consentChecked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-[12px] leading-relaxed font-medium" style={{ color: T.textSub }}>
                I am 18 or older. I have read the privacy notice above and agree to the{" "}
                <Link href="/terms" className="underline" style={{ color: T.green }} target="_blank">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline" style={{ color: T.green }} target="_blank">Privacy Policy</Link>
                . I understand my FERPA rights and how my wellness data will be used.
              </span>
            </label>
          </div>

          {error && (
            <p className="text-[13px] rounded-xl px-3 py-2" role="alert"
               style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !consentChecked}
            className="w-full h-11 font-semibold text-[14px] rounded-2xl text-white flex items-center justify-center transition-opacity disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #065f46, #059669)", boxShadow: "0 4px 14px rgba(5,150,105,0.25)" }}
          >
            {loading
              ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : "Create account"}
          </button>
        </form>

        <p className="text-center text-[13px] mt-5" style={{ color: T.textMuted }}>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: T.green }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
