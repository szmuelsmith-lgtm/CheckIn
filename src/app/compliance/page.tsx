import Link from "next/link";
import {
  Anchor,
  ArrowLeft,
  Shield,
  Lock,
  Users,
  Eye,
  Database,
  Check,
  FileCheck,
  ClipboardCheck,
  Heart,
  ArrowRight,
  Server,
} from "lucide-react";

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-emerald-100/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-green-50/30" />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-full px-4 py-1.5 text-sm text-emerald-700 font-medium mb-6">
            <Shield className="h-3.5 w-3.5" />
            Compliance &amp; Security
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Built for trust.<br />Designed for compliance.
          </h1>
          <p className="text-lg text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
            Check-In is engineered from the ground up to meet the regulatory and ethical standards required for athlete wellness programs at the collegiate level.
          </p>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-emerald-100/60 bg-emerald-900 py-4">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-x-10 gap-y-2 text-sm text-emerald-300/80">
          <span>FERPA-Aligned</span>
          <span>HIPAA-Inspired Controls</span>
          <span>NCAA Best Practices</span>
          <span>SOC 2 Ready</span>
          <span>Audit Logged</span>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-20">
        {/* FERPA */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
              <Shield className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">FERPA Compliance</h2>
              <p className="text-slate-500 mt-1">Family Educational Rights and Privacy Act</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-8">
            <p className="text-slate-600 leading-relaxed mb-6">
              Check-In is designed as a FERPA-aligned education technology. We treat all wellness check-in data maintained by the institution as education records protected under FERPA (20 U.S.C. &sect; 1232g).
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Institutions are the data controllers; Athlete Anchor acts as a \"school official\" with legitimate educational interest",
                "No disclosure of personally identifiable information without written student consent",
                "Directory information is never shared with third parties outside the institution",
                "Students maintain the right to inspect and review their own records",
                "All data access is comprehensively audit-logged",
                "FERPA rights belong to the student at the college level (not parents)",
                "Health and safety emergency exception protocols are documented",
                "Legitimate educational interest: wellness monitoring supports student success",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HIPAA */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
              <Lock className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">HIPAA-Inspired Security</h2>
              <p className="text-slate-500 mt-1">Health Insurance Portability and Accountability Act</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-8">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Check-In is not a HIPAA-covered entity. We do not provide medical treatment, clinical diagnosis, or health care billing. However, we recognize the sensitivity of athlete wellness data and have built our platform with security controls that meet or exceed HIPAA-inspired standards.
              </p>
            </div>
            <p className="text-slate-600 leading-relaxed mb-6">
              If your institution&rsquo;s counseling center (a HIPAA-covered entity) interfaces with Check-In data, we are prepared to execute a Business Associate Agreement (BAA).
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Encryption at rest and in transit (TLS 1.2+)",
                "Role-based access controls enforced at the database level",
                "Comprehensive audit logging of all data access and modifications",
                "Minimum necessary principle — each role sees only what is required",
                "No protected health information in email notifications",
                "Breach notification procedures documented and ready",
                "Data integrity controls and backup procedures",
                "BAA available for institutions requiring HIPAA coverage",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NCAA */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
              <Users className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">NCAA Mental Health Best Practices</h2>
              <p className="text-slate-500 mt-1">Interassociation Consensus Document &amp; Constitution Article 2.2</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-8">
            <p className="text-slate-600 leading-relaxed mb-6">
              Check-In is designed to support the key recommendations of the NCAA Interassociation Consensus on Mental Health Best Practices and the principle of student-athlete well-being outlined in NCAA Constitution Article 2.2.
            </p>
            <div className="space-y-4">
              {[
                {
                  title: "Regular mental health screening beyond pre-participation exams",
                  description: "Weekly 2-minute check-ins create ongoing monitoring that catches what annual screenings miss.",
                  icon: <ClipboardCheck className="h-5 w-5 text-emerald-600" />,
                },
                {
                  title: "Licensed practitioners involved in care",
                  description: "Support tier routes alerts exclusively to licensed counselors and designated administrators — never directly to coaches.",
                  icon: <Heart className="h-5 w-5 text-emerald-600" />,
                },
                {
                  title: "Referral networks and resources",
                  description: "Built-in resource library with crisis hotlines, counseling services, academic support, and wellness resources available to every athlete.",
                  icon: <FileCheck className="h-5 w-5 text-emerald-600" />,
                },
                {
                  title: "Tracking and follow-up",
                  description: "Structured follow-up task system ensures every flagged athlete receives outreach. Tasks are assigned, tracked, and documented.",
                  icon: <Eye className="h-5 w-5 text-emerald-600" />,
                },
                {
                  title: "Student-athlete education about mental health",
                  description: "Resource sharing features enable institutions to distribute mental health education materials directly through the platform.",
                  icon: <Users className="h-5 w-5 text-emerald-600" />,
                },
                {
                  title: "Confidentiality protections",
                  description: "Three-tier privacy model ensures coaches see only completion status and risk color — never individual scores, notes, or clinical details.",
                  icon: <Lock className="h-5 w-5 text-emerald-600" />,
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 bg-white rounded-xl border border-slate-200/60 p-5">
                  <div className="p-2 bg-emerald-50 rounded-xl shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOC 2 */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
              <Server className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">SOC 2 Ready Architecture</h2>
              <p className="text-slate-500 mt-1">Trust Service Criteria</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-8">
            <p className="text-slate-600 leading-relaxed mb-6">
              Our platform architecture is designed to meet SOC 2 Type II requirements across the Security, Availability, and Confidentiality Trust Service Criteria.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Security",
                  items: ["Row-level security policies", "Role-based access control", "Encrypted data storage", "Secure authentication"],
                },
                {
                  title: "Availability",
                  items: ["99.9% uptime target", "PWA offline support", "Edge network delivery", "Automated monitoring"],
                },
                {
                  title: "Confidentiality",
                  items: ["Three-tier privacy model", "Audit trail for all access", "No data in notifications", "Data minimization"],
                },
              ].map((category) => (
                <div key={category.title} className="bg-white rounded-xl border border-slate-200/60 p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">{category.title}</h3>
                  <ul className="space-y-2">
                    {category.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Data Security Controls */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
              <Database className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Data Security Controls</h2>
              <p className="text-slate-500 mt-1">Technical safeguards protecting athlete data</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Row-Level Security (RLS)",
                description: "Database-enforced policies ensure every query is scoped to authorized data. Athletes see only their own data. Coaches see only their team. Support staff see only their organization.",
              },
              {
                title: "End-to-End Encryption",
                description: "All data encrypted in transit via TLS 1.2+ and at rest within our database infrastructure. Journal entries receive additional encryption protections.",
              },
              {
                title: "Comprehensive Audit Logging",
                description: "Every data access, creation, update, and deletion is logged with actor identity, timestamp, action type, and affected record. Logs are immutable and exportable.",
              },
              {
                title: "Privacy-Safe Notifications",
                description: "Email notifications about wellness alerts never contain athlete names, scores, or check-in content. They prompt authorized staff to log in and review securely.",
              },
            ].map((control) => (
              <div key={control.title} className="bg-slate-50 rounded-2xl border border-slate-200/60 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{control.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{control.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Institutional Data Processing */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
              <FileCheck className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Data Processing</h2>
              <p className="text-slate-500 mt-1">Clear roles and responsibilities</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Institution (Data Controller)</h3>
                <ul className="space-y-2">
                  {[
                    "Determines purpose of data collection",
                    "Manages student consent and notification",
                    "Designates staff access and roles",
                    "Responsible for FERPA compliance",
                    "Owns institutional data",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Athlete Anchor (Data Processor)</h3>
                <ul className="space-y-2">
                  {[
                    "Processes data only as directed by institution",
                    "Maintains technical security controls",
                    "Provides audit logging and compliance tools",
                    "Data Processing Agreement available",
                    "Data deletion upon contract termination",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Title IX */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
              <Shield className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Title IX Compliance</h2>
              <p className="text-slate-500 mt-1">20 U.S.C. &sect; 1681 &mdash; Sex-based discrimination protections</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-8">
            <p className="text-slate-600 leading-relaxed mb-4">
              Check-In is designed to support institutional Title IX compliance. Our platform addresses potential disclosure scenarios and mandatory reporting obligations.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Athletes are notified during onboarding that staff may be mandatory reporters under Title IX",
                "No false promises of absolute confidentiality — disclosures may trigger reporting obligations",
                "Platform directs athletes to confidential resources (licensed counselors with legal privilege)",
                "Deployed equitably across all athletic programs regardless of gender",
                "Audit trails document disclosure handling for institutional compliance",
                "Institutions configure which staff are \"responsible employees\" under their Title IX policy",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ADA / Section 504 / WCAG */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
              <Users className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Accessibility (ADA / Section 504 / WCAG)</h2>
              <p className="text-slate-500 mt-1">Ensuring equal access for all users</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-8">
            <p className="text-slate-600 leading-relaxed mb-4">
              Check-In targets WCAG 2.1 Level AA conformance to support institutional compliance with ADA Title II (public institutions), ADA Title III (private institutions), Section 504 of the Rehabilitation Act, and Section 508 standards.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Keyboard-navigable interface for all interactive elements",
                "Screen reader compatible with semantic HTML and ARIA labels",
                "Sufficient color contrast ratios (4.5:1 for normal text)",
                "Risk status communicated through text labels, not color alone",
                "Responsive design supporting 200% browser zoom",
                "VPAT (Voluntary Product Accessibility Template) available upon request",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">{item}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-4">
              See our full <Link href="/accessibility" className="text-emerald-600 underline">Accessibility Statement</Link> for details.
            </p>
          </div>
        </section>

        {/* State Privacy Laws */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
              <Shield className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">State Privacy Laws</h2>
              <p className="text-slate-500 mt-1">CCPA/CPRA, SOPIPA, breach notification, and more</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-8">
            <div className="space-y-4">
              {[
                {
                  title: "CCPA/CPRA (California)",
                  description: "We do not sell personal information. California residents have rights to know, delete, correct, and opt out. Our privacy practices meet CCPA requirements.",
                },
                {
                  title: "SOPIPA & Student Data Laws (20+ states)",
                  description: "We never use student data for targeted advertising, behavioral profiling, or sale to third parties. Data is deleted upon institutional request.",
                },
                {
                  title: "Breach Notification (All 50 States)",
                  description: "We maintain an incident response plan covering detection, containment, and notification within the timeframes required by each applicable state law. Encryption at rest provides safe harbor under most state laws.",
                },
                {
                  title: "State Mental Health Confidentiality",
                  description: "We advise institutions to consult counsel regarding state-specific mental health record protections that may apply when licensed counselors access individual data through the platform.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-xl border border-slate-200/60 p-5">
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FTC & CAN-SPAM & ECPA */}
        <section>
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl shrink-0">
              <Shield className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Additional Federal Compliance</h2>
              <p className="text-slate-500 mt-1">FTC Act, CAN-SPAM, ECPA, and Clery Act</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-8">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  title: "FTC Act Section 5",
                  description: "Our privacy disclosures are accurate and complete. We implement reasonable data security measures consistent with the sensitivity of wellness data.",
                },
                {
                  title: "FTC Health Breach Notification Rule",
                  description: "Our breach notification procedures cover the FTC Health Breach Rule (16 CFR Part 318) in addition to state requirements.",
                },
                {
                  title: "CAN-SPAM Act",
                  description: "All emails include a physical mailing address and unsubscribe mechanism. Athletes can opt out of reminders. Opt-outs are honored within 10 business days.",
                },
                {
                  title: "ECPA / Stored Communications Act",
                  description: "We disclose stored communications only with valid legal process (warrant for content, subpoena for metadata). Users are notified unless prohibited by law.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-xl border border-slate-200/60 p-5">
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-emerald-900 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
            Questions about compliance?
          </h2>
          <p className="text-emerald-300/80 mb-6 max-w-lg mx-auto">
            Our team is ready to discuss your institution&rsquo;s specific compliance needs, provide a Data Processing Agreement, or schedule a security review.
          </p>
          <div className="text-white space-y-2">
            <p className="font-semibold">compliance@athleteanchor.com</p>
          </div>
          <div className="mt-8">
            <Link href="/signup">
              <button className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold text-base px-8 py-3 rounded-lg transition-colors">
                Start Free Pilot
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 bg-white">
        <div className="max-w-5xl mx-auto px-6">
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
              <Link href="/compliance" className="text-emerald-600 font-medium">Compliance</Link>
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
