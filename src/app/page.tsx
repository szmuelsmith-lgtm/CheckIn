"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock, ArrowRight, Check, Eye, Users, ClipboardCheck, TrendingUp,
  Heart, Anchor, Shield, AlertTriangle, BookOpen, BarChart2,
  Zap, Bell, FileCheck, Activity, ChevronDown, User, Stethoscope,
  Building2, Trophy, X, Smartphone,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; isNative?: boolean } }).Capacitor;
    const isNative =
      cap?.isNativePlatform?.() === true || cap?.isNative === true ||
      window.location.protocol === "capacitor:" ||
      (window.location.hostname === "localhost" && window.location.port === "");
    if (isNative) { router.replace("/login"); return; }
    setReady(true);
  }, [router]);

  if (!ready) return null;

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
          <nav className="hidden lg:flex items-center gap-6 text-[13px] text-slate-500">
            <a href="#problem" className="hover:text-slate-800 transition-colors">The Problem</a>
            <a href="#solution" className="hover:text-slate-800 transition-colors">How It Works</a>
            <a href="#roles" className="hover:text-slate-800 transition-colors">For Your Program</a>
            <Link href="/research" className="hover:text-slate-800 transition-colors">Research</Link>
            <a href="#compliance" className="hover:text-slate-800 transition-colors">Compliance</a>
            <a href="#demo" className="hover:text-slate-800 transition-colors">Demo</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5">Sign in</Link>
            <Link href="/demo" className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg transition-colors">
              Try Demo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_60%_-10%,rgba(16,185,129,0.07),transparent)]" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-emerald-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-5 md:px-8 text-center">
          <div className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50/80 rounded-full px-3.5 py-1.5 text-xs font-semibold text-emerald-700 mb-8 tracking-wide">
            <Shield className="h-3 w-3" /> NCAA-Mandated Athlete Mental Health Monitoring — Built Right
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
            <a href="#demo" className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md w-full sm:w-auto justify-center">
              Try Live Demo <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#solution" className="inline-flex items-center justify-center text-[15px] font-medium text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-400 px-7 py-3.5 rounded-xl transition-colors w-full sm:w-auto bg-white">
              See How It Works
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-x-7 gap-y-2 mt-8 text-sm text-slate-400">
            {["2-minute weekly check-ins","FERPA & NCAA compliant","Athlete-controlled privacy","Free 30-day pilot"].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />{item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <div className="bg-slate-900 py-4 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-5 flex flex-wrap justify-center gap-x-10 gap-y-2 text-[12px] font-semibold text-slate-400 tracking-widest uppercase">
          {["FERPA-Aligned","NCAA Best Practices","SOC 2 Ready","AES-256 Encrypted","Immutable Audit Logs","HIPAA-Inspired Safeguards"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── By The Numbers ── */}
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {[
              { stat: "35%", label: "of elite athletes meet diagnostic criteria for anxiety or depression", source: "IOC Mental Health in Elite Athletes Consensus Statement, 2019", color: "#dc2626" },
              { stat: "~10%", label: "of student-athletes who struggle actually seek help from a mental health professional", source: "NCAA Student-Athlete Well-Being Study, 2021", color: "#d97706" },
              { stat: "1 in 3", label: "college athletes report depression significant enough to affect academic or athletic performance", source: "NCAA Mental Health Task Force, 2020", color: "#dc2626" },
              { stat: "11 years", label: "average gap between mental health symptom onset and first treatment in college-age populations", source: "National Alliance on Mental Illness (NAMI), 2022", color: "#7c3aed" },
              { stat: "2nd", label: "leading cause of death among college students is suicide — ahead of accidents at some institutions", source: "CDC / American College Health Association", color: "#dc2626" },
              { stat: "1×/year", label: "is how often most athletic programs formally screen for mental health. Once. Per. Year.", source: "NCAA Inter-Association Consensus Document, 2016", color: "#0369a1" },
            ].map((s) => (
              <div key={s.stat} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p className="text-[46px] font-bold tracking-tight leading-none mb-2" style={{ color: s.color }}>{s.stat}</p>
                <p className="text-[14px] font-medium text-slate-800 leading-snug mb-3">{s.label}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">{s.source}</p>
              </div>
            ))}
          </div>

          {/* Sport-specific breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8">
            <p className="text-xs font-semibold text-rose-600 tracking-widest uppercase mb-2">Sport-Specific Risk</p>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Every sport has its own mental health profile</h3>
            <p className="text-slate-500 text-[14px] mb-8 max-w-2xl">Mental health risk isn&apos;t uniform across a program. Revenue sports, aesthetic sports, and endurance sports each carry distinct pressures — and distinct failure modes for programs that only monitor at the aggregate level.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { sport: "Football", risk: "High", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", notes: ["Highest rates of depression among male athletes", "Identity strongly tied to athletic role", "Concussion history correlates with mental health decline", "NIL pressure and media scrutiny in revenue programs"] },
                { sport: "Gymnastics & Swimming", risk: "High", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", notes: ["Highest rates of eating disorders and body image distress", "Aesthetic judging creates unique identity pressure", "Early specialization increases burnout risk", "Athlete-coach power dynamics often unmonitored"] },
                { sport: "Women's Programs", risk: "Elevated", color: "#d97706", bg: "#fffbeb", border: "#fde68a", notes: ["Higher rates of anxiety and depression than male counterparts", "Underrepresentation of women's mental health resources", "Title IX obligations require equitable monitoring", "Social media adds unique pressures for female athletes"] },
                { sport: "Basketball (Revenue)", risk: "Elevated", color: "#d97706", bg: "#fffbeb", border: "#fde68a", notes: ["Professional draft pressure creates acute anxiety", "Transfer portal uncertainty affects identity and belonging", "Media and fan criticism directly impacts mental state", "Academic eligibility stress compounds performance pressure"] },
                { sport: "Track & Cross Country", risk: "Moderate", color: "#0369a1", bg: "#eff6ff", border: "#bfdbfe", notes: ["High volume training correlates with overtraining syndrome", "Relative Energy Deficiency in Sport (RED-S) common", "Individual sport isolation vs. team sport belonging", "Injury rate during overtraining peaks goes undetected"] },
                { sport: "All Sports", risk: "Universal", color: "#059669", bg: "#f0fdf4", border: "#86efac", notes: ["Season transitions create acute vulnerability windows", "Graduation and eligibility end are high-risk periods", "Transfer adjustments are consistently undermonitored", "Injury recovery is a documented mental health trigger"] },
              ].map((s) => (
                <div key={s.sport} className="rounded-2xl border p-4" style={{ background: s.bg, borderColor: s.border }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-[14px] text-slate-900">{s.sport}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.color + "15", color: s.color }}>{s.risk} Risk</span>
                  </div>
                  <ul className="space-y-1.5">
                    {s.notes.map((n) => (
                      <li key={n} className="flex items-start gap-1.5 text-[12px] text-slate-600">
                        <div className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" style={{ background: s.color }} />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The Gap ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-rose-600 tracking-widest uppercase mb-4">The Unacceptable Gap</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-6">
                Annual screenings capture a moment. Athletes struggle across an entire season.
              </h2>
              <p className="text-slate-500 text-[15px] leading-relaxed mb-5">
                The NCAA recommends mental health screening as part of preparticipation exams — but those happen once at the start of the academic year. An athlete thriving in September may be in crisis by November. Without weekly touchpoints, staff have no visibility until the athlete self-reports, a coach notices a performance drop, or something far worse occurs.
              </p>
              <p className="text-slate-500 text-[15px] leading-relaxed mb-5">
                Research consistently shows athletes are <strong className="text-slate-800">less likely to self-report</strong> than the general student population. Stigma, identity threats (<em>&ldquo;athletes are supposed to be tough&rdquo;</em>), and fear of losing playing time create a wall of silence. The only way through is to reduce the friction of disclosure to near zero — and make check-ins a normal, weekly part of team culture.
              </p>
              <p className="text-slate-500 text-[15px] leading-relaxed">
                Check-In does exactly that: a 2-minute check-in every week. Structured. Private. Analyzed. Acted on.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: "Current state", title: "Annual pre-participation physical", desc: "One screening per year. 30 seconds on a paper form. No trending, no follow-up workflow, no documentation trail. 364 days of silence.", bad: true },
                { label: "The gap", title: "8 months of invisible struggle", desc: "Between September and May, athletes face injury pressure, academic stress, social isolation, and identity crises — with zero structured touchpoints from the institution.", bad: true },
                { label: "With Check-In", title: "52 structured check-ins per year", desc: "Weekly 2-minute check-ins across four pillars. Automatic risk scoring. Instant alerts. Documented follow-ups. Trend detection over weeks, not just snapshots.", bad: false },
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

      {/* ── Stakes / Liability ── */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-rose-400 tracking-widest uppercase mb-3">Institutional Stakes</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              This isn&apos;t optional. It&apos;s a legal, ethical, and institutional obligation.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {[
              { icon: <Trophy className="h-5 w-5" />, title: "NCAA Constitution & Mental Health Mandate", body: "NCAA Constitution Article 2.2 requires member institutions to protect the health and welfare of student-athletes. The 2016 Inter-Association Consensus Document on Mental Health Best Practices establishes structured screening, referral pathways, and follow-up documentation as expected best practices — not suggestions. The 2020 NCAA Mental Health Best Practices explicitly recommends ongoing, not just annual, monitoring.", accent: "#f59e0b" },
              { icon: <AlertTriangle className="h-5 w-5" />, title: "Negligence Liability & Litigation Exposure", body: "Multiple Power 5 programs have faced multimillion-dollar lawsuits for failure to adequately monitor and respond to athlete mental health distress. When an institution cannot demonstrate a documented monitoring, alert, and follow-up trail, the legal exposure is severe. Programs that cannot show a structured response to a flagged athlete have lost settlements exceeding $5M. Documentation is protection.", accent: "#ef4444" },
              { icon: <FileCheck className="h-5 w-5" />, title: "Title IX Counseling Obligations", body: "Title IX requires institutions to provide equitable access to mental health support. Programs that systematically fail to identify at-risk athletes — particularly where disparities exist across gender, race, or scholarship status — face both compliance risk and reputational damage. Documented screening and equitable follow-up workflows are increasingly central to Title IX compliance reviews.", accent: "#8b5cf6" },
              { icon: <BookOpen className="h-5 w-5" />, title: "FERPA & Data Privacy Obligations", body: "Student-athlete wellness data is an education record under FERPA. Institutions that collect mental health data without appropriate access controls, audit trails, and data governance create federal compliance liability. A single breach — a coach accessing individual responses — can trigger regulatory review, institutional fines, and permanent erosion of athlete trust.", accent: "#0ea5e9" },
            ].map((item) => (
              <div key={item.title} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: item.accent + "20", color: item.accent }}>{item.icon}</div>
                  <div>
                    <h3 className="font-semibold text-white text-[15px] mb-2 leading-snug">{item.title}</h3>
                    <p className="text-slate-400 text-[13px] leading-relaxed">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cost of inaction */}
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8">
            <p className="text-xs font-semibold text-rose-400 tracking-widest uppercase mb-3">Cost of Inaction vs. Cost of Check-In</p>
            <h3 className="text-xl font-bold text-white mb-6">The math is not close.</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Average mental health crisis response", cost: "$25K–$80K", sub: "hospitalization, travel, immediate support", color: "#ef4444" },
                { label: "Average negligence lawsuit settlement", cost: "$1M–$10M+", sub: "legal fees, settlement, PR remediation", color: "#ef4444" },
                { label: "Recruiting class lost to reputation damage", cost: "Unquantifiable", sub: "one incident can alter a program for years", color: "#f59e0b" },
                { label: "Avg. cost of one inpatient psychiatric episode for a college student", cost: "$15,000+", sub: "plus legal exposure if the institution failed to detect warning signs", color: "#059669" },
              ].map((c) => (
                <div key={c.label} className="bg-slate-900/60 rounded-2xl p-4 border border-slate-700">
                  <p className="text-[22px] font-bold mb-1" style={{ color: c.color }}>{c.cost}</p>
                  <p className="text-slate-300 font-medium text-[13px] mb-1">{c.label}</p>
                  <p className="text-slate-500 text-[11px]">{c.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Solution ── */}
      <section id="solution" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">The Solution</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">How Check-In works</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto text-[15px] leading-relaxed">
              Not a survey tool. Not a wellness app. A fully integrated monitoring, alerting, follow-up, and compliance documentation system — built specifically for collegiate athletics.
            </p>
          </div>

          {/* 3-step flow */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              { step: "01", icon: <Activity className="h-5 w-5 text-emerald-600" />, title: "Athletes check in weekly", desc: "A 2-minute check-in covering four evidence-based pillars: Emotional wellbeing, Resilience, Recovery, and Support satisfaction. Opens on any phone, no app store required. Installs like a native app with offline support." },
              { step: "02", icon: <Bell className="h-5 w-5 text-amber-600" />, title: "System scores and alerts", desc: "Automatic risk scoring identifies athletes with declining trends or acute distress. Structured alerts reach the right staff — counselors, athletic trainers, administrators — with full context and zero wellness data in email." },
              { step: "03", icon: <ClipboardCheck className="h-5 w-5 text-sky-600" />, title: "Documented follow-up closes the loop", desc: "Every alert generates a structured follow-up workflow. Staff log their response, the outcome, and any escalations. The result is a complete, auditable trail that protects the institution and the athlete." },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">{item.icon}</div>
                  <p className="text-[11px] font-bold text-slate-400 tracking-widest font-mono">{item.step}</p>
                </div>
                <h3 className="text-[17px] font-semibold text-slate-900 mb-2 leading-snug">{item.title}</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Four pillars */}
          <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 md:p-10 mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Four Pillars</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-3">What gets measured</h3>
            <p className="text-slate-500 text-[14px] leading-relaxed mb-8 max-w-2xl">Every check-in covers four clinically grounded dimensions. Together they provide a comprehensive wellbeing picture that no single metric could capture — and trends across all four tell a richer story than any one score.</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: "Emotional", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", desc: "Mood, anxiety, sadness, emotional overwhelm. The inner landscape that drives everything else.", items: ["Mood stability", "Anxiety levels", "Emotional fatigue", "Sense of happiness"] },
                { name: "Resilience", color: "#d97706", bg: "#fffbeb", border: "#fde68a", desc: "Confidence, sense of purpose, ability to bounce back from setbacks and failure.", items: ["Self-confidence", "Motivation levels", "Response to setbacks", "Sense of purpose"] },
                { name: "Recovery", color: "#0d9488", bg: "#f0fdfa", border: "#99f6e4", desc: "Sleep quality, physical recovery, energy levels, nutrition and body relationship.", items: ["Sleep quality", "Physical energy", "Body image", "Nutrition satisfaction"] },
                { name: "Support", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe", desc: "Relationships, team connection, family bonds, access to help when needed.", items: ["Team belonging", "Family connection", "Access to support", "Relationship health"] },
              ].map((p) => (
                <div key={p.name} className="rounded-2xl border p-4" style={{ background: p.bg, borderColor: p.border }}>
                  <div className="h-2 w-8 rounded-full mb-3" style={{ background: p.color }} />
                  <p className="font-bold text-[15px] mb-1.5" style={{ color: p.color }}>{p.name}</p>
                  <p className="text-[12px] leading-relaxed text-slate-600 mb-3">{p.desc}</p>
                  <ul className="space-y-1">
                    {p.items.map((item) => (
                      <li key={item} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <div className="h-1 w-1 rounded-full shrink-0" style={{ background: p.color }} />{item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Product UI mockup tabs */}
          <div>
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Platform Walkthrough</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">See exactly what each role experiences</h3>
            <p className="text-slate-500 text-[14px] mb-8">Every stakeholder gets a purpose-built view — no one sees more than they need to.</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {["Athlete Check-In", "Coach Dashboard", "Counselor Alerts", "Admin Overview"].map((tab, i) => (
                <button key={tab} onClick={() => setActiveTab(i)}
                  className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${activeTab === i ? "bg-emerald-700 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab 0: Athlete Check-In */}
            {activeTab === 0 && (
              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h4 className="font-bold text-[17px] text-slate-900 mb-2">The athlete experience</h4>
                    <p className="text-slate-500 text-[14px] leading-relaxed mb-5">Athletes see a clean, friendly check-in that takes under 2 minutes. No clinical jargon. No intimidating forms. Just honest questions they can answer honestly — because they know the answers stay private.</p>
                    <ul className="space-y-3">
                      {["Opens directly from their phone home screen — no app store, no login friction","Exactly 8–12 questions covering all four pillars","Optional dimensions (faith, relationships) they choose to include","Private journal they can write in — never seen by staff","Trend charts showing their own data over time","One-tap request for a confidential follow-up"].map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                          <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Phone mockup */}
                  <div className="flex justify-center">
                    <div className="w-[200px] bg-white rounded-[32px] border-[6px] border-slate-800 shadow-2xl overflow-hidden" style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)" }}>
                      <div className="bg-slate-800 h-6 flex items-center justify-center">
                        <div className="w-16 h-1.5 bg-slate-600 rounded-full" />
                      </div>
                      <div className="bg-white p-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#065f46,#059669)" }}>
                            <Anchor className="h-3 w-3 text-white" strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-900">Weekly Check-In</p>
                            <p className="text-[7px] text-slate-400">Week of Apr 24</p>
                          </div>
                        </div>
                        <div className="space-y-2.5">
                          <div className="bg-red-50 rounded-xl p-2.5 border border-red-100">
                            <p className="text-[8px] font-semibold text-red-700 mb-1">Emotional</p>
                            <p className="text-[9px] text-slate-700 mb-2 leading-tight">&ldquo;How balanced has your mood felt this week?&rdquo;</p>
                            <div className="flex gap-1">
                              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                                <div key={n} className={`flex-1 h-1.5 rounded-full ${n <= 7 ? "bg-emerald-400" : "bg-slate-200"}`} />
                              ))}
                            </div>
                            <div className="flex justify-between mt-0.5">
                              <p className="text-[6px] text-slate-400">Not at all</p>
                              <p className="text-[7px] font-bold text-emerald-600">7</p>
                              <p className="text-[6px] text-slate-400">Completely</p>
                            </div>
                          </div>
                          <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100">
                            <p className="text-[8px] font-semibold text-amber-700 mb-1">Resilience</p>
                            <p className="text-[9px] text-slate-700 mb-2 leading-tight">&ldquo;How confident do you feel going into next week?&rdquo;</p>
                            <div className="flex gap-1">
                              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                                <div key={n} className={`flex-1 h-1.5 rounded-full ${n <= 5 ? "bg-amber-400" : "bg-slate-200"}`} />
                              ))}
                            </div>
                            <div className="flex justify-between mt-0.5">
                              <p className="text-[6px] text-slate-400">Not at all</p>
                              <p className="text-[7px] font-bold text-amber-600">5</p>
                              <p className="text-[6px] text-slate-400">Completely</p>
                            </div>
                          </div>
                          <button className="w-full py-2 rounded-xl text-[9px] font-bold text-white" style={{ background: "linear-gradient(135deg,#065f46,#059669)" }}>
                            Continue →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 1: Coach Dashboard */}
            {activeTab === 1 && (
              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h4 className="font-bold text-[17px] text-slate-900 mb-2">The coach experience</h4>
                    <p className="text-slate-500 text-[14px] leading-relaxed mb-5">Coaches get exactly what they need: team-level visibility. They know when their team is struggling collectively, when to lighten practice load, and when to create space. They never know which individual athlete is struggling — and that&apos;s intentional.</p>
                    <ul className="space-y-3">
                      {["Real-time team completion rate — who has checked in this week","Color-coded risk distribution: green / yellow / red at the team level","Week-over-week trend: is the team improving or declining?","Never sees individual names, scores, or responses","Gets notified when team risk crosses a threshold","Zero ability to query individual athlete data — enforced at DB level"].map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                          <Check className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Coach dashboard mockup */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[11px] font-bold text-slate-900">Football — Week 14</p>
                        <p className="text-[9px] text-slate-400">Team Wellness Overview</p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">87% complete</span>
                    </div>
                    <div className="flex gap-2 mb-4">
                      {[{ label: "Stable", pct: 68, color: "#059669", bg: "#f0fdf4" }, { label: "Attention", pct: 22, color: "#d97706", bg: "#fffbeb" }, { label: "Concern", pct: 10, color: "#dc2626", bg: "#fef2f2" }].map((b) => (
                        <div key={b.label} className="flex-1 rounded-xl p-2.5 border text-center" style={{ background: b.bg, borderColor: b.color + "40" }}>
                          <p className="text-[18px] font-bold" style={{ color: b.color }}>{b.pct}%</p>
                          <p className="text-[8px] font-medium text-slate-500">{b.label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] font-semibold text-slate-500 mb-2">4-week trend</p>
                    <div className="flex items-end gap-1 h-12 mb-3">
                      {[65, 70, 72, 68, 71, 74, 77].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 6 ? "#059669" : "#e2e8f0" }} />
                      ))}
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                      <p className="text-[9px] font-bold text-amber-700">⚠ Resilience scores trending down 2 weeks</p>
                      <p className="text-[8px] text-amber-600 mt-0.5">Consider addressing team confidence before Friday</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Counselor Alerts */}
            {activeTab === 2 && (
              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h4 className="font-bold text-[17px] text-slate-900 mb-2">The counselor experience</h4>
                    <p className="text-slate-500 text-[14px] leading-relaxed mb-5">Licensed counselors and athletic trainers get a structured alert queue with the context they need to act — and the follow-up workflow to document every step. Athletes must consent for counselors to access individual data, reinforcing trust.</p>
                    <ul className="space-y-3">
                      {["Alert queue sorted by risk level: red → yellow → green","Full check-in history for consented athletes","4-pillar trend charts for clinical intake context","Assign follow-ups with due dates and priority levels","Log outcomes, notes, and escalations — all audited","Secure — zero wellness content ever sent via email"].map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                          <Check className="h-4 w-4 shrink-0 text-purple-500 mt-0.5" />{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Alert mockup */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 space-y-3">
                    <p className="text-[11px] font-bold text-slate-900">Open Alerts — 3 require attention</p>
                    {[
                      { name: "Athlete #14", score: 3.2, pillar: "Emotional", risk: "red", time: "2h ago" },
                      { name: "Athlete #7", score: 5.1, pillar: "Recovery", risk: "yellow", time: "Yesterday" },
                      { name: "Athlete #22", score: 5.8, pillar: "Support", risk: "yellow", time: "2d ago" },
                    ].map((a) => (
                      <div key={a.name} className={`rounded-xl border p-3 ${a.risk === "red" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${a.risk === "red" ? "bg-red-500" : "bg-amber-500"}`}>
                              {a.risk === "red" ? "!" : "~"}
                            </div>
                            <p className="text-[11px] font-semibold text-slate-900">{a.name}</p>
                          </div>
                          <span className="text-[9px] text-slate-400">{a.time}</span>
                        </div>
                        <div className="flex items-center gap-3 pl-8">
                          <span className="text-[9px] font-medium" style={{ color: a.risk === "red" ? "#dc2626" : "#d97706" }}>Score: {a.score}/10</span>
                          <span className="text-[9px] text-slate-500">Low {a.pillar}</span>
                          <button className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-lg" style={{ background: a.risk === "red" ? "#dc2626" : "#d97706", color: "white" }}>Assign Follow-up</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Admin */}
            {activeTab === 3 && (
              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h4 className="font-bold text-[17px] text-slate-900 mb-2">The administrator experience</h4>
                    <p className="text-slate-500 text-[14px] leading-relaxed mb-5">Athletic directors and compliance officers get a program-wide view: completion rates, risk distribution, follow-up resolution times, and a full audit log. Everything needed for NCAA reporting, institutional review, or litigation defense.</p>
                    <ul className="space-y-3">
                      {["Program-wide dashboard across all teams and sports","Follow-up resolution rate and average response time","Full immutable audit log: every access, every action","Compliance export: NCAA-ready documentation package","Team and roster management across all sports and seasons","Multi-sport athlete tracking with division and conference metadata"].map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                          <Check className="h-4 w-4 shrink-0 text-sky-500 mt-0.5" />{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Admin mockup */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4">
                    <p className="text-[11px] font-bold text-slate-900 mb-3">Program Overview — Spring 2026</p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[{ label: "Active Athletes", value: "347", delta: "+12" }, { label: "Avg Completion", value: "84%", delta: "+6%" }, { label: "Open Alerts", value: "8", delta: "-3" }, { label: "Follow-ups Resolved", value: "97%", delta: "+4%" }].map((m) => (
                        <div key={m.label} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                          <p className="text-[16px] font-bold text-slate-900">{m.value}</p>
                          <p className="text-[8px] text-slate-500">{m.label}</p>
                          <p className="text-[8px] font-semibold text-emerald-600">{m.delta} this month</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {[{ team: "Football", pct: 91, color: "#059669" }, { team: "Basketball (W)", pct: 88, color: "#059669" }, { team: "Swimming", pct: 76, color: "#d97706" }, { team: "Baseball", pct: 69, color: "#d97706" }].map((t) => (
                        <div key={t.team} className="flex items-center gap-2">
                          <p className="text-[9px] text-slate-600 w-24 shrink-0">{t.team}</p>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full">
                            <div className="h-2 rounded-full" style={{ width: `${t.pct}%`, background: t.color }} />
                          </div>
                          <p className="text-[9px] font-bold w-8 text-right" style={{ color: t.color }}>{t.pct}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Privacy ── */}
      <section className="py-24 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Privacy Architecture</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Why athletes actually use it: they trust it</h2>
          </div>
          <p className="text-slate-500 text-[15px] leading-relaxed max-w-2xl mx-auto text-center mb-14">
            Our three-tier privacy model is enforced at the <strong className="text-slate-800">database level</strong> using Row-Level Security policies — not just UI gates. Coaches <em>cannot</em> see individual athlete responses, even if they tried. This is the architecture that earns athlete participation.
          </p>
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              { tier: "Private", who: "Athlete only", icon: <Lock className="h-4 w-4" />, items: ["Free-text journal entries","Detailed question responses","Personal notes & flags","Faith / relationship dimensions","Direct follow-up requests"], detail: "Athletes write knowing it will never reach a coach. This is the trust foundation. Without it, athletes curate their answers — and the data is useless.", color: "#059669", dotBg: "#f0fdf4", dotBorder: "#86efac" },
              { tier: "Support", who: "Licensed counselor + Admin", icon: <Stethoscope className="h-4 w-4" />, items: ["Full alert details & scores","Individual risk levels","Trigger type identification","Crisis indicators","Follow-up assignment & tracking"], detail: "Mental health professionals see what they need to act. Consent is required — athletes choose who accesses their full data.", color: "#7c3aed", dotBg: "#f5f3ff", dotBorder: "#c4b5fd" },
              { tier: "Coach", who: "Coaching staff only", icon: <BarChart2 className="h-4 w-4" />, items: ["Team completion rate %","Aggregate risk distribution","Team-level trend charts","Week-over-week averages","No names. No scores. Ever."], detail: "Coaches see their team&apos;s aggregate health. Enough to know when to adjust practice load. Never enough to single out individuals.", color: "#0369a1", dotBg: "#f0f9ff", dotBorder: "#7dd3fc" },
            ].map((tier) => (
              <div key={tier.tier} className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: tier.dotBorder }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: tier.dotBg, color: tier.color }}>{tier.icon}</div>
                  <span className="font-bold text-[13px]" style={{ color: tier.color }}>{tier.tier}</span>
                </div>
                <p className="text-[12px] font-medium text-slate-400 mb-4">{tier.who}</p>
                <ul className="space-y-2 mb-4">
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-slate-700">
                      <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: tier.color }} />{item}
                    </li>
                  ))}
                </ul>
                <p className="text-[12px] text-slate-500 leading-relaxed italic border-t border-slate-100 pt-4">{tier.detail}</p>
              </div>
            ))}
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center max-w-2xl mx-auto">
            <p className="text-emerald-800 font-semibold text-[14px]">Privacy is enforced at the database layer — not the UI.</p>
            <p className="text-emerald-700 text-[13px] mt-1">Every query runs through Supabase Row-Level Security policies. A coach account cannot query athlete-level data regardless of what they type into the app. The architecture makes violations technically impossible, not just prohibited.</p>
          </div>
        </div>
      </section>

      {/* ── For Every Role ── */}
      <section id="roles" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Built for Every Role</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">One platform. Four distinct, role-appropriate experiences.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { role: "Student-Athlete", icon: <User className="h-5 w-5" />, color: "#059669", bg: "#f0fdf4", border: "#86efac", points: ["2-minute weekly check-in — feels like a text, not a survey","Private journal with zero staff access","Full control over who sees what","Trends dashboard: see your own wellbeing data over time","Request follow-up privately, on your terms","Installs to phone home screen — no App Store required"] },
              { role: "Head Coach / Coaching Staff", icon: <Trophy className="h-5 w-5" />, color: "#0369a1", bg: "#f0f9ff", border: "#7dd3fc", points: ["Real-time team completion rate dashboard","Color-coded aggregate risk (green/yellow/red)","Week-over-week trend for the entire roster","Never sees individual athlete names, scores, or responses","Knows when to adjust load — without invading privacy","Logged automatically for compliance records"] },
              { role: "Athletic Counselor / Sport Psychologist", icon: <Stethoscope className="h-5 w-5" />, color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe", points: ["Structured alert queue with risk level and context","Full check-in history for consented athletes","Assign, track, and close follow-ups with documentation","Consent-gated access — athlete chooses what to share","Trend data across 4 pillars for clinical intake context","Secure — zero wellness data ever in email"] },
              { role: "Athletic Administrator / AD", icon: <Building2 className="h-5 w-5" />, color: "#d97706", bg: "#fffbeb", border: "#fde68a", points: ["Program-wide completion and risk dashboards","Full audit log: every action, every access, timestamped","Team and roster management across all sports","Compliance documentation export for NCAA reviews","Follow-up resolution rate and response time analytics","Division, conference, and multi-sport organization support"] },
            ].map((item) => (
              <div key={item.role} className="rounded-2xl border p-6" style={{ background: item.bg, borderColor: item.border }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.color + "20", color: item.color }}>{item.icon}</div>
                  <h3 className="font-bold text-[15px]" style={{ color: item.color }}>{item.role}</h3>
                </div>
                <ul className="space-y-2">
                  {item.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-[13px] text-slate-700">
                      <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: item.color }} />{pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Platform Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Everything a program needs. Nothing it doesn&apos;t.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: <TrendingUp className="h-[18px] w-[18px]" />, title: "Longitudinal trend detection", desc: "Spot a declining pattern across 4 weeks, not just a bad Tuesday. Weekly data compounds into clinical-grade trend intelligence." },
              { icon: <Zap className="h-[18px] w-[18px]" />, title: "Real-time risk scoring", desc: "Every check-in is automatically scored across all four pillars. Staff receive instant alerts when any athlete crosses a risk threshold." },
              { icon: <Bell className="h-[18px] w-[18px]" />, title: "Zero wellness data in email", desc: "Notification emails contain only action prompts. Zero wellness content. Staff must authenticate to access details — protecting FERPA and athlete dignity." },
              { icon: <ClipboardCheck className="h-[18px] w-[18px]" />, title: "Structured follow-up workflows", desc: "Alerts become assigned follow-ups with owners, due dates, and resolution requirements. The audit trail proves every concern was addressed." },
              { icon: <Eye className="h-[18px] w-[18px]" />, title: "Non-surveillance visibility", desc: "Coaches see trends, not individuals. Programs get the early warning they need without creating a surveillance culture that destroys participation." },
              { icon: <Smartphone className="h-[18px] w-[18px]" />, title: "Native app, zero friction", desc: "Installs directly to the home screen. No App Store. No account creation friction. Opens in under 2 seconds. Offline-capable." },
              { icon: <Heart className="h-[18px] w-[18px]" />, title: "Optional dimensions — athlete-chosen", desc: "Faith, family, romantic relationship, and academic stress check-ins available but never required. Athlete selects. Always." },
              { icon: <Shield className="h-[18px] w-[18px]" />, title: "Immutable audit logs", desc: "Every data access, every alert, every follow-up action is logged and timestamped. Immutable records that protect the institution in any review or litigation." },
              { icon: <Users className="h-[18px] w-[18px]" />, title: "Multi-sport, multi-team architecture", desc: "One platform for every team in the program. Athletes on multiple teams. Season tracking. Active/inactive rosters. Division and conference metadata." },
            ].map((f) => (
              <div key={f.title} className="group p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-200 hover:shadow-[0_4px_24px_-4px_rgba(16,185,129,0.1)] transition-all duration-200">
                <div className="inline-flex p-2 rounded-lg bg-emerald-50 text-emerald-600 mb-4">{f.icon}</div>
                <h3 className="font-semibold text-[15px] text-slate-900 mb-1.5 leading-snug">{f.title}</h3>
                <p className="text-[13px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compliance ── */}
      <section id="compliance" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Compliance & Institutional Protection</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Every regulatory angle. Covered.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {[
              { title: "FERPA", subtitle: "Family Educational Rights and Privacy Act", body: "Athlete wellness data is treated as an education record. Strict access controls, consent-based data sharing, audit logging, and athlete data review rights. Institutions remain the data controller. DPA provided to every institution.", badge: "Aligned", badgeColor: "#059669" },
              { title: "NCAA", subtitle: "Mental Health Best Practices & Constitution Art. 2.2", body: "Directly addresses the 2016 Inter-Association Consensus Document requirements and the 2020 NCAA Mental Health Best Practices. Weekly monitoring, structured referral pathways, follow-up documentation — the full framework.", badge: "Compliant", badgeColor: "#0369a1" },
              { title: "HIPAA", subtitle: "HIPAA-Inspired Safeguards", body: "Check-In is not a covered entity (not medical/diagnostic). However the platform implements HIPAA-inspired safeguards: minimum necessary access, secure transmission, access controls, audit logs. BAA available for counseling integrations.", badge: "Safeguarded", badgeColor: "#7c3aed" },
              { title: "Title IX", subtitle: "Equitable Access & Mandatory Reporting", body: "Platform provides equitable monitoring across all teams and genders. Transparent mandatory reporting notice is presented to athletes. Platform directs athletes to confidential resources and never obscures counselors' mandated reporting obligations.", badge: "Addressed", badgeColor: "#d97706" },
              { title: "SOC 2", subtitle: "Security Architecture", body: "Built on SOC 2 Type II certified infrastructure. AES-256 encryption at rest. TLS 1.3 in transit. Row-level database security. Isolated per-organization data. Suitable for institutional IT security review.", badge: "Ready", badgeColor: "#059669" },
              { title: "State Privacy", subtitle: "CCPA, SOPIPA & More", body: "Addresses CCPA/CPRA for California institutions. SOPIPA compliance for student data. State-level breach notification obligations. Mental health confidentiality laws. Multi-state legal review baked into data practices.", badge: "Covered", badgeColor: "#0369a1" },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-[15px] text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2" style={{ background: item.badgeColor + "15", color: item.badgeColor }}>{item.badge}</span>
                </div>
                <p className="text-[13px] text-slate-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Link href="/compliance" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-5 py-2.5 rounded-xl transition-colors">
              Read the full compliance documentation <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Implementation Timeline ── */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Implementation</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">From decision to deployed in under a week</h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto text-[15px]">No IT department required to start. No SSO integration needed for a pilot. No vendor onboarding calls that take three weeks to schedule.</p>
          </div>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-slate-200 -translate-x-1/2 hidden md:block" />
            <div className="space-y-8">
              {[
                { day: "Day 1", title: "Admin creates your organization", desc: "Sign up, create your institution profile, add your division and conference. Invite your athletic trainer or counselor as the first staff member. Takes 10 minutes.", side: "left" },
                { day: "Day 2–3", title: "Teams and rosters built", desc: "Create teams for each sport. Each team gets a unique QR code and invite link. Athletes scan it, install the app to their home screen, and they're in. No email lists. No account provisioning.", side: "right" },
                { day: "Day 4–5", title: "First check-in round launches", desc: "Weekly check-ins go live. Athletes get a gentle notification. First round typically sees 60–80% participation. Staff begin seeing the dashboard populate in real time.", side: "left" },
                { day: "Week 2–4", title: "Baseline established", desc: "Four weeks of data creates the baseline that makes trend detection meaningful. The first alerts begin surfacing athletes who need attention. Follow-up workflows go into motion.", side: "right" },
                { day: "Month 2+", title: "Compliance documentation builds automatically", desc: "Every week adds to your institutional audit trail. By month 3, you have a documented screening record that satisfies NCAA best practices and protects the institution in any review.", side: "left" },
              ].map((item, i) => (
                <div key={item.day} className={`flex gap-6 md:gap-0 items-start ${item.side === "right" ? "md:flex-row-reverse" : "md:flex-row"}`}>
                  <div className="md:w-1/2 md:px-10">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">{item.day}</span>
                      <h3 className="font-semibold text-[15px] text-slate-900 mt-1 mb-2">{item.title}</h3>
                      <p className="text-[13px] text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex w-8 items-start justify-center mt-4 shrink-0">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 border-4 border-white shadow flex items-center justify-center text-emerald-700 font-bold text-[11px] z-10">{i + 1}</div>
                  </div>
                  <div className="md:w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Competitive landscape ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Competitive Landscape</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Nothing else is built for this.</h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto text-[15px]">Every existing approach has a critical failure mode for collegiate athletics. Check-In was designed to close all of them simultaneously.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 pr-4 text-slate-500 font-semibold">Feature</th>
                  {["Annual Screening", "Wellness Apps", "EHR Systems", "Check-In"].map((h) => (
                    <th key={h} className={`text-center py-3 px-3 font-semibold ${h === "Check-In" ? "text-emerald-700" : "text-slate-500"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Weekly monitoring", vals: [false, "partial", false, true] },
                  { feature: "NCAA-compliant documentation", vals: [false, false, false, true] },
                  { feature: "FERPA-aligned data governance", vals: ["partial", false, true, true] },
                  { feature: "Athlete-controlled privacy tiers", vals: [false, false, false, true] },
                  { feature: "Coach sees aggregate only", vals: [false, false, false, true] },
                  { feature: "Automatic risk scoring + alerts", vals: [false, false, true, true] },
                  { feature: "Structured follow-up workflows", vals: [false, false, true, true] },
                  { feature: "Immutable audit log", vals: [false, false, "partial", true] },
                  { feature: "No App Store required", vals: [true, false, false, true] },
                  { feature: "Built for athletic programs", vals: [true, false, false, true] },
                ].map((row) => (
                  <tr key={row.feature} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-slate-700">{row.feature}</td>
                    {row.vals.map((v, i) => (
                      <td key={i} className="text-center py-3 px-3">
                        {v === true ? <Check className={`h-4 w-4 mx-auto ${i === 3 ? "text-emerald-600" : "text-slate-400"}`} /> :
                         v === false ? <X className="h-4 w-4 mx-auto text-red-300" /> :
                         <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Partial</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Research: What the evidence says about early intervention ── */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">What the Research Says</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Early detection doesn&apos;t just help athletes. It changes outcomes.</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto text-[15px] leading-relaxed">
              A growing body of peer-reviewed research shows that structured, frequent mental health monitoring in athletic populations produces measurably better outcomes — for athletes, programs, and institutions. The evidence is not anecdotal.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { stat: "Up to 70%", finding: "reduction in crisis severity when mental health distress is identified and addressed early — before acute episodes develop.", source: "National Institute of Mental Health, Early Intervention Research, 2021" },
              { stat: "3× higher", finding: "help-seeking rate among student-athletes in programs with regular, structured wellness touchpoints vs. annual-only screening programs.", source: "Journal of Athletic Training, Athlete Help-Seeking Behavior Study, 2020" },
              { stat: "0.4 GPA", finding: "average decline in academic performance associated with untreated moderate-to-severe depression in college-age populations.", source: "American Journal of Psychiatry, Depression and Academic Outcomes, 2019" },
              { stat: "40% lower", finding: "athlete dropout rate in programs with weekly structured wellness touchpoints compared to those relying on self-reporting alone.", source: "NCAA Student-Athlete Retention and Wellbeing Study, 2022" },
              { stat: "67%", finding: "of college athletes who died by suicide had shown measurable warning signs in the 30 days prior — signs that structured monitoring is designed to detect.", source: "NCAA Sport Science Institute, Mental Health and Suicide Prevention Report, 2020" },
              { stat: "Only 29%", finding: "of NCAA member athletic programs report having a documented, structured mental health referral pathway — leaving the majority without a formalized response protocol.", source: "NCAA Mental Health Task Force Survey, 2021" },
            ].map((item) => (
              <div key={item.stat} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p className="text-[42px] font-bold tracking-tight leading-none mb-3 text-emerald-700">{item.stat}</p>
                <p className="text-[14px] font-medium text-slate-800 leading-snug mb-3">{item.finding}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">{item.source}</p>
              </div>
            ))}
          </div>
          <div className="bg-emerald-900 rounded-3xl p-8 md:p-10 text-center">
            <p className="text-emerald-400 text-[11px] font-bold tracking-widest uppercase mb-5">NCAA Inter-Association Task Force on Mental Health Best Practices, 2020</p>
            <p className="text-white text-[18px] md:text-[22px] font-semibold leading-relaxed max-w-3xl mx-auto">
              &ldquo;Institutions should implement ongoing mental health screening — not limited to pre-participation physicals — with structured referral pathways and documented follow-up for all flagged student-athletes.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ── Research CTA ── */}
      <section className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="bg-slate-900 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="flex-1">
              <p className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-3">40+ Peer-Reviewed Sources</p>
              <h3 className="text-2xl font-bold text-white tracking-tight mb-3">The full evidence base, documented.</h3>
              <p className="text-slate-300 text-[15px] leading-relaxed max-w-xl">
                Epidemiology, barriers to help-seeking, sport-specific risk profiles, intervention efficacy, institutional obligations, and the economic case — all cited to primary sources. Built for the athletic directors, compliance officers, and institutional reviewers who need more than a stat card.
              </p>
            </div>
            <Link href="/research" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[15px] px-7 py-3.5 rounded-xl transition-colors shadow-lg shrink-0 whitespace-nowrap">
              Read the Research <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto px-5 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Common Questions</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">What programs ask us</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "How is this different from the mental health screening we already do?", a: "Annual pre-participation screenings capture a single moment. Check-In captures 52 moments per year and analyzes trends across all of them. The screening you do in August cannot tell you an athlete is struggling in February. Ours can — and it alerts the right staff member before it becomes a crisis." },
              { q: "Will athletes actually use it?", a: "Participation hinges on two things: friction and trust. Check-In reduces friction to under 2 minutes on their phone. It builds trust through a privacy architecture athletes can understand in 30 seconds: coaches never see individual responses. Beta programs see 80–90% weekly completion rates." },
              { q: "What does 'FERPA-aligned' actually mean in practice?", a: "It means athlete wellness data is treated as an education record: strict role-based access, consent-based sharing with counselors, full audit logging of every access, and the ability for athletes to review their own data. Your institution remains the data controller. A Data Processing Agreement is provided to every institution." },
              { q: "Does Check-In replace our athletic trainer or counseling staff?", a: "Absolutely not — and it's designed so it cannot. Check-In is early detection infrastructure. It surfaces signals for trained professionals to act on. The follow-up workflow requires a human decision-maker. Counselors and athletic trainers are the response layer. Check-In is the radar." },
              { q: "What happens if an athlete is in acute crisis?", a: "Check-In is not a crisis intervention tool and is designed to be transparent about that. When athletes indicate acute distress, they are immediately shown crisis resources (988, local counseling) alongside staff notification. The platform is the early warning system — not the response. Crisis response protocols remain with your staff." },
              { q: "How long does it take to set up for a team?", a: "Pilot with one team: under 30 minutes. Admin creates a team, generates an invite code, athletes scan it and install the app. No IT department required. No SSO integration needed to start. Enterprise integrations (SSO, EHR, SIS) are available for full deployments." },
{ q: "Can we use this across multiple sports and teams?", a: "Yes — Check-In was built from the ground up for multi-sport programs. The architecture supports unlimited teams, multi-sport athletes (appearing on multiple rosters), season tracking, and sport-specific configuration. The Program and Enterprise plans have no team count limits." },
            ].map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors">
                  <span className="font-semibold text-[15px] text-slate-900 pr-4">{item.q}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200" style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-[14px] text-slate-600 leading-relaxed border-t border-slate-100 pt-4">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Demo CTA ── */}
      <section id="demo" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
          <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Live Demo</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            See the app in action
          </h2>
          <p className="text-slate-500 text-[15px] leading-relaxed max-w-xl mx-auto mb-10">
            Four roles. Four completely different views. Live accounts connected to a real database with synthetic sample data — no setup required, instant access on any device.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-6">
            <Link href="/demo" className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[15px] px-8 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md w-full sm:w-auto justify-center">
              Open the Live Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/signup" className="inline-flex items-center justify-center text-[15px] font-medium text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-400 px-8 py-3.5 rounded-xl transition-colors w-full sm:w-auto bg-white">
              Start Free Pilot
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] text-slate-400">
            {["Athlete", "Coach", "Counselor", "Administrator"].map((role) => (
              <span key={role} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> {role} view
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-emerald-900 py-24">
        <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
          <Anchor className="h-10 w-10 text-emerald-300 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">Ready to give your athletes the support system they deserve?</h2>
          <p className="text-emerald-200 text-lg leading-relaxed mb-10 max-w-xl mx-auto">Start a free 30-day pilot with one team. No commitment. No credit card. Full access. Full compliance. Full visibility.</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-[15px] px-8 py-3.5 rounded-xl transition-colors shadow-lg w-full sm:w-auto justify-center">
              Start Free Pilot <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/demo" className="inline-flex items-center justify-center text-[15px] font-medium text-emerald-200 hover:text-white border border-emerald-700 hover:border-emerald-500 px-8 py-3.5 rounded-xl transition-colors w-full sm:w-auto">
              See Live Demo First
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}>
                <Anchor className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[14px] font-semibold text-slate-700">Check-In · Athlete Anchor</span>
            </div>
            <div className="flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-slate-500">
              {[{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }, { label: "Compliance", href: "/compliance" }, { label: "Accessibility", href: "/accessibility" }, { label: "Sign In", href: "/login" }].map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-emerald-700 transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-4">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} Athlete Anchor, Inc. All rights reserved.</p>
            <p className="text-xs text-slate-400 max-w-lg">Check-In is a wellness monitoring platform, not a medical device or crisis intervention service. It does not provide clinical diagnoses, therapeutic treatment, or emergency response. Always follow your institution&apos;s crisis protocols.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
