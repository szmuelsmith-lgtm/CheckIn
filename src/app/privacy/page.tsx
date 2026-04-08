import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Anchor,
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Users,
  Database,
  Trash2,
  Server,
  GraduationCap,
  Baby,
  Bell,
  Mail,
} from "lucide-react";

export default function PrivacyPage() {
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
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-green-50/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative max-w-4xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-full px-4 py-1.5 text-sm text-emerald-700 font-medium mb-6">
            <Shield className="h-3.5 w-3.5" />
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
            How Check-In by Athlete Anchor collects, protects, and handles your data.
            Privacy is not a feature we added — it is the foundation we built on.
          </p>
          <p className="text-sm text-slate-400 mt-4">Last updated: March 27, 2026</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="space-y-16">

            {/* 1. Information We Collect */}
            <PolicySection
              icon={<Database className="h-5 w-5" />}
              number="1"
              title="Information We Collect"
            >
              <p>
                Check-In collects information necessary to provide athlete wellness monitoring
                and support coordination for your institution&apos;s athletic program. We collect
                the following categories of information:
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Check-In Responses</h4>
              <p>
                When athletes complete a weekly check-in, we collect their self-reported ratings
                for mood, energy, stress, sleep quality, academic confidence, and support satisfaction.
                These are submitted as numeric scale responses (typically 1&ndash;5). Athletes may
                also optionally rate dimensions such as relationships, faith/spirituality, and team
                dynamics depending on their program&apos;s configuration.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Journal Entries</h4>
              <p>
                Athletes may write private journal entries at any time. Journal content is
                free-form text stored in the athlete&apos;s Private tier and is never visible
                to coaches, administrators, or counselors unless the athlete explicitly chooses
                to share it. Journals are fully deletable by the athlete.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Account Information</h4>
              <p>
                When an account is created (typically provisioned by the institution), we store
                the athlete&apos;s name, institutional email address, team assignment, sport,
                and role within the platform (athlete, coach, admin, or counselor). We do not
                collect Social Security numbers, student ID numbers, or financial information.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Usage Data</h4>
              <p>
                We collect standard usage data including check-in completion timestamps, login
                frequency, device type (mobile/desktop), and general interaction patterns. This
                data is used to improve the platform and monitor system health. We do not use
                third-party analytics trackers or advertising pixels.
              </p>
            </PolicySection>

            {/* 2. Three-Tier Privacy Model */}
            <PolicySection
              icon={<Eye className="h-5 w-5" />}
              number="2"
              title="Three-Tier Privacy Model"
            >
              <p>
                Check-In implements a three-tier privacy model that controls which personnel
                can access which types of athlete data. This model is enforced at the database
                level through row-level security policies, not merely through application-layer
                logic. The three tiers are:
              </p>

              <div className="mt-6 space-y-5">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <EyeOff className="h-4 w-4 text-emerald-600" />
                    <h4 className="font-semibold text-emerald-800">Private Tier — Athlete Only</h4>
                  </div>
                  <p className="text-sm text-slate-600">
                    Data in the Private tier is visible exclusively to the athlete who created it.
                    No coach, administrator, or counselor can access Private-tier data under any
                    circumstance through the platform. This tier includes: journal entries, free-text
                    notes attached to check-ins, personal follow-up requests, and faith/spirituality
                    preferences. Athletes have full control over Private-tier data, including the
                    ability to edit or permanently delete it at any time.
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-amber-600" />
                    <h4 className="font-semibold text-amber-800">Support Tier — Licensed Counselors &amp; Admins</h4>
                  </div>
                  <p className="text-sm text-slate-600">
                    Data in the Support tier is visible to licensed counselors designated by the
                    institution and to program administrators with appropriate roles. Coaches cannot
                    access Support-tier data. This tier includes: flagged check-in responses that
                    trigger risk thresholds, specific alert details and trigger types (e.g., which
                    dimension scored critically low), crisis indicators, detailed response patterns
                    over time, and counselor case notes about follow-up actions. Support-tier access
                    is logged in the platform&apos;s audit trail.
                  </p>
                </div>

                <div className="rounded-xl bg-sky-50 border border-sky-200 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-sky-600" />
                    <h4 className="font-semibold text-sky-800">Coach Tier — Team Coaches Only</h4>
                  </div>
                  <p className="text-sm text-slate-600">
                    Data in the Coach tier is intentionally limited. Coaches can see only: whether
                    each athlete on their team has completed their weekly check-in, a single risk
                    status color (green, yellow, or red) with no underlying detail, assigned follow-up
                    tasks relevant to their role, and aggregate team completion rates. Coaches cannot
                    see individual check-in scores, journal content, alert details, or any
                    free-text responses. Coaches can only view data for athletes on their own
                    team — cross-team visibility is not permitted.
                  </p>
                </div>
              </div>
            </PolicySection>

            {/* 3. FERPA Compliance */}
            <PolicySection
              icon={<GraduationCap className="h-5 w-5" />}
              number="3"
              title="FERPA Compliance"
            >
              <p>
                Check-In is designed to be aligned with the Family Educational Rights and Privacy
                Act (FERPA), 20 U.S.C. &sect; 1232g. We recognize that wellness check-in data
                collected through an institutional athletic program may constitute education records
                under FERPA and treat such data accordingly.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Institutional Data Controllers</h4>
              <p>
                Your institution is the data controller for all athlete records stored in Check-In.
                Athlete Anchor acts as a school official with a legitimate educational interest under
                the institution&apos;s FERPA policies, processing data on behalf of and under the
                direct control of the institution. Access to personally identifiable information
                from education records is limited to those with a legitimate educational interest
                as determined by the institution.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Directory Information</h4>
              <p>
                Check-In does not publicly disclose any directory information. Athlete names and
                team assignments are visible only to authorized personnel within the institution&apos;s
                Check-In deployment and are not shared externally.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Parental and Eligible Student Rights</h4>
              <p>
                Because Check-In is designed for college and university athletes (age 18+), FERPA
                rights typically belong to the eligible student (the athlete). Athletes may request
                access to their data through the platform at any time and may request corrections
                or deletion through their institution&apos;s established FERPA processes.
              </p>
            </PolicySection>

            {/* 4. HIPAA Considerations */}
            <PolicySection
              icon={<Shield className="h-5 w-5" />}
              number="4"
              title="HIPAA Considerations"
            >
              <p>
                Transparency about our legal obligations is important to us.
                <strong> Check-In is not a covered entity or business associate under the Health
                Insurance Portability and Accountability Act (HIPAA).</strong> Check-In does not
                provide medical treatment, diagnosis, or healthcare services. It does not transmit
                health information in connection with health insurance transactions. Wellness
                check-in responses are self-reported subjective ratings, not clinical assessments
                or protected health information (PHI) as defined under HIPAA.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">HIPAA-Inspired Safeguards</h4>
              <p>
                Although not legally required to comply with HIPAA, we have designed Check-In
                with safeguards inspired by HIPAA&apos;s Security Rule and Privacy Rule because
                athlete wellness data deserves strong protection regardless of its legal
                classification. These safeguards include:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-1.5 text-slate-600">
                <li>Encryption of data in transit (TLS 1.2+) and at rest (AES-256)</li>
                <li>Role-based access controls enforced at the database level</li>
                <li>Comprehensive audit logging of all data access by staff</li>
                <li>Minimum necessary access principle — each role sees only what it needs</li>
                <li>Automatic session expiration and re-authentication requirements</li>
                <li>No athlete wellness content included in email notifications</li>
              </ul>

              <p className="mt-4">
                If your institution requires a Business Associate Agreement (BAA) based on how
                Check-In data intersects with your institution&apos;s clinical workflows, please
                contact us to discuss your specific requirements.
              </p>
            </PolicySection>

            {/* 5. Data Security */}
            <PolicySection
              icon={<Lock className="h-5 w-5" />}
              number="5"
              title="Data Security"
            >
              <p>
                We implement multiple layers of security to protect athlete data:
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Encryption</h4>
              <p>
                All data is encrypted in transit using TLS 1.2 or higher. Data at rest is
                encrypted using AES-256 encryption provided by our database infrastructure.
                Database connections require SSL and are not accessible over the public internet.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Row-Level Security</h4>
              <p>
                Our three-tier privacy model is enforced through PostgreSQL row-level security
                (RLS) policies. This means that even if application-layer logic were bypassed,
                the database itself prevents unauthorized data access. A coach&apos;s database
                session physically cannot query another team&apos;s data or access Support-tier
                information.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Audit Logging</h4>
              <p>
                Every access to athlete data by a staff member (coach, counselor, or admin) is
                logged with a timestamp, the accessor&apos;s identity, the action performed,
                and the data accessed. These audit logs are immutable and available to
                institutional administrators for compliance review.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Role-Based Access Control</h4>
              <p>
                Each user is assigned exactly one role (athlete, coach, counselor, or admin) with
                permissions defined by the three-tier privacy model. Role changes require
                administrator action and are audit-logged. There is no &ldquo;super admin&rdquo;
                role that bypasses the tier system.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Email Security</h4>
              <p>
                Notification emails (check-in reminders, alert notifications) never contain
                athlete wellness content, check-in scores, risk details, or journal text. Emails
                contain only action prompts (e.g., &ldquo;An athlete on your team needs
                follow-up&rdquo;) that require staff to authenticate into the platform to
                view details.
              </p>
            </PolicySection>

            {/* 6. Data Retention & Deletion */}
            <PolicySection
              icon={<Trash2 className="h-5 w-5" />}
              number="6"
              title="Data Retention &amp; Deletion"
            >
              <h4 className="font-semibold text-slate-900 mb-2">Journal Entries</h4>
              <p>
                Athletes may permanently delete any journal entry at any time through the
                platform. Deleted journals are removed from the database and are not recoverable.
                Deletion is immediate, not queued.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Check-In Response Data</h4>
              <p>
                Check-in responses are retained according to your institution&apos;s data retention
                policy. Institutions configure their retention period during onboarding. Check-In
                supports retention periods ranging from one academic term to the duration of the
                athlete&apos;s enrollment. Institutions may request bulk deletion of historical
                data at any time.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Account Deletion</h4>
              <p>
                Athletes may request full account deletion through the platform or by contacting
                their institutional administrator. Upon account deletion, all Private-tier data
                (journals, notes) is permanently deleted. Check-in response data deletion follows
                the institution&apos;s retention policy, as the institution is the data controller
                for education records. Aggregate, de-identified data that cannot be traced to an
                individual athlete may be retained for platform improvement purposes.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Post-Graduation / Transfer</h4>
              <p>
                When an athlete graduates or transfers, the institution&apos;s administrator
                determines whether to deactivate or delete the account. Athletes are notified
                prior to any administrative action on their account and may download their
                Private-tier data before deactivation.
              </p>
            </PolicySection>

            {/* 7. Third-Party Services */}
            <PolicySection
              icon={<Server className="h-5 w-5" />}
              number="7"
              title="Third-Party Services"
            >
              <p>
                Check-In relies on a limited number of third-party infrastructure providers
                to operate. We do not sell, share, or provide athlete data to any third party
                for marketing, advertising, or data brokering purposes. Our third-party
                providers are:
              </p>

              <div className="mt-6 space-y-5">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
                  <h4 className="font-semibold text-slate-900 mb-1">Supabase</h4>
                  <p className="text-sm text-slate-500 mb-2">Database, Authentication &amp; Storage</p>
                  <p className="text-sm text-slate-600">
                    Supabase provides our PostgreSQL database, user authentication, and row-level
                    security enforcement. All athlete data is stored in Supabase infrastructure.
                    Supabase data centers are SOC 2 Type II certified and located in the United States.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
                  <h4 className="font-semibold text-slate-900 mb-1">Resend</h4>
                  <p className="text-sm text-slate-500 mb-2">Transactional Email</p>
                  <p className="text-sm text-slate-600">
                    Resend delivers notification emails such as check-in reminders and alert
                    notifications. Critically, no athlete wellness content is included in
                    any email sent through Resend. Emails contain only generic action prompts
                    and links back to the authenticated platform.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
                  <h4 className="font-semibold text-slate-900 mb-1">Vercel</h4>
                  <p className="text-sm text-slate-500 mb-2">Application Hosting</p>
                  <p className="text-sm text-slate-600">
                    Vercel hosts the Check-In web application. Vercel does not have access to
                    athlete data stored in our database. Vercel&apos;s infrastructure is SOC 2
                    Type II certified and provides edge deployment across the United States.
                  </p>
                </div>
              </div>
            </PolicySection>

            {/* 8. NCAA Compliance */}
            <PolicySection
              icon={<Shield className="h-5 w-5" />}
              number="8"
              title="NCAA Compliance"
            >
              <p>
                Check-In is designed to support institutions in meeting the NCAA&apos;s mental
                health best practices and requirements for student-athlete wellness programs.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Beyond Annual Screening</h4>
              <p>
                The NCAA recommends that institutions go beyond one-time annual mental health
                screenings. Check-In provides weekly wellness monitoring that creates an ongoing,
                longitudinal view of athlete well-being. This regular cadence enables early
                detection of declining trends that annual screenings would miss.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Documentation &amp; Accountability</h4>
              <p>
                Check-In automatically generates compliance documentation including: weekly
                check-in completion rates by team, risk flagging and follow-up tracking records,
                audit trails demonstrating staff response to flagged athletes, and aggregate
                wellness trend reports. This documentation can support an institution&apos;s
                demonstration of compliance with NCAA mental health best practices during
                reviews or audits.
              </p>

              <h4 className="font-semibold text-slate-900 mt-6 mb-2">Referral Workflows</h4>
              <p>
                When an athlete&apos;s check-in triggers a risk flag, Check-In routes the
                appropriate level of information to the appropriate personnel as defined by
                the three-tier model. This structured referral workflow aligns with the
                NCAA&apos;s guidance on having clear protocols for connecting athletes with
                mental health resources.
              </p>
            </PolicySection>

            {/* 9. Children's Privacy */}
            <PolicySection
              icon={<Baby className="h-5 w-5" />}
              number="9"
              title="Children&apos;s Privacy"
            >
              <p>
                Check-In is designed exclusively for college and university athletic programs
                and is intended for use by individuals aged 18 and older. We do not knowingly
                collect personal information from children under the age of 13, and the platform
                is not directed at children under 13 as defined by the Children&apos;s Online
                Privacy Protection Act (COPPA).
              </p>
              <p className="mt-3">
                If we become aware that we have inadvertently collected personal information from
                a child under 13, we will take immediate steps to delete that information from
                our systems. If you believe a child under 13 has provided information through
                Check-In, please contact us immediately at{" "}
                <a href="mailto:privacy@athleteanchor.com" className="text-emerald-600 hover:text-emerald-700 underline underline-offset-2">
                  privacy@athleteanchor.com
                </a>.
              </p>
              <p className="mt-3">
                For athletes between 13 and 17 who may participate in dual-enrollment or early
                college programs, we recommend institutions consult with their legal counsel
                regarding any additional consent requirements before provisioning accounts.
              </p>
            </PolicySection>

            {/* 10. Title IX & Mandatory Reporting */}
            <PolicySection
              icon={<Shield className="h-5 w-5" />}
              number="10"
              title="Title IX &amp; Mandatory Reporting"
            >
              <p>
                Many staff members at educational institutions are &ldquo;responsible employees&rdquo;
                under Title IX or mandatory reporters under state law. If an athlete discloses sexual
                violence, harassment, abuse, or harm to a minor through the Platform (including in
                journal entries or check-in responses), staff members who become aware of such
                disclosures may be legally required to report them to the institution&apos;s Title IX
                Coordinator, Child Protective Services, or law enforcement.
              </p>
              <p className="mt-3">
                <strong>Check-In does not promise absolute confidentiality.</strong> While journal
                entries are in the Private tier and are not accessible to staff through the Platform,
                athletes should be aware that legal reporting obligations may apply if disclosures
                reach institutional personnel through any channel. We encourage athletes who wish
                to make confidential disclosures to contact licensed counselors with legal privilege
                or campus victim advocacy services directly.
              </p>
            </PolicySection>

            {/* 11. State Privacy Laws */}
            <PolicySection
              icon={<Shield className="h-5 w-5" />}
              number="11"
              title="State Privacy Laws"
            >
              <p>
                In addition to federal law, Check-In is designed to comply with applicable state
                privacy and student data protection laws, including but not limited to:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-1.5 text-slate-600">
                <li><strong>CCPA/CPRA</strong> (California): California residents have rights to know, delete, correct, and opt out of the sale of personal information. We do not sell personal information.</li>
                <li><strong>SOPIPA</strong> (California) and similar state laws: We do not use student data for targeted advertising, behavioral profiling, or sale to third parties.</li>
                <li><strong>State breach notification laws</strong> (all 50 states): We maintain an incident response plan and will notify affected individuals and authorities as required by applicable state law in the event of a data breach.</li>
                <li><strong>State mental health confidentiality statutes:</strong> Institutions should consult with legal counsel regarding whether state-specific mental health record protections apply to data accessed by licensed counselors through the Platform.</li>
              </ul>
            </PolicySection>

            {/* 12. Email Communications */}
            <PolicySection
              icon={<Mail className="h-5 w-5" />}
              number="12"
              title="Email Communications"
            >
              <p>
                Our email practices comply with the CAN-SPAM Act (15 U.S.C. &sect; 7701). Transactional
                emails (risk alert notifications, check-in reminders) are sent only to authorized
                institutional staff and enrolled athletes. Athletes may opt out of weekly reminder
                emails through their Preferences page. All emails include our physical mailing address
                and unsubscribe instructions. We honor opt-out requests within 10 business days.
              </p>
            </PolicySection>

            {/* 13. Law Enforcement Requests */}
            <PolicySection
              icon={<Shield className="h-5 w-5" />}
              number="13"
              title="Law Enforcement &amp; Legal Requests"
            >
              <p>
                Check-In complies with the Electronic Communications Privacy Act (ECPA) and the
                Stored Communications Act (SCA). We will disclose user data to government entities
                only in response to valid legal process:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-1.5 text-slate-600">
                <li>A <strong>search warrant</strong> supported by probable cause is required for the content of communications (journal entries, check-in responses)</li>
                <li>A <strong>court order or subpoena</strong> may be sufficient for non-content records (login metadata, account information)</li>
                <li>We will notify affected users of legal requests unless prohibited by law or court order</li>
              </ul>
              <p className="mt-3">
                In emergencies involving imminent danger of death or serious physical injury,
                we may disclose information to law enforcement without legal process, consistent
                with FERPA&apos;s health and safety emergency exception (34 CFR &sect; 99.36) and
                ECPA&apos;s emergency exception (18 U.S.C. &sect; 2702(b)(8)).
              </p>
            </PolicySection>

            {/* 14. Changes to This Policy */}
            <PolicySection
              icon={<Bell className="h-5 w-5" />}
              number="14"
              title="Changes to This Policy"
            >
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our
                practices, technology, legal requirements, or other factors. When we make
                material changes to this policy, we will:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-1.5 text-slate-600">
                <li>Update the &ldquo;Last updated&rdquo; date at the top of this page</li>
                <li>Notify institutional administrators via email at least 30 days before material changes take effect</li>
                <li>Display a prominent notice within the platform for all users upon their next login</li>
                <li>For changes affecting the three-tier privacy model or data sharing practices, provide at least 60 days advance notice</li>
              </ul>
              <p className="mt-4">
                Continued use of Check-In after the effective date of a revised policy constitutes
                acceptance of the updated terms. If you do not agree with a revised policy, you
                may request account deletion before the effective date.
              </p>
            </PolicySection>

            {/* 15. Contact Information */}
            <PolicySection
              icon={<Mail className="h-5 w-5" />}
              number="15"
              title="Contact Information"
            >
              <p>
                If you have questions about this Privacy Policy, want to exercise your data
                rights, or need to report a privacy concern, please contact us:
              </p>
              <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-200 p-6">
                <p className="font-semibold text-slate-900 mb-1">Athlete Anchor, Inc.</p>
                <p className="text-slate-600">Privacy Inquiries</p>
                <p className="mt-3">
                  <a href="mailto:privacy@athleteanchor.com" className="text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2">
                    privacy@athleteanchor.com
                  </a>
                </p>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                For FERPA-related requests, athletes should contact their institution&apos;s
                registrar or designated FERPA officer in addition to contacting us. For
                urgent privacy concerns or suspected data breaches, please include
                &ldquo;URGENT&rdquo; in your email subject line.
              </p>
            </PolicySection>

          </div>
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

function PolicySection({
  icon,
  number,
  title,
  children,
}: {
  icon: React.ReactNode;
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          <span className="text-emerald-600 mr-1.5">{number}.</span>
          {title}
        </h2>
      </div>
      <div className="pl-[52px] text-slate-600 leading-relaxed space-y-0 text-[15px]">
        {children}
      </div>
    </div>
  );
}
