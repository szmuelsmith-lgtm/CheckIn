"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Anchor, ArrowRight, ArrowLeft, User, Trophy, Stethoscope,
  Building2, Loader2, Shield, Lock, BarChart2, Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const DEMO_PASSWORD = "checkin-dev-2024";

const DEMO_ROLES = [
  {
    id: "athlete",
    label: "Student-Athlete",
    email: "checkin.athlete.test@mailinator.com",
    icon: <User className="h-6 w-6" />,
    redirect: "/athlete/dashboard",
    color: "#059669",
    bg: "#f0fdf4",
    border: "#86efac",
    headline: "The athlete experience",
    description: "Complete a check-in, view your wellbeing trends over time, manage privacy settings, and request a confidential follow-up.",
    highlights: ["2-minute weekly check-in", "Private journal staff never see", "Your own trend charts", "One-tap follow-up request"],
  },
  {
    id: "coach",
    label: "Head Coach",
    email: "checkin.coach.test@mailinator.com",
    icon: <Trophy className="h-6 w-6" />,
    redirect: "/coach/dashboard",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#93c5fd",
    headline: "The coach experience",
    description: "See team-level completion rates and aggregate risk status. Never see individual athlete names, scores, or responses.",
    highlights: ["Team completion rate live", "Green / yellow / red distribution", "Week-over-week trend", "Zero individual athlete data"],
  },
  {
    id: "psychiatrist",
    label: "Counselor / Sport Psychologist",
    email: "checkin.psych.test@mailinator.com",
    icon: <Stethoscope className="h-6 w-6" />,
    redirect: "/psychiatrist/dashboard",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    headline: "The counselor experience",
    description: "Review athlete alerts, manage follow-up workflows, access consented wellness history, and document outcomes.",
    highlights: ["Alert queue by risk level", "Full check-in history (consented)", "Assign & track follow-ups", "Secure — no wellness data in email"],
  },
  {
    id: "admin",
    label: "Athletic Administrator",
    email: "checkin.admin.test@mailinator.com",
    icon: <Building2 className="h-6 w-6" />,
    redirect: "/admin/dashboard",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#7dd3fc",
    headline: "The administrator experience",
    description: "Program-wide dashboards, full audit logs, compliance exports, team management, and follow-up resolution analytics.",
    highlights: ["All-sport program overview", "Immutable audit log", "NCAA compliance export", "Follow-up resolution rates"],
  },
] as const;

export default function DemoPage() {
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [demoError, setDemoError] = useState("");

  const handleDemoLogin = async (role: typeof DEMO_ROLES[number]) => {
    setDemoLoading(role.id);
    setDemoError("");
    const supabase = createClient();
    let userId: string | null = null;

    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: role.email,
      password: DEMO_PASSWORD,
    });

    if (!signInErr && signInData.session) {
      userId = signInData.session.user.id;
    } else {
      const msg = signInErr?.message?.toLowerCase() ?? "";
      if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
        setDemoError("Demo account needs confirmation in Supabase Dashboard.");
        setDemoLoading(null);
        return;
      }
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: role.email,
        password: DEMO_PASSWORD,
        options: { data: { full_name: role.label + " Demo", role: role.id } },
      });
      if (signUpErr || !signUpData.session) {
        setDemoError("Demo unavailable right now. Try again in a moment.");
        setDemoLoading(null);
        return;
      }
      userId = signUpData.session.user.id;
    }

    if (userId) {
      const dbRole = role.id;
      const { data: existing } = await supabase.from("profiles").select("id, role").eq("auth_user_id", userId).single();
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
      supabase.auth.updateUser({ data: { role: dbRole } }).catch(() => {});
    }

    router.push(role.redirect);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
                 style={{ background: "linear-gradient(135deg, #065f46, #059669)", boxShadow: "0 2px 8px rgba(5,150,105,0.3)" }}>
              <Anchor className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <p className="font-semibold text-[15px] text-slate-900 tracking-tight">Check-In</p>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase">Athlete Anchor</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to website
            </Link>
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-32 pb-14 md:pt-40 md:pb-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50/80 rounded-full px-3.5 py-1.5 text-xs font-semibold text-emerald-700 mb-6 tracking-wide">
            <Shield className="h-3 w-3" /> Live Demo — Real Database, Synthetic Data
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
            Step inside the app
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed mb-6 max-w-xl mx-auto">
            Four roles. Four completely different views. Each account connects to a real database with realistic sample data — no setup, no credit card, instant access.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-slate-400">
            {["Instant sign-in", "Real data, no real athletes", "Mobile or desktop", "Switch between roles freely"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Privacy reminder ── */}
      <div className="bg-slate-900 py-3.5 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-5 flex flex-wrap justify-center gap-x-8 gap-y-1.5 text-[11px] font-semibold text-slate-400 tracking-widest uppercase">
          {[
            { icon: <Lock className="h-3 w-3" />, label: "Coach sees NO individual data" },
            { icon: <Shield className="h-3 w-3" />, label: "FERPA-aligned" },
            { icon: <BarChart2 className="h-3 w-3" />, label: "3-tier privacy enforced at DB level" },
          ].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5">{item.icon}{item.label}</span>
          ))}
        </div>
      </div>

      {/* ── Role cards ── */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-5 md:px-8">
          <div className="grid sm:grid-cols-2 gap-5">
            {DEMO_ROLES.map((role) => {
              const isLoading = demoLoading === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleDemoLogin(role)}
                  disabled={demoLoading !== null}
                  className="flex flex-col gap-4 p-6 rounded-2xl text-left transition-all disabled:opacity-60 hover:shadow-lg active:scale-[0.99] border-2 group"
                  style={{ background: role.bg, borderColor: isLoading ? role.color : role.border }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: role.color + "20", color: role.color }}>
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : role.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[16px] leading-snug" style={{ color: role.color }}>
                        {isLoading ? "Signing in…" : role.label}
                      </p>
                      <p className="text-[12px] text-slate-500 mt-0.5">{role.headline}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5" style={{ color: role.color }} />
                  </div>

                  {/* Description */}
                  <p className="text-[13px] text-slate-600 leading-relaxed">{role.description}</p>

                  {/* Highlights */}
                  <ul className="space-y-1.5 pt-1 border-t" style={{ borderColor: role.color + "25" }}>
                    {role.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-[12px] text-slate-600">
                        <Check className="h-3.5 w-3.5 shrink-0" style={{ color: role.color }} />{h}
                      </li>
                    ))}
                  </ul>

                  {/* Email */}
                  <p className="text-[10px] font-mono" style={{ color: role.color + "80" }}>{role.email}</p>
                </button>
              );
            })}
          </div>

          {demoError && (
            <p className="text-center text-[13px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mt-6 max-w-md mx-auto">
              {demoError}
            </p>
          )}

          <p className="text-center text-[12px] text-slate-400 mt-8">
            Demo accounts contain entirely synthetic data. No real athlete information is ever used.
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-14 bg-slate-50 border-t border-slate-200">
        <div className="max-w-2xl mx-auto px-5 md:px-8 text-center">
          <p className="text-slate-600 text-[15px] mb-6">
            Want to see the research behind why this exists?
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/research" className="inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-emerald-700 hover:text-emerald-800 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-6 py-2.5 rounded-xl transition-colors">
              Read the evidence base <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/" className="inline-flex items-center justify-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white hover:bg-slate-50 px-6 py-2.5 rounded-xl transition-colors">
              Back to website
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
