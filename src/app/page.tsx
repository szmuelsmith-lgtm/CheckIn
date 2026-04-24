"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock, ArrowRight, Check, Eye, Users, ClipboardCheck, TrendingUp,
  Heart, Anchor, Shield, AlertTriangle, BookOpen, BarChart2,
  Zap, Bell, FileCheck, Activity, ChevronDown, User, Stethoscope,
  Loader2, Building2, Trophy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Demo accounts (mirrors login page) ─────────────────────────────────────
const DEMO_PASSWORD = "checkin-dev-2024";

const DEMO_ROLES = [
  {
    id: "athlete",
    label: "Athlete",
    email: "checkin.athlete.test@mailinator.com",
    icon: <User className="h-5 w-5" />,
    redirect: "/athlete/dashboard",
    color: "#059669",
    bg: "#f0fdf4",
    border: "#86efac",
    description: "Complete a check-in, view your wellbeing trends, manage privacy settings.",
  },
  {
    id: "coach",
    label: "Coach",
    email: "checkin.coach.test@mailinator.com",
    icon: <Trophy className="h-5 w-5" />,
    redirect: "/coach/dashboard",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#93c5fd",
    description: "See team completion rates and aggregate risk status — zero individual details.",
  },
  {
    id: "psychiatrist",
    label: "Psychiatrist / Counselor",
    email: "checkin.psych.test@mailinator.com",
    icon: <Stethoscope className="h-5 w-5" />,
    redirect: "/psychiatrist/dashboard",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    description: "Review athlete alerts, follow-up workflows, and consented wellness data.",
  },
  {
    id: "admin",
    label: "Athletic Administrator",
    email: "checkin.admin.test@mailinator.com",
    icon: <Building2 className="h-5 w-5" />,
    redirect: "/admin/dashboard",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#7dd3fc",
    description: "Manage teams, audit logs, compliance reporting, and org-wide analytics.",
  },
] as const;

// ─── Main page ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [demoError, setDemoError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; isNative?: boolean } }).Capacitor;
    const isNative =
      cap?.isNativePlatform?.() === true ||
      cap?.isNative === true ||
      window.location.protocol === "capacitor:" ||
      (window.location.hostname === "localhost" && window.location.port === "");

    if (isNative) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  const handleDemoLogin = async (role: typeof DEMO_ROLES[number]) => {
    setDemoLoading(role.id);
    setDemoError("");

    const supabase = createClient();
    let userId: string | null = null;

    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: role.email, password: DEMO_PASSWORD,
    });

    if (!signInErr && signInData.session) {
      userId = signInData.session.user.id;
    } else {
      const msg = signInErr?.message?.toLowerCase() ?? "";
      if (msg.includes("email not confirmed") || msg.includes("email_not_confirmed")) {
        setDemoError(`Demo account needs confirmation in Supabase Dashboard.`);
        setDemoLoading(null);
        return;
      }
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: role.email, password: DEMO_PASSWORD,
        options: { data: { full_name: role.label + " Demo", role: role.id } },
      });
      if (signUpErr || !signUpData.session) {
        setDemoError(`Demo unavailable right now. Try again in a moment.`);
        setDemoLoading(null);
        return;
      }
      userId = signUpData.session.user.id;
    }

    if (userId) {
      const dbRole = role.id === "admin" ? "admin" : role.id;
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
      supabase.auth.updateUser({ data: { role: dbRole } }).catch(() => {});
    }

    router.push(role.redirect);
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ─── Nav ─── */}
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
          <nav className="hidden md:flex items-center gap-7 text-sm text-slate-500">
            <a href="#problem" className="hover:text-slate-800 transition-colors">The Problem</a>
            <a href="#solution" className="hover:text-slate-800 transition-colors">Solution</a>
            <a href="#compliance" className="hover:text-slate-800 transition-colors">Compliance</a>
            <a href="#demo" className="hover:text-slate-800 transition-colors">Live Demo</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <a href="#demo"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg transition-colors">
              Try Demo
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_60%_-10%,rgba(16,185,129,0.07),transparent)]" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-emerald-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-5 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50/80 rounded-full px-3.5 py-1.5 text-xs font-semibold text-emerald-700 mb-8 tracking-wide">
            <Shield className="h-3 w-3" />
            NCAA-Mandated Athlete Mental Health Monitoring — Built Right
          </div>

          <h1 className="text-5xl md:text-[66px] lg:text-[74px] font-bold text-slate-900 tracking-[-0.03em] leading-[1.04] mb-6">
            35% of college athletes
            <br className="hidden md:block" />{" "}
            <span className="text-emerald-700">are struggling silently.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-4">
            Annual screenings catch them once a year. Weekly check-ins catch them before it&apos;s too late.
            Check-In gives every athletic program the infrastructure to know, act, and document — before a crisis becomes a headline.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mt-8">
            <a href="#demo"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md w-full sm:w-auto justify-center">
              Try Live Demo
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/signup"
              className="inline-flex items-center justify-center text-[15px] font-medium text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-400 px-7 py-3.5 rounded-xl transition-colors w-full sm:w-auto bg-white">
              Start Free 30-Day Pilot
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-x-7 gap-y-2 mt-8 text-sm text-slate-400">
            {[
              "2-minute weekly check-ins",
              "FERPA & NCAA compliant",
              "Athlete-controlled privacy",
              "Zero setup cost to pilot",
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust bar ─── */}
      <div className="bg-slate-900 py-4 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-5 flex flex-wrap justify-center gap-x-10 gap-y-2 text-[12px] font-semibold text-slate-400 tracking-widest uppercase">
          {["FERPA-Aligned", "NCAA Best Practices", "SOC 2 Ready Architecture", "AES-256 Encrypted", "Immutable Audit Logs", "HIPAA-Inspired Safeguards"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* ─── By The Numbers ─── */}
      <section id="problem" className="py-20 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-rose-600 tracking-widest uppercase mb-3">The Data</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              The mental health crisis in college athletics is documented. And largely undetected.
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto text-[15px] leading-relaxed">
              These are not projections. These are peer-reviewed findings and NCAA survey data that athletic programs across the country are already sitting with.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                stat: "35%",
                label: "of elite athletes meet diagnostic criteria for anxiety or depression",
                source: "IOC Mental Health in Elite Athletes Consensus Statement, 2019",
                color: "#dc2626",
              },
              {
                stat: "~10%",
                label: "of student-athletes who struggle actually seek help from a mental health professional",
                source: "NCAA Student-Athlete Well-Being Study, 2021",
                color: "#d97706",
              },
              {
                stat: "1 in 3",
                label: "college athletes report depression significant enough to affect academic or athletic performance",
                source: "NCAA Mental Health Task Force, 2020",
                color: "#dc2626",
              },
              {
                stat: "11 years",
                label: "average gap between mental health symptom onset and first treatment in college-age populations",
                source: "National Alliance on Mental Illness (NAMI), 2022",
                color: "#7c3aed",
              },
              {
                stat: "2nd",
                label: "leading cause of death among college students is suicide — ahead of accidents at some institutions",
                source: "CDC / American College Health Association",
                color: "#dc2626",
              },
              {
                stat: "1 per year",
                label: "is how often most athletic programs formally screen for mental health. Once. Per. Year.",
                source: "NCAA Inter-Association Consensus Document, 2016",
                color: "#0369a1",
              },
            ].map((s) => (
              <div key={s.stat} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p className="text-[46px] font-bold tracking-tight leading-none mb-2" style={{ color: s.color }}>{s.stat}</p>
                <p className="text-[14px] font-medium text-slate-800 leading-snug mb-3">{s.label}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">{s.source}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The Gap ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-rose-600 tracking-widest uppercase mb-4">The Unacceptable Gap</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
                Annual screenings capture a moment. Athletes struggle across an entire season.
              </h2>
              <p className="text-slate-500 text-[15px] leading-relaxed mb-6">
                The NCAA recommends mental health screening as part of preparticipation exams — but those happen once at the start of the academic year. An athlete who is thriving in September may be in crisis by November. Without weekly touchpoints, staff have no visibility until the athlete self-reports, a coach notices a performance drop, or something far worse occurs.
              </p>
              <p className="text-slate-500 text-[15px] leading-relaxed mb-6">
                Research consistently shows athletes are <strong className="text-slate-800">less likely to self-report</strong> than the general student population. Stigma, identity threats (&ldquo;athletes are supposed to be tough&rdquo;), and fear of losing playing time create a wall of silence. The only way to break through that wall is to reduce the friction of disclosure to near zero — and to make check-ins a normal, weekly part of being on the team.
              </p>
              <p className="text-slate-500 text-[15px] leading-relaxed">
                Check-In does exactly that. A 2-minute check-in every week. Structured. Private. Analyzed. Acted on.
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  label: "Current state",
                  title: "Annual pre-participation physical",
                  desc: "One screening per year. 30 seconds on a paper form. No trending, no follow-up workflow, no documentation trail.",
                  bad: true,
                },
                {
                  label: "The gap",
                  title: "8 months of silence",
                  desc: "Between September and May, athletes face injury pressure, academic stress, social isolation, and identity struggles — with zero structured touchpoints.",
                  bad: true,
                },
                {
                  label: "With Check-In",
                  title: "52 structured check-ins per year",
                  desc: "Weekly 2-minute check-ins across four pillars. Automatic risk scoring. Instant alerts. Documented follow-ups. Trend detection over weeks, not just snapshots.",
                  bad: false,
                },
              ].map((item) => (
                <div key={item.title} className={`rounded-2xl border p-5 ${item.bad ? "border-rose-200 bg-rose-50/40" : "border-emerald-200 bg-emerald-50/40"}`}>
                  <p className={`text-[10px] font-bold tracking-widest uppercase mb-1 ${item.bad ? "text-rose-500" : "text-emerald-600"}`}>{item.label}</p>
                  <p className={`font-semibold text-[15px] mb-1.5 ${item.bad ? "text-rose-900" : "text-emerald-900"}`}>{item.title}</p>
                  <p className={`text-[13px] leading-relaxed ${item.bad ? "text-rose-700" : "text-emerald-700"}`}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stakes / Liability ─── */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-rose-400 tracking-widest uppercase mb-3">Institutional Stakes</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              This isn&apos;t optional. It&apos;s a legal, ethical, and institutional obligation.
            </h2>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-[15px] leading-relaxed">
              The regulatory and liability landscape around athlete mental health has fundamentally shifted. Programs that treat wellness monitoring as optional are taking on significant, measurable risk.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-10">
            {[
              {
                icon: <Trophy className="h-5 w-5" />,
                title: "NCAA Constitution & Mental Health Mandate",
                body: "NCAA Constitution Article 2.2 requires member institutions to protect the health and welfare of student-athletes. The 2016 Inter-Association Consensus Document on Mental Health Best Practices establishes structured screening, referral pathways, and follow-up documentation as expected best practices — not suggestions. The 2020 NCAA Mental Health Best Practices explicitly recommends ongoing, not just annual, monitoring.",
                accent: "#f59e0b",
              },
              {
                icon: <AlertTriangle className="h-5 w-5" />,
                title: "Negligence Liability & Litigation Exposure",
                body: "Multiple Power 5 programs have faced multimillion-dollar lawsuits for failure to adequately monitor and respond to athlete mental health distress. When an athlete experiences a mental health crisis and the institution cannot demonstrate a documented monitoring, alert, and follow-up trail, the legal exposure is severe. Documentation is protection. The absence of documentation is the case.",
                accent: "#ef4444",
              },
              {
                icon: <FileCheck className="h-5 w-5" />,
                title: "Title IX Counseling Obligations",
                body: "Title IX requires institutions to provide equitable access to mental health support. Programs that systematically fail to identify at-risk athletes — particularly where disparities exist across gender, race, or scholarship status — face both compliance risk and reputational damage. Documented screening and equitable follow-up workflows are increasingly central to Title IX compliance reviews.",
                accent: "#8b5cf6",
              },
              {
                icon: <BookOpen className="h-5 w-5" />,
                title: "FERPA & Data Privacy Obligations",
                body: "Student-athlete wellness data is an education record under FERPA. Institutions that collect mental health data without appropriate access controls, audit trails, and data governance are creating compliance liability. A single breach — a coach accessing data they shouldn't, or a counselor's notes reaching the wrong person — creates federal compliance exposure and destroys athlete trust program-wide.",
                accent: "#0ea5e9",
              },
            ].map((item) => (
              <div key={item.title} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: item.accent + "20", color: item.accent }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-[15px] mb-2 leading-snug">{item.title}</h3>
                    <p className="text-slate-400 text-[13px] leading-relaxed">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-rose-900/30 border border-rose-700/40 rounded-2xl p-6 text-center">
            <p className="text-rose-300 font-semibold text-[15px] mb-1">
              The question isn&apos;t whether your institution can afford Check-In.
            </p>
            <p className="text-rose-400 text-[14px]">
              It&apos;s whether your institution can afford the first settlement, the first headline, and the first recruiting class that hears an athlete at your school didn&apos;t get the support they needed.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Solution ─── */}
      <section id="solution" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">The Solution</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Check-In: The complete athlete wellness infrastructure
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto text-[15px] leading-relaxed">
              Not a survey tool. Not a wellness app. A fully integrated monitoring, alerting, follow-up, and compliance documentation system — built specifically for the architecture of collegiate athletics.
            </p>
          </div>

          {/* How it works */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                step: "01",
                icon: <Activity className="h-5 w-5 text-emerald-600" />,
                title: "Athletes check in weekly",
                desc: "A 2-minute check-in covering four evidence-based pillars: Emotional wellbeing, Resilience, Recovery, and Support satisfaction. Opens on any phone, no app store required. Installs like a native app.",
              },
              {
                step: "02",
                icon: <Bell className="h-5 w-5 text-amber-600" />,
                title: "System scores and alerts",
                desc: "Automatic risk scoring identifies athletes with declining trends or acute distress. Structured alerts reach the right staff — counselors, athletic trainers, administrators — with full context. Nothing is missed.",
              },
              {
                step: "03",
                icon: <ClipboardCheck className="h-5 w-5 text-sky-600" />,
                title: "Documented follow-up",
                desc: "Every alert generates a structured follow-up workflow. Staff log their response, the outcome, and any escalations. The result is a complete, auditable paper trail that protects the institution and the athlete.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 tracking-widest font-mono">{item.step}</p>
                </div>
                <h3 className="text-[17px] font-semibold text-slate-900 mb-2 leading-snug">{item.title}</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Four pillars */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 md:p-10">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Four Pillars</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">What gets measured</h3>
            <p className="text-slate-500 text-[14px] leading-relaxed mb-8 max-w-2xl">
              Every check-in covers four clinically grounded dimensions. Together they provide a comprehensive wellbeing picture that no single metric could capture.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  name: "Emotional",
                  color: "#dc2626",
                  bg: "#fef2f2",
                  border: "#fecaca",
                  desc: "Mood, anxiety, sadness, emotional overwhelm. The inner landscape that drives everything else.",
                },
                {
                  name: "Resilience",
                  color: "#d97706",
                  bg: "#fffbeb",
                  border: "#fde68a",
                  desc: "Confidence, sense of purpose, ability to bounce back from setbacks and failure.",
                },
                {
                  name: "Recovery",
                  color: "#0d9488",
                  bg: "#f0fdfa",
                  border: "#99f6e4",
                  desc: "Sleep quality, physical recovery, energy levels, nutrition and body relationship.",
                },
                {
                  name: "Support",
                  color: "#7c3aed",
                  bg: "#faf5ff",
                  border: "#ddd6fe",
                  desc: "Relationships, team connection, family bonds, access to help when needed.",
                },
              ].map((p) => (
                <div key={p.name} className="rounded-2xl border p-4" style={{ background: p.bg, borderColor: p.border }}>
                  <div className="h-2 w-8 rounded-full mb-3" style={{ background: p.color }} />
                  <p className="font-bold text-[15px] mb-1.5" style={{ color: p.color }}>{p.name}</p>
                  <p className="text-[12px] leading-relaxed text-slate-600">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Privacy model ─── */}
      <section className="py-24 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Privacy Architecture</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Why athletes actually use it: they trust it
            </h2>
          </div>
          <p className="text-slate-500 text-[15px] leading-relaxed max-w-2xl mx-auto text-center mb-4">
            The single biggest predictor of check-in participation is whether athletes believe their data is safe. Every competitor in this space has broken that trust by giving coaches access to individual responses. Check-In doesn&apos;t.
          </p>
          <p className="text-slate-500 text-[15px] leading-relaxed max-w-2xl mx-auto text-center mb-14">
            Our three-tier privacy model is enforced at the database level using Row-Level Security policies — not just UI gates. Coaches <em>cannot</em> see individual athlete responses, even if they tried.
          </p>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              {
                tier: "Private",
                who: "Athlete only",
                icon: <Lock className="h-4 w-4" />,
                items: ["Free-text journal entries", "Detailed question responses", "Personal notes & flags", "Faith / relationship dimensions", "Direct follow-up requests"],
                detail: "Athletes can write anything knowing it will never reach a coach. This is the trust foundation. Without it, athletes curate their answers — and the data is useless.",
                color: "#059669", dotBg: "#f0fdf4", dotBorder: "#86efac",
              },
              {
                tier: "Support",
                who: "Licensed counselor + Admin",
                icon: <Stethoscope className="h-4 w-4" />,
                items: ["Full alert details & scores", "Individual risk levels", "Trigger type identification", "Crisis indicators", "Follow-up assignment & tracking"],
                detail: "Mental health professionals and authorized administrators see what they need to act. Consent is required for counselors — athletes choose who accesses their full data.",
                color: "#7c3aed", dotBg: "#f5f3ff", dotBorder: "#c4b5fd",
              },
              {
                tier: "Coach",
                who: "Coaching staff only",
                icon: <BarChart2 className="h-4 w-4" />,
                items: ["Team completion rate %", "Aggregate risk distribution", "Team-level trend charts", "Week-over-week averages", "No names. No scores. Ever."],
                detail: "Coaches see their team's aggregate health — enough to know when to adjust practice load or create space for conversations. Never enough to single out individuals.",
                color: "#0369a1", dotBg: "#f0f9ff", dotBorder: "#7dd3fc",
              },
            ].map((tier) => (
              <div key={tier.tier} className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: tier.dotBorder }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: tier.dotBg, color: tier.color }}>
                    {tier.icon}
                  </div>
                  <span className="font-bold text-[13px]" style={{ color: tier.color }}>{tier.tier}</span>
                </div>
                <p className="text-[12px] font-medium text-slate-400 mb-4">{tier.who}</p>
                <ul className="space-y-2 mb-4">
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-slate-700">
                      <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: tier.color }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-[12px] text-slate-500 leading-relaxed italic border-t border-slate-100 pt-4">{tier.detail}</p>
              </div>
            ))}
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center max-w-2xl mx-auto">
            <p className="text-emerald-800 font-semibold text-[14px]">
              Privacy is enforced at the database layer — not the UI.
            </p>
            <p className="text-emerald-700 text-[13px] mt-1">
              Every query runs through Supabase Row-Level Security policies. A coach account cannot query athlete-level data regardless of what they type into the app. The architecture makes violations technically impossible, not just prohibited.
            </p>
          </div>
        </div>
      </section>

      {/* ─── For every stakeholder ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Built for Every Role</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              One platform. Four distinct, role-appropriate experiences.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              {
                role: "Student-Athlete",
                icon: <User className="h-5 w-5" />,
                color: "#059669",
                bg: "#f0fdf4",
                border: "#86efac",
                points: [
                  "2-minute weekly check-in — feels like a text, not a survey",
                  "Private journal with zero staff access",
                  "Full control over who sees what",
                  "Trends dashboard: see your own wellbeing data over time",
                  "Request follow-up privately, on your terms",
                  "Installs to phone home screen — no App Store required",
                ],
              },
              {
                role: "Head Coach / Coaching Staff",
                icon: <Trophy className="h-5 w-5" />,
                color: "#0369a1",
                bg: "#f0f9ff",
                border: "#7dd3fc",
                points: [
                  "Real-time team completion rate dashboard",
                  "Color-coded aggregate risk distribution (green/yellow/red)",
                  "Week-over-week trend visibility for the entire roster",
                  "Never sees individual athlete names, scores, or responses",
                  "Knows when to adjust load — without invading privacy",
                  "Automatically logged for institutional compliance records",
                ],
              },
              {
                role: "Athletic Counselor / Sport Psychologist",
                icon: <Stethoscope className="h-5 w-5" />,
                color: "#7c3aed",
                bg: "#faf5ff",
                border: "#ddd6fe",
                points: [
                  "Structured alert queue with risk level and context",
                  "Full check-in history for consented athletes",
                  "Assign, track, and close follow-ups with documentation",
                  "Consent-gated access — athlete chooses what to share",
                  "Trend data across 4 pillars for clinical intake context",
                  "Secure messaging and case notes — never in email",
                ],
              },
              {
                role: "Athletic Administrator / AD",
                icon: <Building2 className="h-5 w-5" />,
                color: "#d97706",
                bg: "#fffbeb",
                border: "#fde68a",
                points: [
                  "Program-wide completion and risk dashboards",
                  "Full audit log: every action, every access, timestamped",
                  "Team and roster management across all sports",
                  "Compliance documentation export for NCAA reviews",
                  "Follow-up resolution rate and response time analytics",
                  "Division, conference, and multi-sport organization support",
                ],
              },
            ].map((item) => (
              <div key={item.role} className="rounded-2xl border p-6" style={{ background: item.bg, borderColor: item.border }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.color + "20", color: item.color }}>
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-[15px]" style={{ color: item.color }}>{item.role}</h3>
                </div>
                <ul className="space-y-2">
                  {item.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-[13px] text-slate-700">
                      <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: item.color }} />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Platform Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Everything a program needs. Nothing it doesn&apos;t.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: <TrendingUp className="h-[18px] w-[18px]" />,
                title: "Longitudinal trend detection",
                desc: "Spot a declining pattern across 4 weeks, not just a bad Tuesday. Weekly data compounds into clinical-grade trend intelligence.",
              },
              {
                icon: <Zap className="h-[18px] w-[18px]" />,
                title: "Real-time risk scoring",
                desc: "Every check-in is automatically scored across all four pillars. Staff receive instant alerts when any athlete crosses a risk threshold.",
              },
              {
                icon: <Bell className="h-[18px] w-[18px]" />,
                title: "Zero wellness data in email",
                desc: "Notification emails contain only action prompts. Zero wellness content. Staff must authenticate to access details — protecting both FERPA and athlete dignity.",
              },
              {
                icon: <ClipboardCheck className="h-[18px] w-[18px]" />,
                title: "Structured follow-up workflows",
                desc: "Alerts become assigned follow-ups. Follow-ups have owners, due dates, and resolution requirements. The audit trail proves every concern was addressed.",
              },
              {
                icon: <Eye className="h-[18px] w-[18px]" />,
                title: "Non-surveillance visibility",
                desc: "Coaches see trends, not individuals. Programs get the early warning they need without creating a surveillance culture that destroys trust.",
              },
              {
                icon: <Activity className="h-[18px] w-[18px]" />,
                title: "Native app experience, zero friction",
                desc: "Installs directly to the athlete's phone home screen. No App Store. No account creation friction. Opens in under 2 seconds. Completion rates reflect it.",
              },
              {
                icon: <Heart className="h-[18px] w-[18px]" />,
                title: "Optional dimensions — athlete-chosen",
                desc: "Faith, family, romantic relationship, and academic stress check-ins are available but never required. Athlete selects which dimensions to include. Always.",
              },
              {
                icon: <Shield className="h-[18px] w-[18px]" />,
                title: "Immutable audit logs",
                desc: "Every data access, every alert, every follow-up action is logged and timestamped. Immutable records that protect the institution in any review or litigation.",
              },
              {
                icon: <Users className="h-[18px] w-[18px]" />,
                title: "Multi-sport, multi-team architecture",
                desc: "One platform for every team in the program. Athletes on multiple teams. Season tracking. Active/inactive rosters. Division and conference metadata.",
              },
            ].map((f) => (
              <div key={f.title} className="group p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-200 hover:shadow-[0_4px_24px_-4px_rgba(16,185,129,0.1)] transition-all duration-200">
                <div className="inline-flex p-2 rounded-lg bg-emerald-50 text-emerald-600 mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[15px] text-slate-900 mb-1.5 leading-snug">{f.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Compliance ─── */}
      <section id="compliance" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Compliance & Institutional Protection</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Every regulatory angle. Covered.
            </h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto text-[15px] leading-relaxed">
              Check-In was architected from day one for the compliance environment of higher education. Not retrofitted. Not bolt-on.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                title: "FERPA",
                subtitle: "Family Educational Rights and Privacy Act",
                body: "Athlete wellness data is treated as an education record. Strict access controls, consent-based data sharing, audit logging, and the ability for athletes to review their own records. Institutions remain the data controller.",
                badge: "Aligned",
                badgeColor: "#059669",
              },
              {
                title: "NCAA",
                subtitle: "Mental Health Best Practices & Constitution Art. 2.2",
                body: "Directly addresses the 2016 Inter-Association Consensus Document requirements and the 2020 NCAA Mental Health Best Practices. Weekly monitoring, structured referral pathways, follow-up documentation — the full framework.",
                badge: "Compliant",
                badgeColor: "#0369a1",
              },
              {
                title: "HIPAA",
                subtitle: "HIPAA-Inspired Safeguards",
                body: "Check-In is not a covered entity (not medical/diagnostic). However, the platform implements HIPAA-inspired safeguards: minimum necessary access, secure transmission, access controls, and audit logs. BAA available if needed for counseling integrations.",
                badge: "Safeguarded",
                badgeColor: "#7c3aed",
              },
              {
                title: "Title IX",
                subtitle: "Equitable Access & Mandatory Reporting",
                body: "Platform provides equitable monitoring across all teams and genders. Transparent mandatory reporting notice is presented to athletes. Platform directs athletes to confidential resources and never obscures counselors' mandated reporting obligations.",
                badge: "Addressed",
                badgeColor: "#d97706",
              },
              {
                title: "SOC 2",
                subtitle: "Security Architecture",
                body: "Built on SOC 2 Type II certified infrastructure (Supabase / AWS). AES-256 encryption at rest. TLS 1.3 in transit. Row-level database security. Isolated per-organization data. Suitable for institutional IT security review.",
                badge: "Ready",
                badgeColor: "#059669",
              },
              {
                title: "State Privacy",
                subtitle: "CCPA, SOPIPA & More",
                body: "Addresses CCPA/CPRA for California institutions. SOPIPA compliance for student data. State-level breach notification obligations. Mental health confidentiality laws. Multi-state legal review baked into the privacy policy and data practices.",
                badge: "Covered",
                badgeColor: "#0369a1",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-[15px] text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2" style={{ background: item.badgeColor + "15", color: item.badgeColor }}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-[13px] text-slate-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link href="/compliance" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-5 py-2.5 rounded-xl transition-colors">
              Read the full compliance documentation
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Market opportunity ─── */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-emerald-400 tracking-widest uppercase mb-3">Market Opportunity</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              2,000+ institutions. 800,000+ athletes. Zero adequate solutions.
            </h2>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-[15px] leading-relaxed">
              The market for athlete mental health infrastructure is at an inflection point. NCAA mandates are creating institutional urgency. The platforms that exist today are either generic wellness apps that ignore compliance, or EHR systems too complex and clinical for athletic programs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {[
              { number: "1,100+", label: "NCAA member institutions", sub: "Div I, II, and III" },
              { number: "500+", label: "NJCAA member institutions", sub: "Community & 2-year colleges" },
              { number: "250+", label: "NAIA member institutions", sub: "Small college athletics" },
              { number: "800K+", label: "Student-athletes", sub: "NCAA alone, across all sports" },
            ].map((s) => (
              <div key={s.number} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center">
                <p className="text-[36px] font-bold text-white tracking-tight">{s.number}</p>
                <p className="text-slate-300 font-medium text-[13px] mt-1">{s.label}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: "Regulatory tailwind",
                body: "NCAA mental health mandates, increasing litigation, and Title IX scrutiny are creating institutional urgency that doesn't exist in general wellness markets. Programs are actively looking for compliant solutions now.",
                color: "#f59e0b",
              },
              {
                title: "No credible incumbent",
                body: "General wellness apps (Headspace, Calm) have no athletic compliance infrastructure. EHR systems (Meditech, Epic) are overkill and clinically focused. Athletic-specific players are either outdated or lack the privacy architecture athletes require.",
                color: "#0ea5e9",
              },
              {
                title: "Recurring institutional revenue",
                body: "Athletic programs operate on annual budgets with multi-year commitments. A program that adopts Check-In builds workflow dependency, compliance documentation trails, and athlete trust — creating durable, high-retention revenue.",
                color: "#10b981",
              },
            ].map((item) => (
              <div key={item.title} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
                <div className="h-1 w-10 rounded-full mb-4" style={{ background: item.color }} />
                <h3 className="font-semibold text-white text-[15px] mb-2">{item.title}</h3>
                <p className="text-slate-400 text-[13px] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-5 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Common Questions</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">What programs ask us</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: "How is this different from the mental health screening we already do?",
                a: "Annual pre-participation screenings capture a single moment. Check-In captures 52 moments per year and analyzes trends across all of them. The screening you do in August cannot tell you an athlete is struggling in February. Ours can — and it alerts the right staff member before it becomes a crisis.",
              },
              {
                q: "Will athletes actually use it?",
                a: "Participation hinges on two things: friction and trust. Check-In reduces friction to under 2 minutes on their phone — no login page, installs like a native app. It builds trust through a privacy architecture that athletes can understand in 30 seconds: coaches never see individual responses. Programs that launch with a clear team introduction see 80%+ completion rates in early beta cohorts.",
              },
              {
                q: "What does 'FERPA-aligned' actually mean in practice?",
                a: "It means athlete wellness data is treated as an education record: strict role-based access, consent-based sharing with counselors, full audit logging of every access, and the ability for athletes to review their own data. Your institution remains the data controller. We are the data processor. A Data Processing Agreement is provided to every institution.",
              },
              {
                q: "Does Check-In replace our athletic trainer or counseling staff?",
                a: "Absolutely not — and it's designed so that it cannot. Check-In is early detection infrastructure. It surfaces signals for trained professionals to act on. The follow-up workflow requires a human decision-maker. Counselors, athletic trainers, and mental health professionals are the response layer. Check-In is the radar.",
              },
              {
                q: "What happens if an athlete is in acute crisis?",
                a: "Check-In is not a crisis intervention tool and is designed to be transparent about that. When athletes indicate acute distress, they are immediately shown crisis resources (988, local counseling) alongside staff notification. The platform is the early warning system — not the response. Crisis response protocols remain with your staff.",
              },
              {
                q: "How long does it take to set up for a team?",
                a: "Pilot with one team: under 30 minutes. Admin creates a team, generates an invite code, athletes scan it and install the app to their home screen. No IT department required. No SSO integration needed to start. Enterprise integrations (SSO, EHR, SIS) are available for full deployments.",
              },
            ].map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-[15px] text-slate-900 pr-4">{item.q}</span>
                  <ChevronDown
                    className="h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200"
                    style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-[14px] text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Live Demo ─── */}
      <section id="demo" className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-4">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Live Demo</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Experience every role in seconds
            </h2>
          </div>
          <p className="text-slate-500 text-[15px] leading-relaxed max-w-2xl mx-auto text-center mb-12">
            These are live accounts connected to a real database with realistic sample data. Sign in as any role to see exactly what that stakeholder sees — on mobile or desktop.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto mb-8">
            {DEMO_ROLES.map((role) => {
              const isLoading = demoLoading === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => handleDemoLogin(role)}
                  disabled={demoLoading !== null}
                  className="flex items-start gap-4 p-5 rounded-2xl text-left transition-all disabled:opacity-60 hover:shadow-md active:scale-[0.99] border-2"
                  style={{ background: role.bg, borderColor: role.border }}
                >
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                       style={{ background: role.color + "20", color: role.color }}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : role.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="font-bold text-[15px]" style={{ color: role.color }}>
                        {isLoading ? "Signing in…" : role.label}
                      </p>
                      {!isLoading && <ArrowRight className="h-4 w-4 shrink-0" style={{ color: role.color }} />}
                    </div>
                    <p className="text-[12px] text-slate-500 leading-relaxed">{role.description}</p>
                    <p className="text-[10px] font-mono mt-2" style={{ color: role.color + "99" }}>{role.email}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {demoError && (
            <p className="text-center text-[13px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 max-w-md mx-auto">
              {demoError}
            </p>
          )}

          <p className="text-center text-[12px] text-slate-400 mt-6">
            Demo accounts contain realistic but entirely synthetic data. No real athlete information is ever used.
          </p>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="bg-emerald-900 py-24">
        <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
          <Anchor className="h-10 w-10 text-emerald-300 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Ready to give your athletes the support system they deserve?
          </h2>
          <p className="text-emerald-200 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Start a free 30-day pilot with one team. No commitment. No credit card. Full access. Full compliance. Full visibility.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-[15px] px-8 py-3.5 rounded-xl transition-colors shadow-lg w-full sm:w-auto justify-center"
            >
              Start Free Pilot
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center justify-center text-[15px] font-medium text-emerald-200 hover:text-white border border-emerald-700 hover:border-emerald-500 px-8 py-3.5 rounded-xl transition-colors w-full sm:w-auto"
            >
              See Live Demo First
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}>
                <Anchor className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[14px] font-semibold text-slate-700">Check-In · Athlete Anchor</span>
            </div>
            <div className="flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-slate-500">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Compliance", href: "/compliance" },
                { label: "Accessibility", href: "/accessibility" },
                { label: "Sign In", href: "/login" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-emerald-700 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-4">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Athlete Anchor, Inc. All rights reserved.
            </p>
            <p className="text-xs text-slate-400 max-w-lg">
              Check-In is a wellness monitoring platform, not a medical device or crisis intervention service. It does not provide clinical diagnoses, therapeutic treatment, or emergency response. Always follow your institution&apos;s crisis protocols.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
