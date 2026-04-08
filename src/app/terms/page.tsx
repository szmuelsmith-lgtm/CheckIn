import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Anchor, ArrowLeft, Scale } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-emerald-100/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-900 flex items-center justify-center">
              <Anchor className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">Check-In</span>
              <span className="text-[10px] text-emerald-600 ml-1.5 font-medium uppercase tracking-widest">Athlete Anchor</span>
            </div>
          </Link>
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

      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-green-50/30" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-full px-4 py-1.5 text-sm text-emerald-700 font-medium mb-6">
            <Scale className="h-3.5 w-3.5" />
            Legal
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-slate-500 mt-4 text-lg">
            Check-In by Athlete Anchor
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Last updated: March 1, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="prose prose-slate max-w-none">

            {/* Back link */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium no-underline mb-10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>

            {/* 1. Acceptance of Terms */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              1. Acceptance of Terms
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              By accessing or using the Check-In platform (&quot;Platform&quot;) operated by Athlete Anchor, Inc. (&quot;Athlete Anchor,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not access or use the Platform.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              These Terms apply to all users of the Platform, including athletes, coaches, institutional administrators, and support staff. Your continued use of the Platform following the posting of any changes to these Terms constitutes acceptance of those changes.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              If you are accepting these Terms on behalf of an institution, you represent and warrant that you have the authority to bind that institution to these Terms.
            </p>

            {/* 2. Description of Service */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              2. Description of Service
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Check-In is a privacy-first wellness check-in platform designed for college and university athletic programs. The Platform enables student-athletes to complete brief, recurring wellness assessments and provides institutional staff with structured tools for monitoring athlete well-being, identifying at-risk individuals through automated risk scoring, and coordinating appropriate follow-up.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 my-6">
              <p className="text-amber-800 font-semibold text-sm mb-2">Important Disclaimers:</p>
              <ul className="text-amber-700 text-sm space-y-1.5 list-none pl-0 mb-0">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">&bull;</span>
                  The Platform is <strong>not a medical service</strong> and does not provide medical diagnoses or treatment.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">&bull;</span>
                  The Platform is <strong>not a crisis intervention service</strong> and should not be relied upon for emergency mental health situations.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">&bull;</span>
                  The Platform is <strong>not a substitute for therapy</strong>, counseling, or any form of professional mental health treatment.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">&bull;</span>
                  The Platform is a <strong>screening and monitoring tool</strong> that assists institutions in identifying athletes who may benefit from professional support.
                </li>
              </ul>
            </div>

            {/* 3. User Accounts & Roles */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              3. User Accounts &amp; Roles
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              The Platform supports four primary user roles, each with distinct permissions and responsibilities:
            </p>
            <div className="space-y-4 mb-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
                <p className="font-semibold text-slate-800 text-sm mb-1">Athlete</p>
                <p className="text-slate-600 text-sm leading-relaxed mb-0">
                  Completes weekly wellness check-ins, maintains a private journal, controls personal privacy settings, and may request follow-up support. Athletes own their private-tier data and control what is shared beyond the minimum required for program participation.
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
                <p className="font-semibold text-slate-800 text-sm mb-1">Coach</p>
                <p className="text-slate-600 text-sm leading-relaxed mb-0">
                  Views coach-tier data for athletes on their assigned team(s) only, including check-in completion status, aggregate risk indicators (color-coded, not detailed responses), and assigned follow-up tasks. Coaches do not have access to private or support-tier data.
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
                <p className="font-semibold text-slate-800 text-sm mb-1">Administrator</p>
                <p className="text-slate-600 text-sm leading-relaxed mb-0">
                  Manages institutional settings, user provisioning, team assignments, and platform configuration. Administrators are responsible for designating appropriate staff roles and ensuring compliance with institutional policies and applicable law.
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/60">
                <p className="font-semibold text-slate-800 text-sm mb-1">Support Staff</p>
                <p className="text-slate-600 text-sm leading-relaxed mb-0">
                  Licensed counselors or designated support personnel who receive support-tier alerts, including flagged responses, crisis indicators, and detailed risk information. Support staff are responsible for conducting appropriate follow-up with at-risk athletes.
                </p>
              </div>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Institution administrators are responsible for managing user access, assigning appropriate roles, and promptly deactivating accounts when users leave the program.
            </p>

            {/* 4. Acceptable Use */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              4. Acceptable Use
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              You agree to use the Platform only for its intended purpose of supporting athlete wellness within your authorized institutional program. You shall not:
            </p>
            <ul className="text-slate-600 space-y-2 mb-4 list-none pl-0">
              {[
                "Attempt to access, view, or export data belonging to users outside your authorized scope or role",
                "Share, redistribute, or publicly disclose any athlete wellness data obtained through the Platform",
                "Use the Platform to harass, intimidate, or retaliate against any athlete based on their check-in responses or participation",
                "Circumvent or attempt to circumvent privacy tier controls or access restrictions",
                "Use any automated means, scraping tools, or bots to access or extract data from the Platform",
                "Misrepresent your identity, role, or institutional affiliation",
                "Use athlete wellness data for recruiting, athletic performance evaluation, or scholarship decisions unless expressly permitted by institutional policy and applicable law",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <span className="text-emerald-500 mt-0.5 shrink-0">&bull;</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-slate-600 leading-relaxed mb-4">
              Violations of acceptable use may result in immediate suspension or termination of your account, as well as notification to your institution.
            </p>

            {/* 5. Privacy & Data */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              5. Privacy &amp; Data
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Your use of the Platform is also governed by our{" "}
              <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700 underline">
                Privacy Policy
              </Link>, which is incorporated into these Terms by reference. Please review it carefully.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              The Platform employs a three-tier privacy model designed to protect athlete data while enabling appropriate institutional oversight:
            </p>
            <ul className="text-slate-600 space-y-2 mb-4 list-none pl-0">
              <li className="flex items-start gap-2.5 text-sm">
                <span className="text-emerald-500 mt-0.5 shrink-0">&bull;</span>
                <strong>Private Tier:</strong> Journal entries, personal notes, and free-text responses are visible only to the athlete. Athlete Anchor does not access, read, or share private-tier data.
              </li>
              <li className="flex items-start gap-2.5 text-sm">
                <span className="text-amber-500 mt-0.5 shrink-0">&bull;</span>
                <strong>Support Tier:</strong> Flagged responses, crisis indicators, and detailed alert information are shared with licensed support staff and institutional administrators as necessary for athlete safety.
              </li>
              <li className="flex items-start gap-2.5 text-sm">
                <span className="text-sky-500 mt-0.5 shrink-0">&bull;</span>
                <strong>Coach Tier:</strong> Check-in completion status, risk color indicators (without underlying detail), and team-level aggregate data are visible to assigned coaches.
              </li>
            </ul>
            <p className="text-slate-600 leading-relaxed mb-4">
              Athletes own their private-tier data. Athlete Anchor processes institutional and support-tier data on behalf of the subscribing institution in accordance with our Privacy Policy and applicable data processing agreements.
            </p>

            {/* 6. Not a Substitute for Professional Care */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              6. Not a Substitute for Professional Care
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 my-6">
              <p className="text-red-800 font-bold text-sm mb-3 uppercase tracking-wide">Critical Disclaimer</p>
              <p className="text-red-700 text-sm leading-relaxed mb-3">
                The Check-In Platform is a screening and monitoring tool only. It does not provide medical advice, mental health diagnoses, therapeutic interventions, or crisis counseling. Nothing on the Platform should be construed as professional medical or psychological advice.
              </p>
              <p className="text-red-700 text-sm leading-relaxed mb-3">
                The Platform is designed to assist qualified institutional staff in identifying student-athletes who may benefit from professional support. It does not replace the judgment of licensed mental health professionals, medical providers, or trained crisis counselors.
              </p>
              <p className="text-red-700 text-sm leading-relaxed mb-0 font-semibold">
                If you or someone you know is experiencing a mental health crisis, please contact the 988 Suicide &amp; Crisis Lifeline by calling or texting 988, or call 911 / your local emergency services immediately. Do not rely on the Platform for crisis intervention.
              </p>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              Athlete Anchor does not guarantee that the Platform will detect all at-risk individuals, nor that any risk score or alert generated by the Platform will be accurate in every case. Institutional staff are responsible for exercising professional judgment when interpreting Platform data and determining appropriate courses of action.
            </p>

            {/* 7. Institutional Responsibilities */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              7. Institutional Responsibilities
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Institutions subscribing to the Platform acknowledge and agree to the following responsibilities:
            </p>
            <ul className="text-slate-600 space-y-2 mb-4 list-none pl-0">
              {[
                "Designating qualified, appropriately trained staff to receive and act upon support-tier alerts and risk notifications",
                "Establishing and maintaining internal protocols for following up on athlete alerts in a timely and appropriate manner",
                "Maintaining access to adequate counseling and mental health resources for student-athletes, independent of the Platform",
                "Complying with the Family Educational Rights and Privacy Act (FERPA) and all other applicable federal, state, and local laws governing the handling of student educational records and health information",
                "Ensuring that all institutional users receive appropriate training on the proper use of the Platform and the handling of sensitive athlete data",
                "Promptly deactivating accounts for staff and athletes who are no longer affiliated with the institution or athletic program",
                "Not using Platform data for purposes inconsistent with athlete welfare, including punitive action based solely on check-in responses",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <span className="text-emerald-500 mt-0.5 shrink-0">&bull;</span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-slate-600 leading-relaxed mb-4">
              As educational institutions subject to FERPA, subscribing institutions are responsible for ensuring that their use of the Platform complies with all applicable requirements regarding student educational records. Athlete Anchor acts as a school official with a legitimate educational interest under FERPA where applicable.
            </p>

            {/* 8. Intellectual Property */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              8. Intellectual Property
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              The Platform, including its design, code, algorithms, risk-scoring models, user interface, documentation, and all associated trademarks and branding, is the exclusive property of Athlete Anchor, Inc. and is protected by applicable intellectual property laws. You may not copy, modify, distribute, reverse engineer, or create derivative works based on the Platform without our prior written consent.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              User-generated content, including journal entries, check-in responses, and personal notes, remains the property of the user who created it. By using the Platform, you grant Athlete Anchor a limited, non-exclusive license to process your content solely for the purpose of providing and improving the Platform services, in accordance with our Privacy Policy and applicable privacy tier restrictions.
            </p>

            {/* 9. Limitation of Liability */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              9. Limitation of Liability
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ATHLETE ANCHOR, ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE PLATFORM.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              The Platform is a tool that assists institutional staff in identifying athletes who may benefit from professional support. It does not replace professional mental health services, clinical judgment, or crisis intervention. Athlete Anchor shall not be liable for any harm resulting from an institution&apos;s failure to follow up on alerts, misinterpretation of Platform data, or failure to maintain adequate professional support resources.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              In no event shall Athlete Anchor&apos;s total aggregate liability to you or your institution exceed the total fees paid by the institution to Athlete Anchor in the twelve (12) months preceding the event giving rise to the claim.
            </p>

            {/* 10. Indemnification */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              10. Indemnification
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Subscribing institutions agree to indemnify, defend, and hold harmless Athlete Anchor, its officers, directors, employees, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys&apos; fees) arising out of or related to:
            </p>
            <ul className="text-slate-600 space-y-2 mb-4 list-none pl-0">
              {[
                "The institution's misuse of the Platform or violation of these Terms",
                "Failure by the institution or its staff to follow up on alerts or risk notifications in an appropriate and timely manner",
                "The institution's failure to comply with FERPA, state privacy laws, or other applicable regulations",
                "Any unauthorized use of athlete data obtained through the Platform",
                "Claims arising from the institution's failure to maintain adequate counseling or mental health resources",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <span className="text-emerald-500 mt-0.5 shrink-0">&bull;</span>
                  {item}
                </li>
              ))}
            </ul>

            {/* 11. Termination */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              11. Termination
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Either party may terminate the use of the Platform at any time. Institutions may terminate their subscription by providing written notice to Athlete Anchor. Athlete Anchor may suspend or terminate access to the Platform immediately if a user or institution violates these Terms or engages in conduct that may harm athletes, other users, or the integrity of the Platform.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              Upon termination:
            </p>
            <ul className="text-slate-600 space-y-2 mb-4 list-none pl-0">
              {[
                "Athlete private-tier data (journals, personal notes) will be made available for export by the athlete for a period of thirty (30) days following termination, after which it will be permanently deleted",
                "Institutional and support-tier data will be retained for a period consistent with applicable record retention requirements and then securely deleted",
                "Aggregate, de-identified data may be retained by Athlete Anchor for research and product improvement purposes",
                "All user accounts associated with the institution will be deactivated",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <span className="text-emerald-500 mt-0.5 shrink-0">&bull;</span>
                  {item}
                </li>
              ))}
            </ul>

            {/* 12. Governing Law */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              12. Governing Law
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions. Any disputes arising under or in connection with these Terms shall be resolved exclusively in the state or federal courts located in Wilmington, Delaware, and you consent to the personal jurisdiction of such courts.
            </p>

            {/* 13. Contact */}
            <h2 className="text-xl font-bold text-slate-900 mt-10 mb-4 border-b border-slate-200 pb-3">
              13. Contact
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-slate-50 rounded-lg p-5 border border-slate-200/60 mb-4">
              <p className="text-slate-700 text-sm font-semibold mb-1">Athlete Anchor, Inc.</p>
              <p className="text-slate-600 text-sm mb-1">Legal Department</p>
              <p className="text-slate-600 text-sm mb-0">
                Email:{" "}
                <a href="mailto:legal@athleteanchor.com" className="text-emerald-600 hover:text-emerald-700 underline">
                  legal@athleteanchor.com
                </a>
              </p>
            </div>

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
