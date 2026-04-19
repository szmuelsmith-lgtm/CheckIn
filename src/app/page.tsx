"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock, ArrowRight, Check, Eye, Users,
  ClipboardCheck, TrendingUp, Heart, Anchor, Shield,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Capacitor injects window.Capacitor before any JS runs
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; isNative?: boolean } }).Capacitor;
    const isNative =
      cap?.isNativePlatform?.() === true ||
      cap?.isNative === true ||
      window.location.protocol === "capacitor:" ||
      (window.location.hostname === "localhost" && window.location.port === "");

    if (isNative) {
      // Client-side navigation — no hard reload, no glitch
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  // Render nothing until we know we're on web (prevents any flash in native)
  if (!ready) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ─── Nav ─── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
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
            <Link href="/privacy" className="hover:text-slate-800 transition-colors">Privacy</Link>
            <Link href="/compliance" className="hover:text-slate-800 transition-colors">Compliance</Link>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_60%_-10%,rgba(16,185,129,0.08),transparent)]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-5 md:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50/80 rounded-full px-3.5 py-1.5 text-xs font-medium text-emerald-700 mb-10 tracking-wide">
            <Lock className="h-3 w-3" />
            Privacy-first · FERPA-aligned · NCAA-ready
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-[68px] lg:text-[76px] font-bold text-slate-900 tracking-[-0.03em] leading-[1.04] mb-7">
            The wellness platform
            <br className="hidden md:block" />{" "}
            <span className="text-emerald-700">athletes actually trust</span>
          </h1>

          {/* Sub */}
          <p className="text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10">
            Weekly check-ins that surface what annual screenings miss.
            Three-tier privacy athletes believe in.
            Follow-up workflows that ensure no one falls through the cracks.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[15px] px-7 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
            >
              Start Free Pilot
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center text-[15px] font-medium text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-400 px-7 py-3.5 rounded-xl transition-colors w-full sm:w-auto bg-white"
            >
              Sign In
            </Link>
          </div>

          {/* Proof row */}
          <div className="flex flex-wrap justify-center gap-x-7 gap-y-2 mt-9 text-sm text-slate-400">
            {[
              "2-minute check-ins",
              "Installs like a native app",
              "No athlete data in emails",
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
        <div className="max-w-5xl mx-auto px-5 flex flex-wrap justify-center gap-x-10 gap-y-2 text-[13px] font-medium text-slate-400 tracking-wide">
          {["FERPA-Aligned", "NCAA Best Practices", "SOC 2 Ready Architecture", "End-to-End Encrypted", "Audit Logged"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* ─── How it works ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Simple for athletes, powerful for programs
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Athletes check in weekly",
                desc: "A 2-minute check-in covering mood, stress, sleep, and support. Opens instantly on their phone, no app store required.",
              },
              {
                step: "02",
                title: "System flags early signs",
                desc: "Automatic risk scoring identifies athletes who may need support. Red alerts notify the right staff instantly.",
              },
              {
                step: "03",
                title: "Staff follow up with care",
                desc: "Structured follow-ups are assigned, tracked, and documented. Nothing gets missed. Everything is logged.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <p className="text-[11px] font-bold text-emerald-600/50 tracking-widest mb-4 font-mono">{item.step}</p>
                <h3 className="text-[17px] font-semibold text-slate-900 mb-2 leading-snug">{item.title}</h3>
                <p className="text-[15px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Privacy model ─── */}
      <section className="py-24 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Privacy model</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Privacy tiers athletes understand
            </h2>
            <p className="text-slate-500 mt-4 max-w-lg mx-auto text-[15px] leading-relaxed">
              Athletes control visibility. Coaches see team status, not secrets. Journals stay private. Period.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                tier: "Private",
                who: "Athlete only",
                items: ["Journal entries", "Free-text notes", "Follow-up requests", "Faith preferences"],
                color: "emerald",
                dotBg: "bg-emerald-100",
                dotText: "text-emerald-700",
                border: "border-emerald-200/80",
                bg: "bg-white",
              },
              {
                tier: "Support",
                who: "Licensed counselor + Admin",
                items: ["Flagged responses", "Alert details", "Trigger types", "Crisis indicators"],
                color: "amber",
                dotBg: "bg-amber-100",
                dotText: "text-amber-700",
                border: "border-amber-200/80",
                bg: "bg-white",
              },
              {
                tier: "Coach",
                who: "Team coach (aggregate only)",
                items: ["Team completion rate", "Aggregate risk %", "Team-level averages", "Week-over-week trends"],
                color: "sky",
                dotBg: "bg-sky-100",
                dotText: "text-sky-700",
                border: "border-sky-200/80",
                bg: "bg-white",
              },
            ].map((tier) => (
              <div key={tier.tier} className={`${tier.bg} border ${tier.border} rounded-2xl p-6 shadow-sm`}>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide ${tier.dotBg} ${tier.dotText} mb-4`}>
                  {tier.tier}
                </div>
                <p className="text-[13px] font-medium text-slate-500 mb-4">{tier.who}</p>
                <ul className="space-y-2.5">
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-[14px] text-slate-700">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              Built for trust. Designed for accountability.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: <Eye className="h-[18px] w-[18px]" />,
                title: "Early visibility without surveillance",
                desc: "Weekly check-ins surface trends before they become crises. Coaches see team-level data only.",
              },
              {
                icon: <Lock className="h-[18px] w-[18px]" />,
                title: "Athlete-first privacy model",
                desc: "Three-tier privacy ensures athletes control what's shared. Journals and notes stay private.",
              },
              {
                icon: <Users className="h-[18px] w-[18px]" />,
                title: "Structured follow-up for staff",
                desc: "Automated risk scoring routes the right alerts to the right people. No one falls through.",
              },
              {
                icon: <ClipboardCheck className="h-[18px] w-[18px]" />,
                title: "NCAA compliance built in",
                desc: "Go beyond annual screening. Weekly check-ins create ongoing compliance documentation.",
              },
              {
                icon: <TrendingUp className="h-[18px] w-[18px]" />,
                title: "Trend detection over time",
                desc: "Spot declining well-being over weeks, not just point-in-time snapshots.",
              },
              {
                icon: <Heart className="h-[18px] w-[18px]" />,
                title: "Values-based support",
                desc: "Faith, family, and relationship check-ins available but never required. Athlete's choice.",
              },
            ].map((f) => (
              <div key={f.title} className="group p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-200 hover:shadow-[0_4px_24px_-4px_rgba(16,185,129,0.1)] transition-all duration-200">
                <div className="inline-flex p-2 rounded-lg bg-emerald-50 text-emerald-600 mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-[15px] text-slate-900 mb-1.5 leading-snug">{f.title}</h3>
                <p className="text-[14px] text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="bg-slate-900 py-24">
        <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
          <Shield className="h-10 w-10 text-emerald-400 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            Ready to support your athletes better?
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Start a free 30-day pilot with one team. No commitment, no credit card.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[15px] px-8 py-3.5 rounded-xl transition-colors shadow-lg"
          >
            Start Free Pilot
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                   style={{ background: "linear-gradient(135deg, #065f46, #059669)", boxShadow: "0 2px 8px rgba(5,150,105,0.3)" }}>
                <Anchor className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[14px] font-semibold text-slate-700">Check-In · Athlete Anchor</span>
            </div>
            <div className="flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-slate-500">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
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
          <p className="text-xs text-slate-400 mt-6">
            © {new Date().getFullYear()} Athlete Anchor, Inc. All rights reserved.
            FERPA-aligned. NCAA best practices compliant. Built with athlete privacy as the foundation.
          </p>
        </div>
      </footer>

    </div>
  );
}
