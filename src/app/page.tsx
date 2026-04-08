import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Heart,
  Users,
  ClipboardCheck,
  TrendingUp,
  Lock,
  Anchor,
  ArrowRight,
  Check,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-emerald-100/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-900 flex items-center justify-center">
              <Anchor className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">Check-In</span>
              <span className="text-[10px] text-emerald-600 ml-1.5 font-medium uppercase tracking-widest">Athlete Anchor</span>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-700 hidden md:block">
              Privacy
            </Link>
            <Link href="/compliance" className="text-sm text-slate-500 hover:text-slate-700 hidden md:block">
              Compliance
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-green-50/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-full px-4 py-1.5 text-sm text-emerald-700 font-medium mb-8">
            <Lock className="h-3.5 w-3.5" />
            Privacy-first. FERPA-aligned. NCAA-ready.
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
            Athletes share more when
            <br />
            <span className="text-emerald-600">they trust the system</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 mt-8 max-w-2xl mx-auto leading-relaxed">
            Weekly check-ins that catch what annual screenings miss.
            Three-tier privacy that athletes actually trust.
            Follow-up workflows that ensure no one falls through.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <Link href="/signup">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white text-base px-8 h-12 w-full sm:w-auto">
                Start Free Pilot
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8 h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-10 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> 2-minute check-ins</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> Installs like a native app</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-500" /> No athlete data in emails</span>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-emerald-100/60 bg-emerald-900 py-4">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-emerald-300/80">
          <span>FERPA-Aligned</span>
          <span>NCAA Best Practices</span>
          <span>SOC 2 Ready Architecture</span>
          <span>End-to-End Encrypted</span>
          <span>Audit Logged</span>
        </div>
      </section>

      {/* Privacy model */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Privacy tiers athletes understand
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Athletes control visibility. Coaches see status, not secrets. Journals stay private. Period.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                tier: "Private",
                color: "emerald",
                items: ["Journal entries", "Free-text notes", "Follow-up requests", "Faith preferences"],
                who: "Athlete only",
                bg: "bg-emerald-50",
                border: "border-emerald-200",
                badge: "bg-emerald-100 text-emerald-700",
              },
              {
                tier: "Support",
                color: "amber",
                items: ["Flagged responses", "Alert details", "Trigger types", "Crisis indicators"],
                who: "Licensed counselor + Admin",
                bg: "bg-amber-50",
                border: "border-amber-200",
                badge: "bg-amber-100 text-amber-700",
              },
              {
                tier: "Coach",
                color: "blue",
                items: ["Team completion rate", "Aggregate risk percentages", "Team-level averages", "Week-over-week trends"],
                who: "Team coach (aggregate only)",
                bg: "bg-sky-50",
                border: "border-sky-200",
                badge: "bg-sky-100 text-sky-700",
              },
            ].map((tier) => (
              <div key={tier.tier} className={`rounded-2xl ${tier.bg} border ${tier.border} p-6`}>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${tier.badge} mb-4`}>
                  Tier: {tier.tier}
                </div>
                <p className="text-sm font-medium text-slate-900 mb-3">Visible to: {tier.who}</p>
                <ul className="space-y-2">
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-14 tracking-tight">
            Built for athlete trust, designed for program accountability
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Eye className="h-5 w-5" />,
                title: "Early visibility without surveillance",
                description: "Weekly 2-minute check-ins surface trends before they become crises. Coaches see team percentages, never individual data.",
              },
              {
                icon: <Lock className="h-5 w-5" />,
                title: "Athlete-first privacy model",
                description: "Three-tier privacy ensures athletes control what's shared. Journals and personal notes stay private.",
              },
              {
                icon: <Users className="h-5 w-5" />,
                title: "Structured follow-up for staff",
                description: "Automated risk scoring routes the right alerts to the right people. No one falls through the cracks.",
              },
              {
                icon: <ClipboardCheck className="h-5 w-5" />,
                title: "NCAA compliance built in",
                description: "Go beyond annual screening. Weekly check-ins create ongoing compliance documentation automatically.",
              },
              {
                icon: <TrendingUp className="h-5 w-5" />,
                title: "Trend detection over time",
                description: "Spot declining well-being over weeks, not just point-in-time snapshots. Catch deterioration early.",
              },
              {
                icon: <Heart className="h-5 w-5" />,
                title: "Values-based support (optional)",
                description: "Faith, family, and relationship check-ins are available but never required. Athletes choose what matters.",
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl p-6 border border-slate-200/60 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl inline-block mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-14 tracking-tight">How it works</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: "1", title: "Athletes check in weekly", description: "A 2-minute wellness check covering mood, stress, sleep, and support. Opens like an app on their phone." },
              { step: "2", title: "System flags early signs", description: "Automatic risk scoring identifies athletes who may need support. Red alerts notify staff instantly." },
              { step: "3", title: "Staff follow up with care", description: "The right people get the right alerts. Follow-ups are assigned, tracked, and documented." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-5">
                  {item.step}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-emerald-900 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
            Ready to support your athletes better?
          </h2>
          <p className="text-emerald-300/80 mb-10 text-lg">
            Start a free 30-day pilot with one team. No commitment required.
          </p>
          <Link href="/signup">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold text-base px-10 h-12">
              Start Free Pilot
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-emerald-900 flex items-center justify-center">
                <Anchor className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-slate-700">Check-In by Athlete Anchor</span>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-500">
              <Link href="/privacy" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-emerald-600 transition-colors">Terms of Service</Link>
              <Link href="/compliance" className="hover:text-emerald-600 transition-colors">Compliance</Link>
              <Link href="/accessibility" className="hover:text-emerald-600 transition-colors">Accessibility</Link>
              <Link href="/login" className="hover:text-emerald-600 transition-colors">Sign In</Link>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6">
            &copy; {new Date().getFullYear()} Athlete Anchor, Inc. All rights reserved.
            FERPA-aligned. NCAA best practices compliant. Built with athlete privacy as the foundation.
          </p>
        </div>
      </footer>
    </div>
  );
}
