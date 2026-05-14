"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Anchor, Check } from "lucide-react";
import { apiFetch } from "@/lib/api-url";

const T = {
  surface:   "#ffffff",
  raised:    "#f8fafc",
  border:    "#e8edf2",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#059669",
  greenDeep: "#065f46",
};

const inputCls = "w-full h-11 px-3.5 rounded-xl border text-[13px] bg-white focus:outline-none transition-colors";

// Inner component so useSearchParams works inside Suspense
function SignupForm() {
  const [fullName, setFullName]             = useState("");
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [inviteCode, setInviteCode]         = useState("");
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [success, setSuccess]               = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const router    = useRouter();
  const params    = useSearchParams();

  // Pre-fill invite code from ?invite= URL param
  useEffect(() => {
    const code = params.get("invite") ?? params.get("code") ?? params.get("i");
    if (code) setInviteCode(code.toUpperCase());
  }, [params]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const code = inviteCode.trim().toUpperCase();

    if (code) {
      // ── Invite-code path: server creates confirmed user → immediate login ──
      try {
        const res  = await apiFetch("/api/auth/invite-signup", {
          method: "POST",
          body: JSON.stringify({ email, password, fullName, inviteCode: code }),
        });
        const json = await res.json();

        if (!res.ok) {
          setError(json.error ?? "Sign-up failed. Please try again.");
          setLoading(false);
          return;
        }

        // Account is pre-confirmed — sign in immediately
        const supabase = createClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          setError("Account created but sign-in failed. Please go to the login page.");
          setLoading(false);
          return;
        }

        const redirectMap: Record<string, string> = {
          athlete:       "/athlete/dashboard",
          coach:         "/coach/dashboard",
          admin:         "/admin/dashboard",
          support:       "/admin/dashboard",
          psychiatrist:  "/psychiatrist/dashboard",
          trusted_adult: "/psychiatrist/dashboard",
        };
        router.push(redirectMap[json.role] ?? "/athlete/dashboard");
        return;
      } catch {
        setError("Network error. Please check your connection and try again.");
        setLoading(false);
        return;
      }
    }

    // ── No invite code: standard Supabase signup → email confirmation ──
    const supabase = createClient();

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
      const { error: rpcError } = await supabase.rpc("create_signup_profile", {
        p_auth_user_id:    authData.user.id,
        p_full_name:       fullName,
        p_email:           email,
        p_role:            "athlete",
        p_organization_id: null,
        p_team_id:         null,
      });

      if (rpcError) {
        await supabase.from("profiles").insert({
          auth_user_id: authData.user.id,
          full_name:    fullName,
          email,
          role:         "athlete",
        });
      }

      setSuccess(true);
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
          <Link href="/login" className="inline-block mt-6 text-[13px] font-medium hover:underline" style={{ color: T.green }}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  const hasInvite = inviteCode.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: T.raised }}>
      {/* Logo */}
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
        <p className="text-[13px] mb-7" style={{ color: T.textMuted }}>
          {hasInvite ? "You've been invited — fill in your details to get started." : "Join Check-In by Athlete Anchor"}
        </p>

        {/* Invite banner */}
        {hasInvite && (
          <div className="mb-5 rounded-2xl px-4 py-3 flex items-center gap-3"
               style={{ background: "#f0fdf4", border: "1px solid #86efac" }}>
            <Check className="h-4 w-4 shrink-0" style={{ color: T.green }} />
            <div>
              <p className="text-[12px] font-semibold" style={{ color: "#065f46" }}>Invite code applied</p>
              <p className="text-[11px] font-mono" style={{ color: T.textMuted }}>{inviteCode.trim().toUpperCase()}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Full name */}
          <div>
            <label htmlFor="fullName" className="block text-[12px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: T.textMuted }}>
              Full Name
            </label>
            <input
              id="fullName" type="text" placeholder="Alex Johnson"
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              required className={inputCls} style={{ borderColor: T.border, color: T.text }}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-[12px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: T.textMuted }}>
              Email
            </label>
            <input
              id="email" type="email" placeholder="you@school.edu"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required className={inputCls} style={{ borderColor: T.border, color: T.text }}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-[12px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: T.textMuted }}>
              Password
            </label>
            <input
              id="password" type="password" placeholder="At least 6 characters"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={6} className={inputCls} style={{ borderColor: T.border, color: T.text }}
            />
          </div>

          {/* Invite code — hidden if pre-filled from URL, editable otherwise */}
          {!hasInvite ? (
            <div>
              <label htmlFor="inviteCode" className="block text-[12px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: T.textMuted }}>
                Invite Code <span className="normal-case font-normal">— optional</span>
              </label>
              <input
                id="inviteCode" type="text" placeholder="Team invite code"
                value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className={inputCls} style={{ borderColor: T.border, color: T.text }}
              />
            </div>
          ) : null}

          {/* FERPA / Privacy notice */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: T.raised, border: `1px solid ${T.border}` }}>
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
                  type="checkbox" checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="peer sr-only" required
                />
                <div className="h-4 w-4 rounded flex items-center justify-center transition-colors"
                     style={{ border: `2px solid ${consentChecked ? T.green : T.border}`, background: consentChecked ? T.green : T.surface }}>
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
              : hasInvite ? "Join now" : "Create account"}
          </button>
        </form>

        <p className="text-center text-[13px] mt-5" style={{ color: T.textMuted }}>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: T.green }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
