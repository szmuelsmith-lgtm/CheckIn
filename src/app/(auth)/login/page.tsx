"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor, Mail, ChevronDown, User, Users, Stethoscope, Building2, Loader2, ArrowLeft } from "lucide-react";
import { DEMO_PASSWORD, DEMO_ACCOUNTS } from "@/lib/demo-accounts";

const DEMO_ROLE_ICONS: Record<string, React.ReactNode> = {
  athlete:      <User        className="h-4 w-4" />,
  coach:        <Users       className="h-4 w-4" />,
  psychiatrist: <Stethoscope className="h-4 w-4" />,
  admin:        <Building2   className="h-4 w-4" />,
};

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [email, setEmail]                       = useState("");
  const [password, setPassword]                 = useState("");
  const [error, setError]                       = useState("");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading]       = useState(false);
  const [resendSent, setResendSent]             = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [showDemo, setShowDemo]                 = useState(false);
  const [demoLoading, setDemoLoading]           = useState<string | null>(null);
  const [demoError, setDemoError]               = useState("");
  const router = useRouter();

  const REDIRECT_MAP: Record<string, string> = {
    athlete:       "/athlete/dashboard",
    coach:         "/coach/dashboard",
    admin:         "/admin/dashboard",
    support:       "/admin/dashboard",
    psychiatrist:  "/psychiatrist/dashboard",
    trusted_adult: "/psychiatrist/dashboard",
  };

  // Warm up the Supabase connection as soon as the login page loads
  // so the first signInWithPassword call doesn't pay the TCP/TLS setup cost.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().catch(() => {});
  }, []);

  // ── Regular login ─────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setEmailNotConfirmed(false); setLoading(true);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      if (
        authError.message.toLowerCase().includes("email not confirmed") ||
        authError.message.toLowerCase().includes("email_not_confirmed")
      ) {
        setEmailNotConfirmed(true);
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Fast path: role cached in user_metadata from a previous login
      const cachedRole = authData.user.user_metadata?.role as string | undefined;
      if (cachedRole && REDIRECT_MAP[cachedRole]) {
        router.push(REDIRECT_MAP[cachedRole]);
        return;
      }

      // Slow path: fetch role from DB (first login or legacy account)
      const { data: profile } = await supabase
        .from("profiles").select("role").eq("auth_user_id", authData.user.id).single();

      if (profile) {
        const role = (profile as { role: string }).role;
        // Cache role in metadata so next login skips this DB call
        supabase.auth.updateUser({ data: { role } }).catch(() => {});
        router.push(REDIRECT_MAP[role] || "/athlete/dashboard");
        return;
      }

      // Brand-new user — create profile
      const userName = authData.user.user_metadata?.full_name || email.split("@")[0];
      await Promise.all([
        supabase.from("profiles").insert({
          auth_user_id: authData.user.id,
          full_name: userName,
          email: authData.user.email ?? email,
          role: "athlete",
        }),
        supabase.auth.updateUser({ data: { role: "athlete" } }),
      ]);

      router.push("/athlete/dashboard");
      return;
    }

    router.push("/athlete/dashboard");
  };

  const handleResendConfirmation = async () => {
    setResendLoading(true);
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email });
    setResendLoading(false);
    setResendSent(true);
  };

  // ── Demo login ────────────────────────────────────────────────────────────
  const handleDemoLogin = async (role: typeof DEMO_ACCOUNTS[number]) => {
    setDemoLoading(role.id); setDemoError("");

    const supabase = createClient();

    // Try sign-in first; fall back to sign-up if account doesn't exist yet
    let userId: string | null = null;
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: role.email, password: DEMO_PASSWORD,
    });

    if (!signInErr && signInData.session) {
      userId = signInData.session.user.id;
    } else {
      const msg = signInErr?.message?.toLowerCase() ?? "";
      if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
        setDemoError(`Demo account not confirmed. In Supabase Dashboard → Authentication → Users, find ${role.email} and click "Confirm email".`);
        setDemoLoading(null);
        return;
      }

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: role.email, password: DEMO_PASSWORD,
        options: { data: { full_name: role.label + " Demo", role: role.id } },
      });

      if (signUpErr || !signUpData.session) {
        setDemoError(`Could not create demo account for ${role.email}. Check Supabase → Authentication → Users.`);
        setDemoLoading(null);
        return;
      }
      userId = signUpData.session.user.id;
    }

    // Ensure the profile exists with the correct role — upsert so it's self-healing
    if (userId) {
      const dbRole = role.id; // matches user_role enum: athlete | coach | psychiatrist | trusted_adult
      const { data: existing } = await supabase
        .from("profiles").select("id, role").eq("auth_user_id", userId).single();

      if (!existing) {
        await supabase.from("profiles").insert({
          auth_user_id: userId,
          full_name: role.label + " Demo",
          email: role.email,
          role: dbRole,
        });
      } else if (existing.role !== dbRole) {
        await supabase.from("profiles").update({ role: dbRole }).eq("auth_user_id", userId);
      }

      // Cache role in user metadata for fast path on next login
      supabase.auth.updateUser({ data: { role: dbRole } }).catch(() => {});
    }

    router.push(role.redirect);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "#f4f7f5" }}
    >
      {/* Back to website */}
      <div className="w-full max-w-sm mb-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to website
        </Link>
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3"
          style={{
            background: "linear-gradient(135deg, #065f46, #059669)",
            boxShadow: "0 4px 14px rgba(5,150,105,0.3)",
          }}
        >
          <Anchor className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
        <p className="text-[15px] font-bold tracking-tight" style={{ color: "#0f172a" }}>Check-In</p>
        <p className="text-[11px] tracking-widest uppercase mt-0.5" style={{ color: "#94a3b8" }}>Athlete Anchor</p>
      </div>

      {/* Login card */}
      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{
          background: "#ffffff",
          border: "1px solid #e8edf2",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <h1 className="text-[22px] font-bold tracking-tight mb-0.5" style={{ color: "#0f172a" }}>Welcome back</h1>
        <p className="text-[14px] mb-7" style={{ color: "#64748b" }}>Sign in to your account</p>

        {/* Email-not-confirmed banner */}
        {emailNotConfirmed && (
          <div
            className="mb-5 rounded-2xl p-4"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
              <div>
                <p className="text-[13px] font-semibold mb-1" style={{ color: "#92400e" }}>Confirm your email first</p>
                <p className="text-[12px] leading-relaxed mb-2" style={{ color: "#b45309" }}>
                  We sent a link to <span className="font-medium">{email}</span>.
                </p>
                {resendSent ? (
                  <p className="text-[12px] font-medium" style={{ color: "#059669" }}>✓ Confirmation email resent.</p>
                ) : (
                  <button
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="text-[12px] font-semibold hover:underline disabled:opacity-50"
                    style={{ color: "#d97706" }}
                  >
                    {resendLoading ? "Sending..." : "Resend confirmation →"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[13px] font-semibold mb-1.5" style={{ color: "#334155" }}>
              Email
            </label>
            <input
              id="email" type="email" placeholder="you@school.edu"
              value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full h-11 px-3.5 rounded-2xl text-[14px] placeholder:text-slate-400 focus:outline-none transition-all"
              style={{
                background: "#f8fafc",
                border: "1px solid #e8edf2",
                color: "#0f172a",
              }}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-semibold mb-1.5" style={{ color: "#334155" }}>
              Password
            </label>
            <input
              id="password" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full h-11 px-3.5 rounded-2xl text-[14px] placeholder:text-slate-400 focus:outline-none transition-all"
              style={{
                background: "#f8fafc",
                border: "1px solid #e8edf2",
                color: "#0f172a",
              }}
            />
          </div>

          {error && (
            <p
              className="text-[13px] px-3 py-2 rounded-xl"
              style={{ color: "#ef4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full h-11 font-bold text-[14px] text-white rounded-2xl transition-opacity disabled:opacity-60 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #065f46, #059669)",
              boxShadow: "0 3px 12px rgba(5,150,105,0.28)",
            }}
          >
            {loading
              ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : "Sign in"}
          </button>
        </form>

        <p className="text-center text-[13px] mt-5" style={{ color: "#64748b" }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold hover:underline" style={{ color: "#059669" }}>
            Sign up
          </Link>
        </p>

        {/* ── Beta / Demo logins ── */}
        <div className="mt-5 pt-5" style={{ borderTop: "1px solid #f1f5f9" }}>
          <button
            onClick={() => setShowDemo(d => !d)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-2xl text-[13px] font-semibold transition-colors"
            style={{ color: "#94a3b8" }}
          >
            Beta tester? Quick login
            <ChevronDown
              className="h-4 w-4 transition-transform duration-200"
              style={{ transform: showDemo ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {showDemo && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>
                Demo accounts
              </p>

              {DEMO_ACCOUNTS.map((role) => {
                const isLoading = demoLoading === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleDemoLogin(role)}
                    disabled={demoLoading !== null}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all disabled:opacity-60 active:scale-[0.98]"
                    style={{ background: role.bg, border: `1px solid ${role.border}` }}
                  >
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: role.color + "20", color: role.color }}
                    >
                      {isLoading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : DEMO_ROLE_ICONS[role.id]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold" style={{ color: role.color }}>
                        {isLoading ? "Signing in…" : role.label}
                      </p>
                      <p className="text-[10px] font-mono truncate" style={{ color: "#94a3b8" }}>{role.email}</p>
                    </div>
                  </button>
                );
              })}

              {demoError && (
                <p className="text-[12px] px-3 py-2 rounded-xl"
                   style={{ color: "#ef4444", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  {demoError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
