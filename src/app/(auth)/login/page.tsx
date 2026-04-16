"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Anchor, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailNotConfirmed(false);
    setLoading(true);

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      // Detect "email not confirmed" specifically
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
      // Try to load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("auth_user_id", authData.user.id)
        .single();

      if (profile) {
        const redirectMap: Record<string, string> = {
          athlete: "/athlete/dashboard",
          coach: "/coach/dashboard",
          admin: "/admin/dashboard",
          support: "/admin/dashboard",
          psychiatrist: "/psychiatrist/dashboard",
          trusted_adult: "/psychiatrist/dashboard",
        };
        const role = (profile as { role: string; full_name: string }).role;
        router.push(redirectMap[role] || "/athlete/dashboard");
        return;
      }

      // Profile doesn't exist yet (signup profile creation failed) — try to create it now
      // We have a session at this point so the normal insert will work
      const userName = authData.user.user_metadata?.full_name || email.split("@")[0];
      await supabase.from("profiles").insert({
        auth_user_id: authData.user.id,
        full_name: userName,
        email: authData.user.email ?? email,
        role: "athlete",
      });

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo mark */}
      <div className="flex flex-col items-center mb-10">
        <div className="h-12 w-12 rounded-2xl bg-emerald-700 flex items-center justify-center mb-3 shadow-sm">
          <Anchor className="h-6 w-6 text-white" strokeWidth={2.5} />
        </div>
        <p className="text-[15px] font-semibold text-slate-800 tracking-tight">Check-In</p>
        <p className="text-[11px] text-slate-400 tracking-widest uppercase mt-0.5">Athlete Anchor</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight mb-1">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-7">Sign in to your account</p>

        {/* Email not confirmed banner */}
        {emailNotConfirmed && (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-amber-900 mb-1">Confirm your email first</p>
                <p className="text-[12px] text-amber-800 leading-relaxed mb-2">
                  We sent a confirmation link to <span className="font-medium">{email}</span>. Click it before signing in.
                </p>
                {resendSent ? (
                  <p className="text-[12px] text-emerald-700 font-medium">✓ Confirmation email resent.</p>
                ) : (
                  <button
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="text-[12px] text-amber-700 font-semibold hover:underline disabled:opacity-50"
                  >
                    {resendLoading ? "Sending..." : "Resend confirmation email →"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold text-[14px] rounded-lg transition-colors mt-1 flex items-center justify-center"
          >
            {loading ? (
              <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="text-center text-[13px] text-slate-500 mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-emerald-700 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
