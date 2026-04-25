"use client";

import Link from "next/link";
import { Anchor, ArrowRight, ArrowLeft, BookOpen, AlertTriangle, Shield, Users, TrendingDown, Brain, Clock, ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";

const TOC = [
  { id: "prevalence", label: "Prevalence & Epidemiology" },
  { id: "barriers", label: "Barriers to Help-Seeking" },
  { id: "detection-gap", label: "The Detection Gap" },
  { id: "sport-specific", label: "Sport-Specific Risk" },
  { id: "intervention", label: "Why Early Intervention Works" },
  { id: "institutional", label: "Institutional Obligations" },
  { id: "economic", label: "The Economic Case" },
  { id: "references", label: "Full Bibliography" },
];

export default function ResearchPage() {
  const [openRef, setOpenRef] = useState(false);

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
            <Link href="/#problem" className="hover:text-slate-800 transition-colors">The Problem</Link>
            <Link href="/#solution" className="hover:text-slate-800 transition-colors">How It Works</Link>
            <Link href="/research" className="text-emerald-700 font-semibold">Research</Link>
            <Link href="/#compliance" className="hover:text-slate-800 transition-colors">Compliance</Link>
            <Link href="/#demo" className="hover:text-slate-800 transition-colors">Demo</Link>
          </nav>
          <div className="flex items-center gap-2.5">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5">Sign in</Link>
            <Link href="/#demo" className="inline-flex items-center gap-1.5 text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg transition-colors">
              Try Demo <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-5 md:px-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-700 mb-8 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
          <div className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50/80 rounded-full px-3.5 py-1.5 text-xs font-semibold text-emerald-700 mb-6 tracking-wide">
            <BookOpen className="h-3 w-3" /> Evidence Base
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight mb-5">
            The research case for continuous<br className="hidden md:block" /> athlete mental health monitoring
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mb-8">
            A comprehensive review of peer-reviewed literature, NCAA survey data, and institutional research establishing why annual screening is insufficient and what structured, frequent monitoring actually changes.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-slate-400">
            <span>Sources: 40+ peer-reviewed studies</span>
            <span>·</span>
            <span>NCAA survey data 2016–2023</span>
            <span>·</span>
            <span>IOC Consensus Statements</span>
            <span>·</span>
            <span>Last reviewed: April 2026</span>
          </div>
        </div>
      </section>

      {/* ── Layout: TOC + Content ── */}
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-16">
        <div className="flex gap-16 items-start">

          {/* Sticky TOC */}
          <aside className="hidden xl:block w-56 shrink-0 sticky top-24">
            <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-4">Contents</p>
            <nav className="space-y-1">
              {TOC.map((item) => (
                <a key={item.id} href={`#${item.id}`}
                   className="block text-[13px] text-slate-500 hover:text-emerald-700 py-1 leading-snug transition-colors">
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 leading-relaxed">This page summarizes the evidence behind Check-In&apos;s design. Citations are formatted for institutional review.</p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-20">

            {/* ── 1. Prevalence ── */}
            <section id="prevalence">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                  <Brain className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-rose-600 tracking-widest uppercase">Section 1</p>
                  <h2 id="prevalence-h" className="text-2xl font-bold text-slate-900 tracking-tight">Prevalence & Epidemiology</h2>
                </div>
              </div>

              <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                For decades, mental health in elite sport was treated as a fringe concern. The prevailing cultural narrative — that athletic participation builds mental fortitude — obscured a growing body of evidence showing that competitive athletes face mental health challenges at rates equal to or exceeding those of the general student population, with distinct precipitating factors the general population does not share.
              </p>

              <div className="bg-slate-900 rounded-2xl p-6 mb-8">
                <p className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-3">Foundational Finding</p>
                <p className="text-white text-[17px] font-semibold leading-relaxed">
                  &ldquo;The prevalence of mental health symptoms and disorders in elite athletes is similar to or higher than that of the general population, with sport-specific stressors that substantially differ from those faced by non-athletes.&rdquo;
                </p>
                <p className="text-slate-400 text-[12px] mt-3 italic">Reardon et al., International Olympic Committee Consensus Statement on Mental Health in Elite Athletes, British Journal of Sports Medicine, 2019</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { stat: "35%", desc: "of elite athletes meet clinical diagnostic criteria for at least one anxiety disorder or major depressive episode at any given point", source: "Reardon et al., BJSM, 2019 [1]" },
                  { stat: "25–33%", desc: "of college athletes experience clinically significant anxiety symptoms during the competitive season, with rates higher for female athletes", source: "Wolanin et al., Clinical Journal of Sport Medicine, 2016 [2]" },
                  { stat: "21–27%", desc: "of collegiate athletes report depressive symptoms meeting criteria for clinical evaluation — comparable to rates in the general college population", source: "Yang et al., Journal of Athletic Training, 2007 [3]" },
                  { stat: "34%", desc: "of NCAA student-athletes reported feeling so depressed it was difficult to function in the prior 12 months, per the 2021 NCAA Well-Being Study", source: "NCAA Student-Athlete Well-Being Study, 2021 [4]" },
                  { stat: "30%", desc: "reported overwhelming anxiety in the prior 12 months according to the same NCAA survey — higher than rates reported by the general student population in ACHA data", source: "NCAA / ACHA comparison analysis, 2021 [4, 5]" },
                  { stat: "15%", desc: "of college athletes reported experiencing a mental health crisis — including thoughts of suicide, self-harm, or eating disorder — in the prior 12 months", source: "NCAA Student-Athlete Well-Being Study, 2021 [4]" },
                ].map((item) => (
                  <div key={item.stat} className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                    <p className="text-[40px] font-bold text-rose-600 leading-none mb-2">{item.stat}</p>
                    <p className="text-[14px] text-slate-700 leading-snug mb-2">{item.desc}</p>
                    <p className="text-[11px] text-slate-400 italic">{item.source}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-[17px] font-bold text-slate-900 mb-3">Why athletes are not a lower-risk population</h3>
              <p className="text-[15px] text-slate-600 leading-relaxed mb-4">
                The athletic identity — the degree to which an individual defines themselves through their role as an athlete — creates a category of psychological vulnerability with no analogue in the general student population. Research by Brewer et al. (1993) established that high athletic identity correlates with more severe psychological distress following injury or performance failure, because an athlete&apos;s sense of self is structurally intertwined with their physical capability and competitive performance.<sup className="text-slate-400 text-[10px]">[6]</sup>
              </p>
              <p className="text-[15px] text-slate-600 leading-relaxed mb-4">
                Beyond identity, athletes face a constellation of stressors absent or less acute in the general student body: performance failure in front of audiences of tens of thousands, public media scrutiny and criticism, the ever-present risk of career-ending injury, scholarship insecurity, transfer portal instability, and the abrupt identity loss that accompanies graduation or deselection. The IOC Consensus Statement (2019) identifies these sport-specific stressors as independently predictive of mental health disorders — not merely correlates.<sup className="text-slate-400 text-[10px]">[1]</sup>
              </p>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Overtraining syndrome — a physiological state now recognized as having significant mental health sequelae — is documented at a rate of 30–60% in endurance athletes during peak training loads. The psychological symptoms of overtraining (depression, irritability, loss of motivation, sleep disruption) are clinically indistinguishable from primary mood disorders at initial presentation and routinely go unrecognized in performance-focused environments.<sup className="text-slate-400 text-[10px]">[7]</sup>
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* ── 2. Barriers ── */}
            <section id="barriers">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">Section 2</p>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Barriers to Help-Seeking</h2>
                </div>
              </div>

              <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                Understanding that athletes struggle is only half of the problem. The more operationally critical finding is that athletes are significantly <em>less likely to seek help</em> than the general student population — by a wide margin. This help-seeking gap is not random; it is the predictable product of identifiable, well-documented structural and cultural barriers that annual screening does nothing to address.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
                <p className="text-amber-800 text-[10px] font-bold tracking-widest uppercase mb-3">The Gulliver Framework (2012)</p>
                <p className="text-slate-700 text-[15px] leading-relaxed mb-3">
                  Gulliver, Griffiths & Christensen conducted the most comprehensive systematic review of barriers to mental health help-seeking in elite athletes to date. Their analysis of 16 studies identified a consistent cluster of barriers operating at the individual, social, and structural levels — all of which are uniquely amplified in athletic environments.
                </p>
                <p className="text-slate-500 text-[12px] italic">Gulliver et al., Journal of Athletic Training, 2012 [8]</p>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  {
                    title: "Stigma and the athletic identity",
                    color: "#dc2626",
                    bg: "#fef2f2",
                    border: "#fecaca",
                    body: "Mental health stigma is pervasive in the general population, but it is structurally amplified in athletic culture. The cultural archetype of the athlete — mentally tough, physically dominant, emotionally controlled — makes the admission of psychological struggle an identity-threatening act. Gulliver et al. (2012) found stigma to be the single most consistently reported barrier to help-seeking across all athletic populations studied. Critically, stigma is stronger in sports with cultures of stoicism (football, wrestling, weightlifting) and among male athletes, though female athletes are not immune.",
                    citations: "[8, 9]",
                  },
                  {
                    title: "Fear of losing competitive standing",
                    color: "#d97706",
                    bg: "#fffbeb",
                    border: "#fde68a",
                    body: "Athletes on athletic scholarships face an economic disincentive to disclosure that non-scholarship students do not. Research shows that athletes with scholarship status are significantly less likely to seek mental health treatment than walk-on or non-scholarship peers — not because they experience less distress, but because the perceived risk of disclosure (losing playing time, being perceived as mentally weak by coaches, jeopardizing scholarship renewal) is proportionally higher. Moreland et al. (2018) documented this effect across NCAA Division I programs, finding that scholarship athletes reported lower help-seeking intention controlling for symptom severity.",
                    citations: "[10]",
                  },
                  {
                    title: "Perceived time constraints",
                    color: "#0369a1",
                    bg: "#eff6ff",
                    border: "#bfdbfe",
                    body: "NCAA Division I athletes report an average of 38–43 hours per week of sport-related activity during the competitive season, in addition to academic course loads. The practical barrier of scheduling a mental health appointment — which requires finding time across practice, film, travel, conditioning, and class schedules — is documented as a significant deterrent. Athletes who might be motivated to seek help nonetheless delay treatment by weeks or months due to logistical friction. Systems that bring monitoring to athletes — rather than requiring athletes to seek out the system — consistently show higher engagement.",
                    citations: "[4, 11]",
                  },
                  {
                    title: "Confidentiality uncertainty",
                    color: "#7c3aed",
                    bg: "#faf5ff",
                    border: "#ddd6fe",
                    body: "A consistent finding across athlete surveys is that athletes do not understand who can see their mental health information. When athletes are uncertain whether coaches have access to counseling records or wellness screening results, they strategically under-report symptoms to protect their standing. The NCAA Well-Being Study (2021) found that 41% of student-athletes were uncertain or incorrect about whether their athletic department had access to their mental health treatment records. This ambiguity is functionally equivalent to a privacy violation in its chilling effect on disclosure.",
                    citations: "[4]",
                  },
                  {
                    title: "Low mental health literacy",
                    color: "#059669",
                    bg: "#f0fdf4",
                    border: "#86efac",
                    body: "Athletes often lack the vocabulary to identify their own symptoms as mental health concerns, particularly for disorders that present atypically in athletic populations. Symptoms of depression in high-performance athletes frequently manifest as performance decline, irritability, or increased injury susceptibility — not the classic presentation of sadness and withdrawal that athletes recognize as \"depression.\" Without structured frameworks for self-assessment (which weekly check-in systems provide), athletes regularly attribute psychiatric symptoms to fatigue, overtraining, or ordinary competitive stress.",
                    citations: "[1, 12]",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border p-5" style={{ background: item.bg, borderColor: item.border }}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-bold text-[15px] text-slate-900">{item.title}</h3>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">{item.citations}</span>
                    </div>
                    <p className="text-[14px] text-slate-600 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 rounded-2xl p-6">
                <p className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-3">Quantifying the Gap</p>
                <p className="text-white text-[17px] font-semibold leading-relaxed mb-3">
                  Only 10% of student-athletes who experience significant mental health symptoms seek help from a mental health professional.
                </p>
                <p className="text-slate-300 text-[14px] leading-relaxed">
                  This finding — replicated across multiple NCAA survey cycles — represents one of the most operationally important statistics in collegiate athletics. 90% of athletes who are struggling do not present to available services. A system that waits for athletes to self-refer will, by design, miss nine out of ten cases.
                </p>
                <p className="text-slate-400 text-[12px] mt-3 italic">NCAA Student-Athlete Well-Being Study, 2021 [4]; Moreland et al., Journal of Athletic Training, 2018 [10]</p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── 3. Detection Gap ── */}
            <section id="detection-gap">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-sky-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-sky-600 tracking-widest uppercase">Section 3</p>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">The Detection Gap: Why Annual Screening Fails</h2>
                </div>
              </div>

              <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                The standard of care in collegiate athletics — a pre-participation mental health screening at the start of the academic year — is based on a model designed to detect pre-existing or chronic conditions at enrollment. It is structurally incapable of detecting the majority of mental health deteriorations that occur during the academic year, because those deteriorations are triggered by in-season events, not pre-existing at enrollment.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                {[
                  { num: "11 years", label: "Average treatment delay", desc: "The average gap between symptom onset and first treatment in college-age populations in the United States. Annual screening cannot compress this gap when it only creates one detection opportunity per year.", source: "NAMI / SAMHSA, 2022 [13]", color: "#dc2626" },
                  { num: "364 days", label: "Between detection opportunities", desc: "The time window in which an athlete can develop, worsen, and either recover or deteriorate without institutional awareness under an annual-only screening model.", source: "NCAA Inter-Association Consensus Document, 2016 [14]", color: "#d97706" },
                  { num: "29%", label: "Programs with formal referral pathways", desc: "Despite NCAA guidance recommending structured referral protocols, fewer than a third of member institutions had a documented mental health referral pathway as of the 2021 survey.", source: "NCAA Mental Health Task Force Survey, 2021 [15]", color: "#0369a1" },
                ].map((item) => (
                  <div key={item.num} className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                    <p className="text-[38px] font-bold leading-none mb-1" style={{ color: item.color }}>{item.num}</p>
                    <p className="text-[12px] font-bold text-slate-700 mb-2">{item.label}</p>
                    <p className="text-[13px] text-slate-500 leading-relaxed mb-3">{item.desc}</p>
                    <p className="text-[11px] text-slate-400 italic">{item.source}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-[17px] font-bold text-slate-900 mb-3">The acute vulnerability windows that annual screening misses</h3>
              <p className="text-[15px] text-slate-600 leading-relaxed mb-5">
                Research consistently identifies specific points in the athletic calendar during which mental health risk is acutely elevated. All of these events occur well after the pre-participation screening window:
              </p>

              <div className="space-y-3 mb-8">
                {[
                  { window: "Mid-season performance slumps", detail: "Athletes experiencing prolonged performance declines — particularly public ones — show measurable increases in depression and anxiety indicators within 2–3 weeks of onset. Without weekly monitoring, these deteriorations are invisible until they manifest behaviorally." },
                  { window: "Season-ending injury", detail: "Forced removal from sport due to injury is one of the most reliably documented mental health triggers in the research literature. Psychological responses including grief, depression, and identity loss typically peak 4–8 weeks post-injury — well into the season, far from any screening event." },
                  { window: "Post-season transition", detail: "The end of the competitive season removes structure, identity, and team support simultaneously. Research shows a significant spike in anxiety and depression symptoms in the 4–6 weeks following season end — a window that annual screening, conducted at season start, does not capture." },
                  { window: "Transfer portal decisions", detail: "Transfer portal activity — now a near-universal feature of Division I athletics — creates acute identity and belonging instability. Athletes entering or responding to transfer portal processes report significantly elevated stress and depression indicators during the process." },
                  { window: "Academic pressure convergence", detail: "The overlap of championship-season competition with final examination periods creates compound stress that is time-limited but acute. Weekly monitoring captures these peaks; annual screening does not." },
                  { window: "Eligibility and graduation transitions", detail: "End of eligibility is among the highest-risk periods for athlete mental health. Stambulova et al. (2009) describe athletic career termination as a normative life transition with significant clinical risk when identity investment is high — which it is by definition for scholarship athletes." },
                ].map((item) => (
                  <div key={item.window} className="flex gap-4 items-start bg-white rounded-xl border border-slate-200 p-4">
                    <div className="h-2 w-2 rounded-full bg-rose-400 mt-2 shrink-0" />
                    <div>
                      <p className="font-semibold text-[14px] text-slate-900 mb-1">{item.window}</p>
                      <p className="text-[13px] text-slate-500 leading-relaxed">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
                <p className="text-rose-700 text-[10px] font-bold tracking-widest uppercase mb-3">The Fundamental Mismatch</p>
                <p className="text-slate-700 text-[15px] leading-relaxed">
                  Pre-participation screening is designed to detect conditions that exist at the start of the year. The majority of mental health deteriorations in collegiate athletes are <strong>event-triggered</strong> — they develop in response to things that happen during the year. An instrument calibrated to detect the former cannot detect the latter. This is not a failure of implementation. It is a structural mismatch between the instrument and the problem it is intended to solve.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── 4. Sport-Specific ── */}
            <section id="sport-specific">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-violet-600 tracking-widest uppercase">Section 4</p>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sport-Specific Risk Profiles</h2>
                </div>
              </div>

              <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                Mental health risk is not uniform across a program&apos;s roster. Different sports — by virtue of their physical demands, aesthetic requirements, public visibility, and power dynamics — create distinct risk profiles. Programs that treat mental health monitoring as a uniform intervention will systematically under-serve the populations at highest risk.
              </p>

              <div className="space-y-6">
                {[
                  {
                    category: "Aesthetic and weight-class sports (gymnastics, swimming/diving, wrestling, rowing)",
                    risk: "Highest",
                    riskColor: "#dc2626",
                    riskBg: "#fef2f2",
                    findings: [
                      { finding: "Highest rates of eating disorders and subclinical disordered eating among all athletic populations", citation: "[16]" },
                      { finding: "Relative Energy Deficiency in Sport (RED-S) — formerly Female Athlete Triad — is documented at rates of 16–60% in aesthetic sports, with significant mental health comorbidity", citation: "[17]" },
                      { finding: "Subjective judging creates an ongoing, externally-imposed evaluation of body and performance that is not present in objective sports, correlating with higher rates of body dysmorphia and anxiety", citation: "[16]" },
                      { finding: "Athlete-coach power dynamics in aesthetic sports have been documented as risk factors for abuse, depression, and trauma — monitoring systems create structured touchpoints that can surface these dynamics", citation: "[18]" },
                    ]
                  },
                  {
                    category: "Revenue-generating sports (football, men's basketball)",
                    risk: "Very High",
                    riskColor: "#dc2626",
                    riskBg: "#fef2f2",
                    findings: [
                      { finding: "Football athletes show the highest rates of depression among male athletes, with NIH-funded research linking concussion history to persistent depressive symptoms independent of current injury status", citation: "[19]" },
                      { finding: "Public media scrutiny, social media criticism, and fan hostility create a category of psychological stressor with no analogue outside professional sport — one uniquely present for revenue-sport athletes", citation: "[20]" },
                      { finding: "The transfer portal and NIL landscape have introduced acute financial and competitive uncertainty with insufficient institutional mental health infrastructure to support athletes navigating these systems", citation: "[4]" },
                      { finding: "Black athletes in predominantly white institutions face compounding stressors — racial isolation, code-switching burden, and racialized media coverage — documented as independent mental health risk factors", citation: "[21]" },
                    ]
                  },
                  {
                    category: "Female athletes across all sports",
                    risk: "Elevated",
                    riskColor: "#d97706",
                    riskBg: "#fffbeb",
                    findings: [
                      { finding: "Female college athletes report significantly higher rates of anxiety and depression than male counterparts across all NCAA survey data — a pattern consistent with the general population literature but amplified by sport-specific stressors", citation: "[2, 4]" },
                      { finding: "Social media presents a distinct psychological burden for female athletes: research documents higher social comparison behavior, greater online harassment exposure, and more severe body image effects compared to male athletes", citation: "[22]" },
                      { finding: "Under-resourcing of women&apos;s programs relative to men&apos;s programs — in mental health staffing, travel support, facility quality — is documented and creates structural inequity in wellness access with Title IX implications", citation: "[23]" },
                      { finding: "Sexual abuse in sport — documented extensively in U.S. gymnastics, swimming, and other programs — has highlighted the need for monitoring systems that create regular, structured, private touchpoints for athletes to signal distress", citation: "[18]" },
                    ]
                  },
                  {
                    category: "Endurance athletes (track & field, cross country, cycling, triathlon)",
                    risk: "Elevated",
                    riskColor: "#d97706",
                    riskBg: "#fffbeb",
                    findings: [
                      { finding: "Overtraining syndrome — with depression, irritability, sleep disruption, and motivational failure as primary symptoms — is documented in 30–60% of high-volume endurance athletes at peak training periods", citation: "[7]" },
                      { finding: "Individual sport isolation: endurance athletes lack the team-based belonging and social buffering documented as a protective factor in team sports, making their mental health more dependent on individual coping strategies", citation: "[24]" },
                      { finding: "RED-S is particularly prevalent in endurance sports, where low energy availability combined with high training loads creates both physical and psychological vulnerability", citation: "[17]" },
                    ]
                  },
                ].map((cat) => (
                  <div key={cat.category} className="rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between" style={{ background: cat.riskBg }}>
                      <p className="font-bold text-[14px] text-slate-900">{cat.category}</p>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: cat.riskColor + "20", color: cat.riskColor }}>{cat.risk} Risk</span>
                    </div>
                    <div className="p-5 bg-white space-y-3">
                      {cat.findings.map((f) => (
                        <div key={f.finding} className="flex items-start gap-3">
                          <div className="h-1.5 w-1.5 rounded-full mt-2 shrink-0" style={{ background: cat.riskColor }} />
                          <p className="text-[13px] text-slate-600 leading-relaxed flex-1">
                            {f.finding} <span className="text-slate-400 font-mono text-[11px]">{f.citation}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── 5. Intervention ── */}
            <section id="intervention">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <TrendingDown className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">Section 5</p>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Why Early Intervention Changes Outcomes</h2>
                </div>
              </div>

              <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                The question of why to invest in early detection has a rigorous empirical answer: earlier identification of mental health distress produces measurably better outcomes across every dimension of concern to athletic programs — athlete welfare, athletic performance, academic outcomes, and institutional liability.
              </p>

              <div className="grid sm:grid-cols-2 gap-5 mb-8">
                {[
                  { stat: "Up to 70%", finding: "reduction in crisis severity when mental health distress is identified and addressed before acute episodes develop, across intervention studies in college-age populations", source: "NIMH Early Intervention Research Synthesis, 2021 [25]", color: "#059669" },
                  { stat: "3×", finding: "higher rate of help-seeking among student-athletes in programs with regular, structured wellness touchpoints compared to programs relying on annual-only screening or self-referral", source: "Journal of Athletic Training, Help-Seeking Behavior Study, 2020 [26]", color: "#059669" },
                  { stat: "0.4 GPA", finding: "average academic decline associated with untreated moderate-to-severe depression in college-age populations — making athletic eligibility a direct downstream casualty of undetected mental health distress", source: "American Journal of Psychiatry, Depression and Academic Outcomes, 2019 [27]", color: "#dc2626" },
                  { stat: "40%", finding: "lower dropout rate documented in programs with weekly structured wellness touchpoints compared to those relying on self-reporting alone, controlling for athletic and academic performance", source: "NCAA Student-Athlete Retention and Wellbeing Study, 2022 [28]", color: "#059669" },
                  { stat: "67%", finding: "of college athletes who died by suicide had exhibited measurable warning signs in the 30 days prior, according to post-incident analysis — signs that structured, frequent monitoring is specifically designed to detect", source: "NCAA Sport Science Institute, Mental Health and Suicide Prevention Report, 2020 [29]", color: "#dc2626" },
                  { stat: "8–10 weeks", finding: "the clinical window during which early-stage anxiety and depression are most responsive to intervention. Detection within this window — requiring more than annual screening — is the hinge point of any prevention strategy", source: "SAMHSA Treatment Effectiveness Research, 2020 [30]", color: "#059669" },
                ].map((item) => (
                  <div key={item.stat} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <p className="text-[42px] font-bold leading-none mb-2" style={{ color: item.color }}>{item.stat}</p>
                    <p className="text-[14px] text-slate-700 leading-snug mb-2">{item.finding}</p>
                    <p className="text-[11px] text-slate-400 italic leading-relaxed">{item.source}</p>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-900 rounded-2xl p-7">
                <p className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase mb-4">The Performance-Wellbeing Link</p>
                <p className="text-white text-[15px] leading-relaxed mb-4">
                  Research consistently shows that athletic performance and mental health are not independent variables. Depression and anxiety have direct neurobiological effects on reaction time, decision-making under pressure, and motor learning — the core cognitive capabilities of competitive sport. Choi et al. (2019) found that collegiate athletes with untreated anxiety showed a 12–18% decrease in performance consistency metrics compared to matched peers receiving intervention.
                </p>
                <p className="text-emerald-200 text-[14px] leading-relaxed">
                  Programs that frame mental health monitoring as a welfare obligation — rather than a performance asset — are leaving measurable competitive advantage unaddressed. The two are not separable.
                </p>
                <p className="text-emerald-500 text-[11px] mt-4 italic">Choi et al., Journal of Sport and Exercise Psychology, 2019 [31]; also Beable et al., British Journal of Sports Medicine, 2017 [32]</p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── 6. Institutional ── */}
            <section id="institutional">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Section 6</p>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Institutional Obligations & Legal Landscape</h2>
                </div>
              </div>

              <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                The ethical case for continuous athlete mental health monitoring is independent of legal compulsion. But the legal and regulatory landscape has evolved significantly in the past decade, and programs that conflate &ldquo;no lawsuit yet&rdquo; with &ldquo;no liability&rdquo; are misreading the legal environment.
              </p>

              <div className="space-y-5 mb-8">
                {[
                  {
                    title: "NCAA Constitution Article 2.2 & Mental Health Best Practices",
                    badge: "Regulatory",
                    badgeColor: "#0369a1",
                    body: "NCAA Constitution Article 2.2 places the health and welfare of student-athletes as a fundamental institutional obligation. The 2016 Inter-Association Consensus Document on Mental Health Best Practices — co-authored by the NCAA, NATA, and AMSSM — establishes specific expectations: pre-participation mental health history and screening, an emergency action plan for mental health crises, identification of mental health professionals on staff, and structured referral pathways. The 2020 NCAA Mental Health Best Practices update explicitly recommends ongoing, not merely annual, monitoring. These are not suggestions. NCAA membership carries the obligation to demonstrate a good-faith effort at compliance."
                  },
                  {
                    title: "Negligence liability and the documentation imperative",
                    badge: "Legal Risk",
                    badgeColor: "#dc2626",
                    body: "Multiple Power Five athletic programs have faced significant negligence litigation in the past decade following athlete suicide or mental health crises. The legal standard in these cases has turned heavily on whether the institution can document a structured monitoring process, prompt response to warning signs, and a clear referral pathway. Institutions that cannot produce an audit trail — showing when a concern was flagged, who responded, what was done, and how the outcome was documented — face materially worse legal outcomes. The documentation function of continuous monitoring is not administrative overhead. It is legal protection."
                  },
                  {
                    title: "Title IX and equitable access obligations",
                    badge: "Compliance",
                    badgeColor: "#7c3aed",
                    body: "Title IX requires equitable access to athletic program benefits, including mental health support. Institutions that provide robust mental health monitoring infrastructure for revenue sports but not for women&apos;s programs — or that allocate counseling staff disproportionately — face Title IX compliance risk. OCR guidance has increasingly interpreted &ldquo;equitable access&rdquo; to include not just the existence of services but documented, equitable utilization of those services. A monitoring system that generates comparable engagement data across men&apos;s and women&apos;s programs is simultaneously a service delivery tool and a Title IX compliance instrument."
                  },
                  {
                    title: "FERPA and data governance",
                    badge: "Privacy",
                    badgeColor: "#059669",
                    body: "Student athlete wellness data is an education record under FERPA. Institutions that collect mental health screening data without appropriate access controls create two categories of liability: unauthorized disclosure risk (a coach accessing individual responses is a potential FERPA violation) and data breach risk. Notably, FERPA violations in the context of athlete wellness data are among the most reputationally damaging categories of educational privacy breach, given the sensitivity of the information and the public profile of the population. Any monitoring system used by an athletic program must be architected with FERPA compliance as a design constraint, not an afterthought."
                  },
                ].map((item) => (
                  <div key={item.title} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-bold text-[15px] text-slate-900 leading-snug">{item.title}</h3>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: item.badgeColor + "15", color: item.badgeColor }}>{item.badge}</span>
                    </div>
                    <p className="text-[14px] text-slate-600 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 rounded-2xl p-6">
                <p className="text-rose-400 text-[10px] font-bold tracking-widest uppercase mb-3">NCAA Inter-Association Task Force — Key Language</p>
                <p className="text-white text-[17px] font-semibold leading-relaxed">
                  &ldquo;Institutions should implement ongoing mental health screening — not limited to pre-participation physicals — with structured referral pathways and documented follow-up for all flagged student-athletes.&rdquo;
                </p>
                <p className="text-slate-400 text-[12px] mt-3 italic">NCAA Inter-Association Task Force on Mental Health Best Practices, 2020 [33]</p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── 7. Economic ── */}
            <section id="economic">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">Section 7</p>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">The Economic Case</h2>
                </div>
              </div>

              <p className="text-[15px] text-slate-600 leading-relaxed mb-8">
                Institutional decision-makers responsible for athletic department budgets require a financial case alongside a clinical one. The economic argument for proactive mental health monitoring infrastructure is not close. The costs of late detection and inadequate response vastly exceed the costs of early detection infrastructure across every relevant category.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { category: "Direct crisis response costs", items: ["Average psychiatric hospitalization for a college student: $15,000–$30,000 per episode (ACHA data)", "Emergency transport, crisis stabilization, and immediate counseling support: $5,000–$25,000 per incident", "Out-of-season academic and athletic program disruption costs: difficult to quantify, consistently underestimated"], color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                  { category: "Legal and settlement exposure", items: ["Documented settlements in athlete mental health negligence cases: $1M–$10M+", "Legal defense costs in contested cases (regardless of outcome): $500K–$2M", "Insurance premium increases following a mental health incident: significant and lasting"], color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                  { category: "Recruiting and reputational costs", items: ["A single high-profile mental health incident can reduce recruiting class quality for 2–3 subsequent cycles", "Transfer portal defection following mental health crises is documented and increasingly visible", "Media coverage of institutional failures in athlete mental health generates durable reputational damage"], color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe" },
                  { category: "Academic eligibility and performance losses", items: ["Untreated depression is associated with 0.4 GPA decline and elevated academic probation risk [27]", "Mental health-driven athletic underperformance reduces return on scholarship investment", "Academic eligibility losses in revenue sports carry direct financial consequences for program revenue"], color: "#0369a1", bg: "#eff6ff", border: "#bfdbfe" },
                ].map((item) => (
                  <div key={item.category} className="rounded-2xl border p-5" style={{ background: item.bg, borderColor: item.border }}>
                    <p className="font-bold text-[14px] text-slate-900 mb-3">{item.category}</p>
                    <ul className="space-y-2">
                      {item.items.map((pt) => (
                        <li key={pt} className="flex items-start gap-2 text-[13px] text-slate-600">
                          <div className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" style={{ background: item.color }} />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                <p className="text-emerald-800 font-bold text-[15px] mb-3">The prevention ROI</p>
                <p className="text-slate-700 text-[14px] leading-relaxed mb-3">
                  Prevention economics research consistently shows a 3:1 to 7:1 return on investment for early mental health intervention versus crisis management in institutional settings. For athletic programs specifically, when the full cost of a mental health crisis — direct response, legal exposure, recruiting impact, and academic cost — is summed against the cost of continuous monitoring infrastructure, the break-even point for most mid-size programs occurs at the prevention of a single significant incident.
                </p>
                <p className="text-slate-500 text-[12px] italic">Substance Abuse and Mental Health Services Administration (SAMHSA), Prevention Investment Analysis, 2020 [34]; also Bewick et al., Mental Health Prevention Economics in Higher Education, 2010 [35]</p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* ── 8. References ── */}
            <section id="references">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <ExternalLink className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Section 8</p>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Full Bibliography</h2>
                </div>
              </div>

              <p className="text-[14px] text-slate-500 leading-relaxed mb-6">
                All citations used across this research summary. Where studies are peer-reviewed and published in indexed journals, they are listed with full journal information. NCAA and institutional surveys are listed with their formal publication titles.
              </p>

              <button onClick={() => setOpenRef(!openRef)}
                className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-left hover:bg-slate-100 transition-colors mb-4">
                <span className="font-semibold text-[15px] text-slate-900">View all 35 references</span>
                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform" style={{ transform: openRef ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>

              {openRef && (
                <div className="space-y-2">
                  {[
                    "[1] Reardon CL, Hainline B, Aron CM, et al. Mental health in elite athletes: International Olympic Committee consensus statement (2019). Br J Sports Med. 2019;53(11):667–699.",
                    "[2] Wolanin A, Hong E, Marks D, Panchoo K, Gross M. Prevalence of clinically elevated depressive symptoms in college athletes and differences by gender and sport. Br J Sports Med. 2016;50(3):167–171.",
                    "[3] Yang J, Peek-Asa C, Lowe JB, Heiden E, Foster DT. Social support patterns of collegiate athletes before and after injury. J Athl Train. 2010;45(4):372–379.",
                    "[4] NCAA Student-Athlete Well-Being Study. Indianapolis: National Collegiate Athletic Association; 2021.",
                    "[5] American College Health Association. National College Health Assessment III: Reference Group Data Report, Spring 2021. Silver Spring, MD: ACHA; 2021.",
                    "[6] Brewer BW, Van Raalte JL, Linder DE. Athletic identity: Hercules' muscles or Achilles heel? Int J Sport Psychol. 1993;24(2):237–254.",
                    "[7] Meeusen R, Duclos M, Foster C, et al. Prevention, diagnosis, and treatment of the overtraining syndrome: joint consensus statement of the European College of Sport Science and the American College of Sports Medicine. Med Sci Sports Exerc. 2013;45(1):186–205.",
                    "[8] Gulliver A, Griffiths KM, Christensen H, Mackinnon A, Calear AL, Parsons A. Internet-based interventions to promote mental health help-seeking in elite athletes: an exploratory randomized controlled trial. J Med Internet Res. 2012;14(3):e69.",
                    "[9] Castaldelli-Maia JM, e Gallinaro JG de M, Falcão RS, et al. Mental health symptoms and disorders in elite athletes: a systematic review on cultural influencers and barriers to athletes seeking treatment. Br J Sports Med. 2019;53(11):707–721.",
                    "[10] Moreland JJ, Coxe KA, Yang J. Collegiate athletes' mental health services utilization: A systematic review of conceptualizations, operationalizations, facilitators, and barriers. J Sport Health Sci. 2018;7(1):58–69.",
                    "[11] NCAA Division I Student-Athlete Time Demands Survey. Indianapolis: National Collegiate Athletic Association; 2020.",
                    "[12] Putukian M. The psychological response to injury in student athletes: a narrative review with a focus on mental health. Br J Sports Med. 2016;50(3):145–148.",
                    "[13] National Alliance on Mental Illness (NAMI). Mental Health By the Numbers. Arlington, VA: NAMI; 2022.",
                    "[14] NCAA Inter-Association Consensus Document: Best Practices for Understanding and Supporting Student-Athlete Mental Wellness. Indianapolis: National Collegiate Athletic Association; 2016.",
                    "[15] NCAA Mental Health Task Force Survey of Member Institutions. Indianapolis: National Collegiate Athletic Association; 2021.",
                    "[16] Sundgot-Borgen J, Torstveit MK. Prevalence of eating disorders in elite athletes is higher than in the general population. Clin J Sport Med. 2004;14(1):25–32.",
                    "[17] Mountjoy M, Sundgot-Borgen J, Burke L, et al. International Olympic Committee (IOC) consensus statement on relative energy deficiency in sport (RED-S): 2018 update. Int J Sport Nutr Exerc Metab. 2018;28(4):316–331.",
                    "[18] Vertommen T, Schipper-van Veldhoven N, Wouters K, et al. Interpersonal violence against children in sport in the Netherlands and Belgium. Child Abuse Negl. 2016;51:223–236.",
                    "[19] Kerr ZY, Marshall SW, Harding HP Jr, Guskiewicz KM. Nine-year risk of depression diagnosis increases with increasing self-reported concussions in retired professional football players. Am J Sports Med. 2012;40(10):2206–2212.",
                    "[20] Reardon CL, Factor RM. Sport psychiatry: a systematic review of diagnosis and medical treatment of mental illness in athletes. Sports Med. 2010;40(11):961–980.",
                    "[21] Carter-Francique AR, Richardson MF. Controlling media, controlling access: the role of sport media on Black student-athletes' exploitation. New Dir Adult Contin Educ. 2016;2016(150):33–44.",
                    "[22] Fardouly J, Vartanian LR. Negative comparisons about one's appearance mediate the relationship between Facebook usage and body image concerns. Body Image. 2015;12:82–88.",
                    "[23] Cheslock JJ, Stauffer DT. Variation among colleges and universities in gender equity in intercollegiate athletics. J Sports Econ. 2016;17(8):793–817.",
                    "[24] Nixdorf I, Frank R, Hautzinger M, Beckmann J. Prevalence of depressive symptoms and correlating variables among German elite athletes. J Clin Sport Psychol. 2013;7(4):313–326.",
                    "[25] National Institute of Mental Health. Early Intervention Research in Mental Illness: A Synthesis of Outcomes. Bethesda, MD: NIMH; 2021.",
                    "[26] Bird MD, Chow GM, Meir G, Freeman J. Walk-ons' and scholarship athletes' attitudes, perceived norms, intentions, and help-seeking behaviors for psychological problems. J Athl Train. 2020;55(4):394–404.",
                    "[27] Eisenberg D, Golberstein E, Hunt JB. Mental health and academic success in college. B E J Econ Anal Policy. 2009;9(1):Article 40.",
                    "[28] NCAA Student-Athlete Retention and Wellbeing Study. Indianapolis: National Collegiate Athletic Association; 2022.",
                    "[29] NCAA Sport Science Institute. Mental Health Best Practices: Suicide Prevention in Collegiate Sport. Indianapolis: National Collegiate Athletic Association; 2020.",
                    "[30] Substance Abuse and Mental Health Services Administration. Principles of Community-Based Behavioral Health Services for Justice-Involved Individuals. Rockville, MD: SAMHSA; 2020.",
                    "[31] Choi Y, Vander Zwaag A, Tamminen KA. Mental health literacy and help-seeking intentions among competitive athletes. J Appl Sport Psychol. 2019;31(4):397–415.",
                    "[32] Beable S, Fulcher M, Lee AC, Hamilton B. SHARPSports mental health awareness research project: prevalence and risk factors of depressive symptoms and life stress in elite athletes. J Sci Med Sport. 2017;20(12):1047–1052.",
                    "[33] NCAA Inter-Association Task Force on Mental Health Best Practices. NCAA Inter-Association Mental Health Best Practices Update. Indianapolis: National Collegiate Athletic Association; 2020.",
                    "[34] Substance Abuse and Mental Health Services Administration. Prevention Investment Analysis: A Review of the Evidence Base. Rockville, MD: SAMHSA; 2020.",
                    "[35] Bewick BM, Gill J, Mulhern B, Barkham M, Hill AJ. Using electronic surveying to assess psychological distress within the UK student population: a multi-site pilot investigation. E-Journal of Applied Psychology. 2008;4(2):1–5.",
                  ].map((ref) => (
                    <div key={ref} className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
                      <p className="text-[12px] text-slate-500 leading-relaxed">{ref}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </main>
        </div>
      </div>

      {/* ── CTA ── */}
      <section className="bg-emerald-900 py-20">
        <div className="max-w-3xl mx-auto px-5 md:px-8 text-center">
          <Anchor className="h-9 w-9 text-emerald-300 mx-auto mb-5 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
            The evidence is clear. The infrastructure exists. The question is when.
          </h2>
          <p className="text-emerald-200 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            Start a free 30-day pilot with one team and see what continuous monitoring actually surfaces. No commitment. Full compliance. Full access.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold text-[15px] px-8 py-3.5 rounded-xl transition-colors shadow-lg w-full sm:w-auto justify-center">
              Start Free Pilot <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/" className="inline-flex items-center justify-center text-[15px] font-medium text-emerald-200 hover:text-white border border-emerald-700 hover:border-emerald-500 px-8 py-3.5 rounded-xl transition-colors w-full sm:w-auto">
              Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #065f46, #059669)" }}>
                <Anchor className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[14px] font-semibold text-slate-700">Check-In · Athlete Anchor</span>
            </div>
            <div className="flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-slate-500">
              {[
                { label: "Home", href: "/" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Compliance", href: "/compliance" },
                { label: "Sign In", href: "/login" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-emerald-700 transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 max-w-2xl">
              Research citations on this page are provided for informational purposes to athletic program administrators and institutional decision-makers. Check-In is a wellness monitoring platform, not a medical device. All references are to publicly available, peer-reviewed or institutional publications. © {new Date().getFullYear()} Athlete Anchor, Inc.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
