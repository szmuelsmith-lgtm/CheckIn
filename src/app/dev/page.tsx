"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Shield, User, Users, Stethoscope, UserCheck, Loader2, CheckCircle, AlertCircle } from "lucide-react";

const TEST_PASSWORD = "checkin-dev-2024";

const ROLES = [
  {
    id: "athlete",
    label: "Athlete",
    email: "athlete@checkin.dev",
    name: "Alex Athlete",
    icon: <User className="h-6 w-6" />,
    color: "emerald",
    description: "Weekly check-ins, screening, privacy hub",
    redirect: "/athlete/dashboard",
  },
  {
    id: "coach",
    label: "Coach",
    email: "coach@checkin.dev",
    name: "Chris Coach",
    icon: <Users className="h-6 w-6" />,
    color: "blue",
    description: "Anonymized team aggregate dashboard",
    redirect: "/coach/dashboard",
  },
  {
    id: "psychiatrist",
    label: "Counselor / Psychiatrist",
    email: "psych@checkin.dev",
    name: "Dr. Parker",
    icon: <Stethoscope className="h-6 w-6" />,
    color: "violet",
    description: "View check-ins for athletes who shared with you",
    redirect: "/psychiatrist/dashboard",
  },
  {
    id: "trusted_adult",
    label: "Trusted Adult",
    email: "trusted@checkin.dev",
    name: "Taylor Trusted",
    icon: <UserCheck className="h-6 w-6" />,
    color: "amber",
    description: "View check-ins shared with you by an athlete",
    redirect: "/psychiatrist/dashboard",
  },
] as const;

const COLOR_MAP = {
  emerald: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    button: "bg-emerald-600 hover:bg-emerald-700",
    icon: "bg-emerald-100 text-emerald-600",
    ring: "focus:ring-emerald-500",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    button: "bg-blue-600 hover:bg-blue-700",
    icon: "bg-blue-100 text-blue-600",
    ring: "focus:ring-blue-500",
  },
  violet: {
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    button: "bg-violet-600 hover:bg-violet-700",
    icon: "bg-violet-100 text-violet-600",
    ring: "focus:ring-violet-500",
  },
  amber: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    button: "bg-amber-500 hover:bg-amber-600",
    icon: "bg-amber-100 text-amber-600",
    ring: "focus:ring-amber-500",
  },
};

export default function DevPortalPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Record<string, "idle" | "loading" | "done" | "error">>({});
  const [messages, setMessages] = useState<Record<string, string>>({});

  async function loginAs(role: typeof ROLES[number]) {
    setStatus(s => ({ ...s, [role.id]: "loading" }));
    setMessages(m => ({ ...m, [role.id]: "" }));

    const supabase = createClient();

    // 1. Try sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: role.email,
      password: TEST_PASSWORD,
    });

    if (signInError) {
      // 2. Account doesn't exist — sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: role.email,
        password: TEST_PASSWORD,
        options: { data: { full_name: role.name } },
      });

      if (signUpError) {
        setStatus(s => ({ ...s, [role.id]: "error" }));
        setMessages(m => ({ ...m, [role.id]: signUpError.message }));
        return;
      }

      // If email confirmation is required, we can't proceed without confirming
      if (!signUpData.session) {
        setStatus(s => ({ ...s, [role.id]: "error" }));
        setMessages(m => ({
          ...m,
          [role.id]: `Check ${role.email} for a confirmation link, then come back and click this button again.`,
        }));
        return;
      }
    }

    // 3. Set the role via API
    const res = await fetch("/api/dev/set-role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: role.id }),
    });

    if (!res.ok) {
      setStatus(s => ({ ...s, [role.id]: "error" }));
      setMessages(m => ({ ...m, [role.id]: "Failed to set role. Try again." }));
      return;
    }

    setStatus(s => ({ ...s, [role.id]: "done" }));
    setTimeout(() => router.push(role.redirect), 600);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex p-3 bg-slate-100 rounded-2xl mb-4">
          <Shield className="h-8 w-8 text-slate-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Check-In Dev Portal</h1>
        <p className="text-slate-500 mt-1 text-sm">Click any role to sign in instantly as a test user.</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs text-amber-700 font-medium">Development only — do not use in production</span>
        </div>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {ROLES.map((role) => {
          const c = COLOR_MAP[role.color];
          const s = status[role.id] ?? "idle";
          return (
            <button
              key={role.id}
              onClick={() => loginAs(role)}
              disabled={s === "loading" || s === "done"}
              className={`rounded-2xl border-2 p-5 text-left transition-all focus:outline-none focus:ring-2 ${c.ring} focus:ring-offset-2
                ${s === "done"
                  ? "border-green-400 bg-green-50"
                  : s === "error"
                    ? "border-red-300 bg-red-50"
                    : `${c.border} ${c.bg} hover:shadow-md active:scale-[0.98]`}
                ${s === "loading" ? "opacity-70 cursor-wait" : ""}
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${s === "done" ? "bg-green-100 text-green-600" : c.icon}`}>
                  {s === "loading" ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : s === "done" ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    role.icon
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${s === "done" ? "text-green-700" : c.text}`}>
                    {s === "done" ? "Logged in! Redirecting..." : role.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-mono">{role.email}</p>
                  {messages[role.id] && (
                    <p className={`text-xs mt-2 ${s === "error" ? "text-red-600" : "text-slate-500"}`}>
                      {messages[role.id]}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Credentials note */}
      <div className="mt-8 bg-white border border-slate-200 rounded-xl p-4 w-full max-w-2xl">
        <p className="text-xs text-slate-500 font-medium mb-2">Test credentials (all accounts):</p>
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <span className="text-slate-400">password: </span>
            <span className="text-slate-700">{TEST_PASSWORD}</span>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <span className="text-slate-400">emails: </span>
            <span className="text-slate-700">*@checkin.dev</span>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          First-time login creates the account. If email confirmation is required, check the inbox then click again.
        </p>
      </div>

      <p className="text-xs text-slate-400 mt-6">
        Running at <span className="font-mono">localhost:3000</span> · CheckIn by Athlete Anchor
      </p>
    </div>
  );
}
