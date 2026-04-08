import Link from "next/link";
import { Anchor, ArrowLeft, Accessibility, Check, Monitor, Smartphone, Keyboard, Eye } from "lucide-react";

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-emerald-100/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-900 flex items-center justify-center">
              <Anchor className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">Check-In</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-full px-4 py-1.5 text-sm text-emerald-700 font-medium mb-6">
            <Accessibility className="h-3.5 w-3.5" />
            Accessibility
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Accessibility Statement
          </h1>
          <p className="text-slate-500 mt-3">Last updated: March 28, 2026</p>
        </div>

        <div className="space-y-10">
          {/* Commitment */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Our Commitment</h2>
            <p className="text-slate-600 leading-relaxed">
              Athlete Anchor, Inc. is committed to ensuring that Check-In is accessible to all student-athletes, coaches, and staff, including individuals with disabilities. We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA, as referenced by the Americans with Disabilities Act (ADA), Section 504 of the Rehabilitation Act, and Section 508 standards.
            </p>
          </section>

          {/* Standards */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Accessibility Standards</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  icon: <Monitor className="h-5 w-5 text-emerald-600" />,
                  title: "WCAG 2.1 Level AA",
                  description: "Our target conformance level, covering perceivability, operability, understandability, and robustness.",
                },
                {
                  icon: <Keyboard className="h-5 w-5 text-emerald-600" />,
                  title: "Keyboard Accessible",
                  description: "All interactive elements — sliders, buttons, forms, and navigation — are fully keyboard accessible.",
                },
                {
                  icon: <Eye className="h-5 w-5 text-emerald-600" />,
                  title: "Screen Reader Compatible",
                  description: "Semantic HTML, ARIA labels, and proper heading structure for assistive technology users.",
                },
                {
                  icon: <Smartphone className="h-5 w-5 text-emerald-600" />,
                  title: "Mobile Assistive Tech",
                  description: "Compatible with VoiceOver (iOS), TalkBack (Android), and mobile switch access controls.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-slate-50 rounded-xl border border-slate-200/60 p-5">
                  <div className="p-2 bg-emerald-50 rounded-xl inline-block mb-3">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Accessibility Features</h2>
            <div className="space-y-3">
              {[
                "Sufficient color contrast ratios meeting WCAG 2.1 AA requirements (4.5:1 for normal text, 3:1 for large text)",
                "Focus indicators visible on all interactive elements for keyboard navigation",
                "Form inputs with associated labels and descriptive error messages",
                "Logical heading hierarchy and landmark regions for screen reader navigation",
                "Text alternatives for non-text content including icons and status indicators",
                "Responsive design that supports browser zoom up to 200% without loss of content",
                "No content that flashes more than three times per second",
                "Touch targets sized appropriately for mobile users (minimum 44x44 CSS pixels)",
                "Status messages communicated through ARIA live regions",
                "Risk status colors supplemented with text labels (not color-dependent)",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">{feature}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Legal */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">Legal Compliance</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Check-In is designed to support institutional compliance with:
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <span><strong>ADA Title II</strong> — Accessibility requirements for public universities and their technology platforms</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <span><strong>ADA Title III</strong> — Accessibility requirements for private institutions operating as places of public accommodation</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <span><strong>Section 504</strong> of the Rehabilitation Act — Non-discrimination on the basis of disability in federally funded programs</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                <span><strong>Section 508</strong> — Electronic and information technology accessibility standards referenced by many institutional procurement policies</span>
              </li>
            </ul>
          </section>

          {/* VPAT */}
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">VPAT</h2>
            <p className="text-slate-600 leading-relaxed">
              A Voluntary Product Accessibility Template (VPAT) documenting our conformance with WCAG 2.1 Level AA and Section 508 standards is available upon request for institutional procurement processes. Contact us at accessibility@athleteanchor.com.
            </p>
          </section>

          {/* Feedback */}
          <section className="bg-emerald-50 rounded-2xl border border-emerald-200 p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-3">Feedback &amp; Accommodation Requests</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We welcome feedback on the accessibility of Check-In. If you encounter an accessibility barrier or need an accommodation to use the platform, please contact us:
            </p>
            <div className="text-slate-700 space-y-1">
              <p><strong>Athlete Anchor, Inc.</strong></p>
              <p>Accessibility Team</p>
              <p>Email: accessibility@athleteanchor.com</p>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              We aim to respond to accessibility feedback within 2 business days and resolve issues as quickly as possible.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 bg-white">
        <div className="max-w-4xl mx-auto px-6">
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
              <Link href="/accessibility" className="text-emerald-600 font-medium">Accessibility</Link>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6">
            &copy; {new Date().getFullYear()} Athlete Anchor, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
