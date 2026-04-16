"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor, Check } from "lucide-react";
import { UserRole } from "@/types/database";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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

      orgId = invite.organization_id;
      teamId = invite.team_id;
      role = invite.role;

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
      // Try the SECURITY DEFINER RPC first (works even without an active session,
      // which happens when Supabase email confirmation is required).
      // Falls back to a direct insert (works when email confirmation is disabled).
      let profileError: { message: string } | null = null;

      const { error: rpcError } = await supabase.rpc("create_signup_profile", {
        p_auth_user_id: authData.user.id,
        p_full_name: fullName,
        p_email: email,
        p_role: role,
        p_organization_id: orgId,
        p_team_id: teamId,
      });

      if (rpcError) {
        // RPC not deployed yet — fall back to direct insert (requires active session)
        const { error: insertError } = await supabase.from("profiles").insert({
          auth_user_id: authData.user.id,
          full_name: fullName,
          email,
          role,
          organization_id: orgId,
          team_id: teamId,
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
        coach: "/coach/dashboard",
        admin: "/admin/dashboard",
        support: "/admin/dashboard",
      };
      router.push(redirectMap[role] || "/athlete/dashboard");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <Check className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
          </div>
          <h2 className="text-[20px] font-bold text-slate-900 mb-2">Check your email</h2>
          <p className="text-[14px] text-slate-500 leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="font-medium text-slate-700">{email}</span>.
            Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block mt-6 text-[13px] font-medium text-emerald-700 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="h-12 w-12 rounded-2xl bg-emerald-700 flex items-center justify-center mb-3 shadow-sm">
          <Anchor className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
        <p className="text-[15px] font-semibold text-slate-800 tracking-tight">Check-In</p>
        <p className="text-[11px] text-slate-400 tracking-widest uppercase mt-0.5">Athlete Anchor</p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight mb-1">Create account</h1>
        <p className="text-sm text-slate-500 mb-7">Join Check-In by Athlete Anchor</p>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Full name */}
          <div>
            <label htmlFor="fullName" className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              placeholder="Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Invite code */}
          <div>
            <label htmlFor="inviteCode" className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Invite Code
              <span className="text-slate-400 font-normal ml-1">— optional</span>
            </label>
            <input
              id="inviteCode"
              type="text"
              placeholder="Team invite code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* FERPA / Privacy notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">Privacy Notice (FERPA)</p>
            <ul className="space-y-1.5">
              {[
                "Coaches see only anonymized team averages — never your individual scores",
                "Counselors / support staff may see your data only if you grant consent or a health-safety alert is triggered",
                "Journal entries are private to you only",
                "You may inspect, amend, or request deletion of your records at any time",
                "Staff may be mandatory reporters under state law",
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-[11px] text-slate-600">
                  <span className="text-emerald-600 mt-0.5 shrink-0 font-bold">·</span>
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
                <div className="h-4 w-4 rounded border-2 border-slate-300 peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-colors flex items-center justify-center">
                  {consentChecked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-[12px] text-slate-700 leading-relaxed font-medium">
                I am 18 or older. I have read the privacy notice above and agree to the{" "}
                <Link href="/terms" className="text-emerald-700 underline" target="_blank">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-emerald-700 underline" target="_blank">Privacy Policy</Link>
                . I understand my FERPA rights and how my wellness data will be used and protected.
              </span>
            </label>
          </div>

          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !consentChecked}
            className="w-full h-10 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-[14px] rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="text-center text-[13px] text-slate-500 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-700 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
