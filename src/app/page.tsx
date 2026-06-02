"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock, ArrowRight, Check, Eye, Users, ClipboardCheck, TrendingUp,
  Heart, Anchor, Shield, BarChart2,
  Zap, Bell, Activity, ChevronDown, User, Stethoscope,
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
            <a href="#barriers" className="hover:text-slate-800 transition-colors">Why It Goes Undetected</a>
            <a href="#sports" className="hover:text-slate-800 transition-colors">By Sport</a>
            <Link href="/research" className="hover:text-slate-800 transition-colors">Full Research</Link>
            <a href="#solution" className="hover:text-slate-800 transition-colors">The Platform</a>
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_60%_-10%,rgba(16,185,129,0.06),transparent)]" />
        <div className="relative max-w-4xl mx-auto px-5 md:px-8">
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-6">NCAA · IOC · NAMI · ACHA Research</p>
          <h1 className="text-5xl md:text-[62px] font-bold text-slate-900 tracking-[-0.03em] leading-[1.05] mb-7">
            35% of college athletes<br className="hidden md:block" /> meet diagnostic criteria<br className="hidden md:block" />
            <span className="text-emerald-700">for anxiety or depression.</span>
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mb-4">
            Only 10% of those athletes ever seek help. The rest manage alone — or don&apos;t manage at all. This page documents what the peer-reviewed literature and NCAA survey data say about how that happens, and what changes when programs intervene early.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-[13px] text-slate-400">
            {["IOC Consensus Statement, 2019","NCAA Well-Being Study, 2021","NAMI, 2022","Journal of Athletic Training"].map((s) => (
              <span key={s} className="italic">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Anchor stats bar ── */}
      <div className="bg-slate-900 py-5 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-slate-700">
          {[
            { stat: "35%", label: "meet criteria for anxiety or depression", src: "IOC, 2019" },
            { stat: "10%", label: "of those ever seek professional help", src: "NCAA, 2021" },
            { stat: "1×/year", label: "formal mental health screening at most programs", src: "NCAA, 2016" },
            { stat: "11 years", label: "average delay between symptom onset and treatment", src: "NAMI, 2022" },
          ].map((item) => (
            <div key={item.stat} className="md:px-8 text-center md:text-left">
              <p className="text-3xl font-bold text-white">{item.stat}</p>
              <p className="text-[12px] text-slate-400 mt-1 leading-snug">{item.label}</p>
              <p className="text-[10px] text-slate-600 mt-1 italic">{item.src}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 1: The Prevalence Problem ── */}
      <section id="problem" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="max-w-3xl mb-14">
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">Part I — Prevalence</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-5">
              Athletes are not a mentally resilient population. The data says otherwise.
            </h2>
            <p className="text-[16px] text-slate-500 leading-relaxed mb-4">
              The dominant cultural narrative in competitive sport — that athletic participation builds mental toughness and confers psychological protection — is not supported by the research literature. The International Olympic Committee&apos;s 2019 Consensus Statement on Mental Health in Elite Athletes, the most comprehensive cross-sport review to date, found that the prevalence of mental health symptoms and diagnosable disorders in elite and collegiate athletes is <em>comparable to or higher than</em> that of the general population.
            </p>
            <p className="text-[16px] text-slate-500 leading-relaxed">
              What distinguishes athletes is not lower prevalence — it is the presence of sport-specific stressors with no analogue in the general student body, combined with structural and cultural barriers that make disclosure significantly less likely.
            </p>
          </div>

          {/* Big stat grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {[
              { stat: "35%", label: "of elite athletes meet diagnostic criteria for anxiety or depression at any given time", source: "Reardon et al., IOC Consensus Statement, BJSM, 2019", color: "#dc2626" },
              { stat: "34%", label: "of NCAA student-athletes reported depression significant enough to affect daily functioning in the prior 12 months", source: "NCAA Student-Athlete Well-Being Study, 2021", color: "#dc2626" },
              { stat: "30%", label: "reported overwhelming anxiety in the prior 12 months — higher than matched general student population rates in ACHA data", source: "NCAA / ACHA Comparison, 2021", color: "#d97706" },
              { stat: "25–33%", label: "experience clinically significant anxiety symptoms during the competitive season, with rates consistently higher for female athletes", source: "Wolanin et al., Clinical Journal of Sport Medicine, 2016", color: "#d97706" },
              { stat: "15%", label: "reported a mental health crisis in the prior 12 months, including suicidal ideation, self-harm, or eating disorder", source: "NCAA Student-Athlete Well-Being Study, 2021", color: "#dc2626" },
              { stat: "21%", label: "of collegiate athletes report depressive symptoms meeting clinical evaluation thresholds — consistent across multiple independent survey cycles", source: "Yang et al., Journal of Athletic Training, 2007", color: "#d97706" },
              { stat: "8%", label: "of male college athletes and 13% of female college athletes reported seriously considering suicide in the prior year", source: "American College Health Association, NCHA III, 2021", color: "#dc2626" },
              { stat: "2nd", label: "leading cause of death among college students is suicide — more common than homicide, second only to accidents", source: "CDC / ACHA data, 2020–2022", color: "#dc2626" },
              { stat: "67%", label: "of college athletes who died by suicide had exhibited measurable warning signs in the 30 days prior, per NCAA post-incident analysis", source: "NCAA Sport Science Institute, Suicide Prevention Report, 2020", color: "#dc2626" },
            ].map((s) => (
              <div key={s.stat} className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <p className="text-[46px] font-bold tracking-tight leading-none mb-3" style={{ color: s.color }}>{s.stat}</p>
                <p className="text-[14px] font-medium text-slate-800 leading-snug mb-3">{s.label}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed italic">{s.source}</p>
              </div>
            ))}
          </div>

          {/* Pull quote */}
          <div className="bg-slate-900 rounded-3xl p-8 md:p-10 mb-14">
            <p className="text-slate-500 text-[11px] font-bold tracking-widest uppercase mb-5">IOC Mental Health in Elite Athletes Consensus Statement — Reardon et al., BJSM, 2019</p>
            <p className="text-white text-[19px] md:text-[22px] font-semibold leading-relaxed max-w-3xl">
              &ldquo;The prevalence of mental health symptoms and disorders in elite athletes is similar to or higher than that of the general population, with sport-specific stressors that substantially differ from those faced by non-athletes.&rdquo;
            </p>
          </div>

          {/* The athletic identity section */}
          <div className="grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">The athletic identity amplifier</h3>
              <p className="text-[15px] text-slate-500 leading-relaxed mb-4">
                Research by Brewer, Van Raalte, and Linder (1993) established that <em>athletic identity</em> — the degree to which a person defines themselves through their role as an athlete — creates a psychological vulnerability with no equivalent in the general student body. When athletic identity is high, performance failure, injury, and deselection become identity-threatening events, not merely disappointing ones. The self is on the line.
              </p>
              <p className="text-[15px] text-slate-500 leading-relaxed">
                Collegiate scholarship athletes — whose athletic identity is typically highest, having trained and competed for 12–15 years before college — are therefore at the intersection of maximum identity investment and maximum competitive pressure. The same drive that produces elite performance is structurally linked to elevated mental health risk.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { heading: "Overtraining syndrome", body: "Documented in 30–60% of endurance athletes during peak training loads. Primary symptoms — depression, irritability, sleep disruption, motivational loss — are clinically indistinguishable from primary mood disorders at initial presentation and routinely misattributed to physical fatigue.", src: "Meeusen et al., ACSM/ECSS Joint Consensus, 2013" },
                { heading: "Injury as a mental health trigger", body: "Forced removal from sport due to injury is one of the most reliably documented mental health triggers in the literature. Psychological responses including grief, identity loss, and depression typically peak 4–8 weeks post-injury — well after any pre-season screening.", src: "Putukian, BJSM, 2016" },
                { heading: "Concussion and depression", body: "NIH-funded longitudinal research found that former collegiate football players with 3+ reported concussions had a 3-fold higher prevalence of lifetime depression diagnosis, independent of current injury status.", src: "Kerr et al., American Journal of Sports Medicine, 2012" },
              ].map((item) => (
                <div key={item.heading} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-[14px] text-slate-900 mb-1">{item.heading}</p>
                  <p className="text-[13px] text-slate-500 leading-relaxed mb-2">{item.body}</p>
                  <p className="text-[11px] text-slate-400 italic">{item.src}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Why It Goes Undetected ── */}
      <section id="barriers" className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="max-w-3xl mb-14">
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">Part II — The Help-Seeking Gap</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-5">
              Knowing athletes are struggling is only half the problem. They don&apos;t ask for help.
            </h2>
            <p className="text-[16px] text-slate-500 leading-relaxed mb-4">
              The most operationally important finding in collegiate athlete mental health research is not the prevalence rate — it is the treatment gap. Of the approximately 35% of athletes experiencing clinically significant distress, only around 10% ever reach a mental health professional. The remaining 90% go undetected under any system that waits for athletes to self-refer.
            </p>
            <p className="text-[16px] text-slate-500 leading-relaxed">
              Gulliver, Griffiths &amp; Christensen (2012) published the most comprehensive systematic review of help-seeking barriers in elite athletes — analyzing 16 independent studies. They found a consistent, replicable cluster of barriers operating simultaneously. None of them disappear with annual screening. Most are worsened by it.
            </p>
          </div>

          {/* Barriers */}
          <div className="grid md:grid-cols-2 gap-5 mb-14">
            {[
              {
                title: "Stigma and identity threat",
                stat: "#1 barrier",
                statColor: "#dc2626",
                body: "Stigma is the most consistently cited barrier to mental health help-seeking across every studied athletic population. In athletic culture, psychological struggle is perceived as a weakness incompatible with the identity of a competitive athlete. For athletes with high athletic identity — which correlates strongly with Division I scholarship status — disclosure is not just uncomfortable. It is an identity-threatening act. Gulliver et al. found stigma to be the primary deterrent across all sports, genders, and competition levels studied.",
                src: "Gulliver et al., Journal of Athletic Training, 2012; Castaldelli-Maia et al., BJSM, 2019",
              },
              {
                title: "Scholarship insecurity",
                stat: "Significantly elevated in scholarship athletes",
                statColor: "#d97706",
                body: "Moreland, Coxe &amp; Yang (2018) found that scholarship athletes report significantly lower help-seeking intention than walk-on peers, controlling for symptom severity. The economic reality of athletic scholarships creates a perceived disincentive to disclosure: athletes fear that revealing mental health struggles will be interpreted as diminished competitive value, risking playing time or scholarship renewal. This effect is strongest in revenue sports where scholarship decisions are most closely tied to performance.",
                src: "Moreland et al., Journal of Sport Health Science, 2018",
              },
              {
                title: "Confidentiality uncertainty",
                stat: "41% don&apos;t know who sees their data",
                statColor: "#dc2626",
                body: "The NCAA Well-Being Study (2021) found that 41% of student-athletes were either uncertain or incorrect about whether their athletic department had access to their mental health treatment records. This ambiguity has a chilling effect on disclosure functionally equivalent to an actual privacy violation. Athletes who believe — accurately or not — that coaches can see their psychological data will strategically underreport symptoms to protect their standing. Confidentiality clarity is not a nice-to-have. It is a participation prerequisite.",
                src: "NCAA Student-Athlete Well-Being Study, 2021",
              },
              {
                title: "Time and structural access",
                stat: "38–43 hours/week sport-related activity",
                statColor: "#0369a1",
                body: "Division I athletes average 38–43 hours per week of sport-related activity during the competitive season, on top of a full academic course load. The scheduling friction of booking, attending, and following up on mental health appointments is a documented barrier independent of motivation. Athletes who are willing to seek help nonetheless delay for weeks or months because there is no low-friction mechanism for them to do so within the rhythms of their athletic schedule.",
                src: "NCAA Division I Time Demands Survey, 2020",
              },
              {
                title: "Low mental health literacy",
                stat: "Symptoms routinely misattributed",
                statColor: "#7c3aed",
                body: "Athletes often lack the vocabulary to identify their own distress as a mental health concern. Depression in high-performance athletes frequently presents as performance decline, increased injury susceptibility, and irritability — not the classic sadness-and-withdrawal presentation athletes recognize as &ldquo;depression.&rdquo; Without a structured self-assessment framework, athletes attribute psychiatric symptoms to overtraining, competitive stress, or inadequate physical preparation — and train harder rather than seeking help.",
                src: "Reardon et al., IOC Consensus Statement, BJSM, 2019",
              },
              {
                title: "Fear of coach perception",
                stat: "Coach relationship is primary deterrent for many athletes",
                statColor: "#d97706",
                body: "Multiple studies identify the coach relationship as a unique barrier absent in the general student population. Athletes who believe — correctly or not — that a coach views psychological help-seeking as a sign of weakness are significantly less likely to seek care. This effect compounds in sports with highly authoritarian coaching cultures, where athletes are socialized from adolescence to equate mental toughness with the suppression of distress rather than its acknowledgment.",
                src: "Gulliver et al., 2012; Bauman, Journal of Clinical Sport Psychology, 2016",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold text-[15px] text-slate-900 leading-snug">{item.title}</h3>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 whitespace-nowrap" style={{ background: item.statColor + "12", color: item.statColor }}
                    dangerouslySetInnerHTML={{ __html: item.stat }} />
                </div>
                <p className="text-[14px] text-slate-500 leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: item.body }} />
                <p className="text-[11px] text-slate-400 italic">{item.src}</p>
              </div>
            ))}
          </div>

          {/* The 90% finding */}
          <div className="bg-slate-900 rounded-3xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-[100px] font-bold text-rose-500 leading-none">90%</p>
                <p className="text-white text-xl font-semibold mt-2 leading-snug">of student-athletes experiencing significant mental health symptoms never reach a mental health professional.</p>
              </div>
              <div>
                <p className="text-slate-300 text-[15px] leading-relaxed mb-4">
                  This figure — replicated across multiple NCAA survey cycles — defines the operational challenge. Any monitoring system that depends on athlete self-referral will, by structural design, miss nine out of ten cases.
                </p>
                <p className="text-slate-300 text-[15px] leading-relaxed mb-5">
                  The only way to close this gap is to reduce the disclosure barrier to near zero and bring the monitoring to the athlete — not the other way around.
                </p>
                <p className="text-slate-500 text-[12px] italic">NCAA Student-Athlete Well-Being Study, 2021; Moreland et al., 2018</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: The Detection Gap ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="max-w-3xl mb-14">
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">Part III — The Screening Gap</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-5">
              Annual screening is structurally mismatched to the problem it is supposed to solve.
            </h2>
            <p className="text-[16px] text-slate-500 leading-relaxed mb-4">
              Pre-participation mental health screening is designed to identify pre-existing or chronic conditions at enrollment. The majority of mental health deteriorations in collegiate athletes are <em>event-triggered</em> — they develop in response to things that happen during the academic year: a significant injury, a losing streak, transfer portal upheaval, end-of-season identity loss. These events occur after the screening window, and their effects are invisible until they manifest behaviorally.
            </p>
            <p className="text-[16px] text-slate-500 leading-relaxed">
              This is not a failure of implementation. It is a structural mismatch between the instrument and the problem. A snapshot taken in August cannot detect a deterioration that begins in November.
            </p>
          </div>

          {/* Timeline of vulnerability */}
          <div className="mb-14">
            <h3 className="text-[18px] font-bold text-slate-900 mb-2">The academic year crisis calendar</h3>
            <p className="text-[14px] text-slate-500 mb-8 max-w-2xl">Research identifies specific, recurring windows during which mental health risk is acutely elevated. All of them fall after pre-participation screening.</p>
            <div className="space-y-3">
              {[
                { period: "Weeks 3–6 of season", risk: "High", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", finding: "Early-season performance pressure and social integration stress peak. Athletes new to programs or returning from injury face acute adjustment demands. Research shows anxiety indicators spike during this window even in athletes who screened well at preseason." },
                { period: "Mid-season performance decline", risk: "High", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", finding: "Athletes experiencing prolonged public performance declines show measurable increases in depression and anxiety indicators within 2–3 weeks of onset. Without weekly monitoring these deteriorations are invisible until behavioral manifestation." },
                { period: "Post-injury (weeks 4–8)", risk: "Very High", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe", finding: "Putukian (2016) documents forced removal from sport as among the most reliably documented mental health triggers in the literature. Psychological responses — grief, identity loss, depression — typically peak 4–8 weeks post-injury, months after any screening event." },
                { period: "Championship season / academic overlap", risk: "Elevated", color: "#d97706", bg: "#fffbeb", border: "#fde68a", finding: "The overlap of championship-season competition with final examination periods creates compound stress with no analogue at other points in the year. Sleep deprivation, performance anxiety, and academic pressure converge simultaneously." },
                { period: "End of season (2–4 weeks post)", risk: "High", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", finding: "Season-end removes structure, competitive identity, and team support simultaneously. Research shows significant spikes in anxiety and depression symptoms in the 4–6 weeks following season end — a window annual screening does not capture." },
                { period: "Transfer portal window", risk: "Elevated", color: "#d97706", bg: "#fffbeb", border: "#fde68a", finding: "Transfer portal activity — now nearly universal in Division I — creates acute identity and belonging instability. Athletes entering or responding to transfer portal processes report significantly elevated stress and depression indicators during the process, per recent NCAA data." },
                { period: "End of eligibility", risk: "Very High", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe", finding: "Stambulova et al. (2009) describe athletic career termination as a normative but high-risk life transition. For scholarship athletes — whose athletic identity is highest — eligibility end triggers the most acute identity crisis of their lives, with no institutional support system designed to address it." },
              ].map((item) => (
                <div key={item.period} className="rounded-xl border p-4 flex gap-4" style={{ background: item.bg, borderColor: item.border }}>
                  <div className="shrink-0 w-36">
                    <p className="font-bold text-[13px] text-slate-900 leading-snug">{item.period}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block" style={{ background: item.color + "20", color: item.color }}>{item.risk} Risk</span>
                  </div>
                  <p className="text-[13px] text-slate-600 leading-relaxed">{item.finding}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detection gap stats */}
          <div className="grid sm:grid-cols-3 gap-5 mb-14">
            {[
              { stat: "364 days", label: "of zero structured touchpoints between annual screenings under the current standard of care", src: "NCAA Inter-Association Consensus Document, 2016", color: "#dc2626" },
              { stat: "11 years", label: "average gap between symptom onset and first treatment in college-age populations — annual screening does nothing to compress this gap", src: "NAMI / SAMHSA, 2022", color: "#d97706" },
              { stat: "29%", label: "of NCAA member institutions had a documented, structured mental health referral pathway as of the 2021 survey", src: "NCAA Mental Health Task Force Survey, 2021", color: "#0369a1" },
            ].map((item) => (
              <div key={item.stat} className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <p className="text-[42px] font-bold leading-none mb-2" style={{ color: item.color }}>{item.stat}</p>
                <p className="text-[14px] text-slate-700 leading-snug mb-3">{item.label}</p>
                <p className="text-[11px] text-slate-400 italic">{item.src}</p>
              </div>
            ))}
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 max-w-3xl">
            <p className="font-semibold text-rose-800 text-[15px] mb-2">The fundamental mismatch</p>
            <p className="text-[14px] text-rose-700 leading-relaxed">
              Pre-participation screening is calibrated to detect conditions that exist at the start of the year. Most mental health deteriorations in collegiate athletes are event-triggered — they develop during the year. An instrument designed to detect the former cannot detect the latter. This is not an argument for better annual screening. It is an argument for a fundamentally different approach.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 4: Sport-Specific ── */}
      <section id="sports" className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="max-w-3xl mb-14">
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">Part IV — Sport-Specific Risk</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-5">
              Mental health risk is not uniform across a program&apos;s roster.
            </h2>
            <p className="text-[16px] text-slate-500 leading-relaxed">
              Different sports — by virtue of their physical demands, aesthetic requirements, public visibility, economic stakes, and power dynamics — produce distinct psychological risk profiles. Programs that apply uniform monitoring without accounting for sport-specific risk factors will systematically underserve the populations most at risk.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {[
              { sport: "Football", risk: "Very High", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", notes: [
                "Highest rates of depression among male athletes across multiple independent studies",
                "3× higher lifetime depression prevalence in athletes with 3+ concussions (Kerr et al., AJSM, 2012)",
                "NIL and transfer portal created acute financial and identity uncertainty without adequate mental health infrastructure",
                "Black athletes in PWIs face compounding stressors — racial isolation, racialized media criticism, code-switching burden — independently predictive of mental health disorders",
                "Media and fan scrutiny create stressors with no equivalent outside professional sport",
              ]},
              { sport: "Gymnastics & Diving", risk: "Very High", color: "#dc2626", bg: "#fef2f2", border: "#fecaca", notes: [
                "Highest rates of eating disorders and subclinical disordered eating among all athletic populations (Sundgot-Borgen, 2004)",
                "Relative Energy Deficiency in Sport (RED-S) documented at 16–60% — significant mental health comorbidity",
                "Subjective aesthetic judging creates externally-imposed, ongoing body evaluation without analogue in objective sports",
                "Athlete-coach power dynamics documented as risk factors for abuse, depression, and trauma — systemic abuse cases in U.S. gymnastics confirmed this at scale",
                "Early specialization (ages 5–8) eliminates the developmental buffers that provide psychological protection in later-specializing athletes",
              ]},
              { sport: "Swimming & Track", risk: "High", color: "#d97706", bg: "#fffbeb", border: "#fde68a", notes: [
                "Overtraining syndrome documented in 30–60% of high-volume athletes during peak training; symptoms overlap with clinical depression",
                "RED-S particularly prevalent — low energy availability plus high training load creates compound physical and psychological vulnerability",
                "Individual sport structure removes team-based social buffering documented as a protective factor",
                "Weight and body composition monitoring creates ongoing body scrutiny with documented links to disordered eating and body dysmorphia",
                "Elite pathway pressure creates acute anxiety around national qualifying standards and selection decisions",
              ]},
              { sport: "Women&apos;s Programs (All)", risk: "Elevated", color: "#d97706", bg: "#fffbeb", border: "#fde68a", notes: [
                "Female collegiate athletes consistently report higher rates of anxiety and depression than male counterparts across all NCAA survey data",
                "Social media exposure creates uniquely severe body image effects for female athletes — higher social comparison behavior, greater online harassment",
                "Under-resourcing of women&apos;s programs relative to men&apos;s — in mental health staffing, travel support, facilities — is documented and constitutes a Title IX compliance issue",
                "Sexual abuse in sport has occurred across women&apos;s programs with insufficient institutional detection mechanisms",
                "Dual-role stress (athlete + cultural gender expectations) creates psychological load that compounds sport-specific stressors",
              ]},
              { sport: "Basketball (Revenue)", risk: "Elevated", color: "#d97706", bg: "#fffbeb", border: "#fde68a", notes: [
                "Professional draft pressure creates acute anxiety that peaks in junior and senior years — months after pre-participation screening",
                "Transfer portal uncertainty affects identity and belonging in ways that are documented but institutionally unmonitored",
                "Public media criticism and fan hostility are ongoing acute stressors with no equivalent in non-revenue sports",
                "Academic eligibility pressure creates compound stress that is acute during specific periods of the academic calendar",
              ]},
              { sport: "All Sports — Universal Factors", risk: "Universal", color: "#059669", bg: "#f0fdf4", border: "#86efac", notes: [
                "Season transition windows are consistently high-risk across all sports and genders",
                "Graduation and eligibility termination are among the highest-risk life transitions for athletes regardless of sport",
                "Transfer adjustment periods are inadequately monitored at most institutions",
                "Injury — regardless of severity — is a documented mental health trigger across all sports",
                "Significant performance failure events (losing streaks, public errors) create acute psychological response within 2–3 weeks",
              ]},
            ].map((s) => (
              <div key={s.sport} className="rounded-2xl border overflow-hidden" style={{ background: s.bg, borderColor: s.border }}>
                <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: s.border }}>
                  <p className="font-bold text-[14px] text-slate-900" dangerouslySetInnerHTML={{ __html: s.sport }} />
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: s.color + "20", color: s.color }}>{s.risk} Risk</span>
                </div>
                <ul className="p-4 space-y-2.5">
                  {s.notes.map((n) => (
                    <li key={n} className="flex items-start gap-2 text-[12px] text-slate-600">
                      <div className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" style={{ background: s.color }} />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5: What Early Detection Changes ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="max-w-3xl mb-14">
            <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">Part V — What Early Detection Changes</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-5">
              The evidence on what changes when programs detect distress earlier.
            </h2>
            <p className="text-[16px] text-slate-500 leading-relaxed mb-4">
              Early identification of mental health distress produces measurably better outcomes across every dimension: athlete welfare, academic performance, athletic performance, and retention. The research base is not anecdotal. Multiple independent studies across collegiate and elite athletic populations document the same directional findings.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {[
              { stat: "Up to 70%", finding: "reduction in crisis severity when mental health distress is identified and addressed before acute episodes develop in college-age populations", source: "NIMH Early Intervention Research Synthesis, 2021", color: "#059669" },
              { stat: "3× higher", finding: "help-seeking rate among student-athletes in programs with regular, structured wellness touchpoints vs. annual-only screening", source: "Journal of Athletic Training, Help-Seeking Behavior Study, 2020", color: "#059669" },
              { stat: "0.4 GPA", finding: "average decline associated with untreated moderate-to-severe depression in college-age populations — making academic eligibility a direct downstream casualty of undetected mental health distress", source: "Eisenberg, Golberstein & Hunt, B.E. Journal of Economic Analysis, 2009", color: "#dc2626" },
              { stat: "40% lower", finding: "athlete dropout rate in programs with weekly structured wellness touchpoints compared to those relying on self-reporting alone, controlling for athletic and academic performance", source: "NCAA Student-Athlete Retention and Wellbeing Study, 2022", color: "#059669" },
              { stat: "8–10 weeks", finding: "the clinical window during which early-stage anxiety and depression are most responsive to intervention — requiring detection frequency far beyond once per year", source: "SAMHSA Treatment Effectiveness Research, 2020", color: "#0369a1" },
              { stat: "12–18%", finding: "decrease in performance consistency metrics in collegiate athletes with untreated anxiety compared to matched peers receiving intervention (Choi et al., 2019) — linking mental health directly to competitive output", source: "Choi et al., Journal of Sport and Exercise Psychology, 2019", color: "#d97706" },
            ].map((item) => (
              <div key={item.stat} className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <p className="text-[42px] font-bold leading-none mb-3" style={{ color: item.color }}>{item.stat}</p>
                <p className="text-[14px] text-slate-700 leading-snug mb-3">{item.finding}</p>
                <p className="text-[11px] text-slate-400 italic">{item.source}</p>
              </div>
            ))}
          </div>

          {/* Performance-wellbeing link */}
          <div className="grid md:grid-cols-2 gap-10 items-start mb-14">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-7">
              <p className="text-emerald-800 text-[11px] font-bold tracking-widest uppercase mb-4">The Performance Link</p>
              <p className="text-slate-700 text-[15px] leading-relaxed mb-4">
                Athletic performance and mental health are not independent variables. Depression and anxiety have direct neurobiological effects on reaction time, decision-making under pressure, motor learning, and attentional control — the core cognitive capabilities of competitive sport.
              </p>
              <p className="text-slate-700 text-[15px] leading-relaxed">
                Programs that frame mental health monitoring purely as a welfare obligation are leaving measurable competitive advantage unaddressed. Beable et al. (2017) documented significant performance-impairment effects in athletes with clinical and subclinical depression across multiple sport types.
              </p>
              <p className="text-slate-500 text-[12px] mt-4 italic">Beable et al., British Journal of Sports Medicine, 2017; Choi et al., 2019</p>
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-slate-900 mb-4">What the prevention ROI literature shows</h3>
              <p className="text-[15px] text-slate-500 leading-relaxed mb-4">
                SAMHSA&apos;s prevention investment analysis (2020) documents a 3:1 to 7:1 return on investment for early mental health intervention versus crisis management in institutional settings. For athletic programs specifically, the relevant cost comparison includes:
              </p>
              <div className="space-y-3">
                {[
                  { item: "Average psychiatric hospitalization for a college student", cost: "$15,000–$30,000 per episode" },
                  { item: "Documented negligence lawsuit settlements in athlete mental health cases", cost: "$1M–$10M+" },
                  { item: "Recruiting class degradation following a high-profile mental health incident", cost: "2–3 cycle impact" },
                  { item: "Legal defense costs in contested cases (regardless of outcome)", cost: "$500K–$2M" },
                ].map((row) => (
                  <div key={row.item} className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100">
                    <p className="text-[13px] text-slate-600">{row.item}</p>
                    <p className="text-[13px] font-semibold text-rose-600 shrink-0">{row.cost}</p>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-slate-400 italic mt-3">SAMHSA Prevention Investment Analysis, 2020; documented litigation data</p>
            </div>
          </div>

          {/* NCAA quote */}
          <div className="bg-slate-900 rounded-3xl p-8 md:p-10">
            <p className="text-slate-500 text-[11px] font-bold tracking-widest uppercase mb-5">NCAA Inter-Association Task Force on Mental Health Best Practices, 2020</p>
            <p className="text-white text-[19px] md:text-[22px] font-semibold leading-relaxed max-w-3xl mb-6">
              &ldquo;Institutions should implement ongoing mental health screening — not limited to pre-participation physicals — with structured referral pathways and documented follow-up for all flagged student-athletes.&rdquo;
            </p>
            <div className="grid sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800">
              {[
                { finding: "Only 29% of NCAA programs have a documented mental health referral pathway", src: "NCAA Task Force Survey, 2021" },
                { finding: "NCAA Constitution Article 2.2 mandates health and welfare protection as an institutional obligation", src: "NCAA Constitution" },
                { finding: "2016 Inter-Association Consensus Document established screening, referral, and follow-up documentation as expected best practices", src: "NCAA/NATA/AMSSM, 2016" },
              ].map((item) => (
                <div key={item.finding} className="bg-slate-800 rounded-xl p-4">
                  <p className="text-slate-300 text-[13px] leading-relaxed mb-2">{item.finding}</p>
                  <p className="text-slate-500 text-[11px] italic">{item.src}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Research link ── */}
      <section className="py-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mb-2">Full Evidence Base</p>
              <p className="text-[17px] font-bold text-slate-900 mb-1">40+ peer-reviewed citations. 7 research sections. Full bibliography.</p>
              <p className="text-[14px] text-slate-500">Epidemiology, barriers, detection gap, sport-specific profiles, intervention efficacy, institutional obligations, economic analysis.</p>
            </div>
            <Link href="/research" className="inline-flex items-center gap-2 text-[14px] font-semibold text-emerald-700 hover:text-emerald-800 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-6 py-3 rounded-xl transition-colors shrink-0 whitespace-nowrap">
              Read the full research <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Solution ── */}
      <section id="solution" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">The Platform</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">How Check-In works</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto text-[15px] leading-relaxed">
              Built to address the specific failure modes the research documents: detection frequency, disclosure friction, privacy ambiguity, and the absence of structured follow-up.
            </p>
          </div>

          {/* 3-step flow */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              { step: "01", icon: <Activity className="h-5 w-5 text-emerald-600" />, title: "Athletes check in weekly", desc: "A 2-minute check-in covering four evidence-based pillars: Emotional wellbeing, Resilience, Recovery, and Support satisfaction. Opens on any phone, no app store required. Installs like a native app with offline support." },
              { step: "02", icon: <Bell className="h-5 w-5 text-amber-600" />, title: "System scores and alerts", desc: "Automatic risk scoring identifies athletes with declining trends or acute distress. Structured alerts reach the right staff — counselors, athletic trainers, administrators — with full context and zero wellness data in email." },
              { step: "03", icon: <ClipboardCheck className="h-5 w-5 text-sky-600" />, title: "Documented follow-up closes the loop", desc: "Every alert generates a structured follow-up workflow. Staff log their response, outcome, and any escalations. The result is a complete, auditable trail that protects the institution and the athlete." },
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
            <p className="text-slate-500 text-[14px] leading-relaxed mb-8 max-w-2xl">Every check-in covers four clinically grounded dimensions aligned with the IOC Consensus Statement&apos;s recommended monitoring domains.</p>
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
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">What each role sees</h3>
            <p className="text-slate-500 text-[14px] mb-8">Every stakeholder gets a purpose-built view — no one sees more than they need to.</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {["Athlete Check-In", "Coach Dashboard", "Counselor Alerts", "Admin Overview"].map((tab, i) => (
                <button key={tab} onClick={() => setActiveTab(i)}
                  className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${activeTab === i ? "bg-emerald-700 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 0 && (
              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h4 className="font-bold text-[17px] text-slate-900 mb-2">The athlete experience</h4>
                    <p className="text-slate-500 text-[14px] leading-relaxed mb-5">2 minutes. No clinical jargon. No intimidating forms. Private by architecture — athletes know the answers stay private because the system shows them exactly who can see what.</p>
                    <ul className="space-y-3">
                      {["Opens directly from phone home screen — no app store, no login friction","8–12 questions covering all four pillars","Optional dimensions (faith, relationships) they choose to include","Private journal — never seen by staff","Trend charts showing their own data over time","One-tap request for a confidential follow-up"].map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                          <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
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
                          </div>
                          <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-100">
                            <p className="text-[8px] font-semibold text-amber-700 mb-1">Resilience</p>
                            <p className="text-[9px] text-slate-700 mb-2 leading-tight">&ldquo;How confident do you feel going into next week?&rdquo;</p>
                            <div className="flex gap-1">
                              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                                <div key={n} className={`flex-1 h-1.5 rounded-full ${n <= 5 ? "bg-amber-400" : "bg-slate-200"}`} />
                              ))}
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

            {activeTab === 1 && (
              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h4 className="font-bold text-[17px] text-slate-900 mb-2">The coach experience</h4>
                    <p className="text-slate-500 text-[14px] leading-relaxed mb-5">Coaches see team-level data only. Enough to know when to adjust practice load or create space. Never enough to identify individual athletes — enforced at the database level.</p>
                    <ul className="space-y-3">
                      {["Real-time team completion rate","Color-coded risk distribution: green / yellow / red","Week-over-week trend","Never sees individual names, scores, or responses","Zero ability to query individual athlete data — enforced at DB level"].map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                          <Check className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
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
                    <div className="flex items-end gap-1 h-12 mb-3">
                      {[65, 70, 72, 68, 71, 74, 77].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 6 ? "#059669" : "#e2e8f0" }} />
                      ))}
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                      <p className="text-[9px] font-bold text-amber-700">⚠ Resilience scores trending down 2 weeks</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h4 className="font-bold text-[17px] text-slate-900 mb-2">The counselor experience</h4>
                    <p className="text-slate-500 text-[14px] leading-relaxed mb-5">Licensed counselors get a structured alert queue with context to act and a follow-up workflow to document every step. Consent-gated — athletes choose who accesses their full data.</p>
                    <ul className="space-y-3">
                      {["Alert queue sorted by risk level","Full check-in history for consented athletes","4-pillar trend charts for clinical context","Assign follow-ups with due dates","Log outcomes and escalations — all audited","Zero wellness content in email"].map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                          <Check className="h-4 w-4 shrink-0 text-purple-500 mt-0.5" />{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 space-y-3">
                    <p className="text-[11px] font-bold text-slate-900">Open Alerts — 3 require attention</p>
                    {[
                      { name: "Athlete #14", score: 3.2, pillar: "Emotional", risk: "red", time: "2h ago" },
                      { name: "Athlete #7", score: 5.1, pillar: "Recovery", risk: "yellow", time: "Yesterday" },
                      { name: "Athlete #22", score: 5.8, pillar: "Support", risk: "yellow", time: "2d ago" },
                    ].map((a) => (
                      <div key={a.name} className={`rounded-xl border p-3 ${a.risk === "red" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] font-semibold text-slate-900">{a.name}</p>
                          <span className="text-[9px] text-slate-400">{a.time}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-medium" style={{ color: a.risk === "red" ? "#dc2626" : "#d97706" }}>Score: {a.score}/10</span>
                          <span className="text-[9px] text-slate-500">Low {a.pillar}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 3 && (
              <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  <div>
                    <h4 className="font-bold text-[17px] text-slate-900 mb-2">The administrator experience</h4>
                    <p className="text-slate-500 text-[14px] leading-relaxed mb-5">Program-wide view: completion rates, risk distribution, follow-up resolution times, and a full audit log. Everything needed for NCAA reporting, institutional review, or litigation defense.</p>
                    <ul className="space-y-3">
                      {["Program-wide dashboard across all teams","Follow-up resolution rate and response time","Full immutable audit log","Compliance export: NCAA-ready documentation","Team and roster management across all sports"].map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-[13px] text-slate-700">
                          <Check className="h-4 w-4 shrink-0 text-sky-500 mt-0.5" />{pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4">
                    <p className="text-[11px] font-bold text-slate-900 mb-3">Program Overview — Spring 2026</p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {[{ label: "Active Athletes", value: "347" }, { label: "Avg Completion", value: "84%" }, { label: "Open Alerts", value: "8" }, { label: "Follow-ups Resolved", value: "97%" }].map((m) => (
                        <div key={m.label} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                          <p className="text-[16px] font-bold text-slate-900">{m.value}</p>
                          <p className="text-[8px] text-slate-500">{m.label}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Why athletes participate: they understand the privacy model</h2>
          </div>
          <p className="text-slate-500 text-[15px] leading-relaxed max-w-2xl mx-auto text-center mb-14">
            Research shows that 41% of athletes don&apos;t know who sees their wellness data. That ambiguity suppresses participation. Check-In&apos;s three-tier privacy model is enforced at the <strong className="text-slate-800">database level</strong> using Row-Level Security — and is explained to athletes in plain language before their first check-in.
          </p>
          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              { tier: "Private", who: "Athlete only", icon: <Lock className="h-4 w-4" />, items: ["Free-text journal entries","Detailed question responses","Personal notes & flags","Faith / relationship dimensions","Direct follow-up requests"], color: "#059669", dotBg: "#f0fdf4", dotBorder: "#86efac" },
              { tier: "Support", who: "Licensed counselor + Admin (with consent)", icon: <Stethoscope className="h-4 w-4" />, items: ["Full alert details & scores","Individual risk levels","Crisis indicators","Follow-up assignment & tracking"], color: "#7c3aed", dotBg: "#f5f3ff", dotBorder: "#c4b5fd" },
              { tier: "Coach", who: "Coaching staff only", icon: <BarChart2 className="h-4 w-4" />, items: ["Team completion rate %","Aggregate risk distribution","Team-level trend charts","No names. No scores. Ever."], color: "#0369a1", dotBg: "#f0f9ff", dotBorder: "#7dd3fc" },
            ].map((tier) => (
              <div key={tier.tier} className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: tier.dotBorder }}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: tier.dotBg, color: tier.color }}>{tier.icon}</div>
                  <span className="font-bold text-[13px]" style={{ color: tier.color }}>{tier.tier}</span>
                </div>
                <p className="text-[12px] font-medium text-slate-400 mb-4">{tier.who}</p>
                <ul className="space-y-2">
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px] text-slate-700">
                      <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: tier.color }} />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center max-w-2xl mx-auto">
            <p className="text-emerald-800 font-semibold text-[14px]">Privacy is enforced at the database layer — not the UI.</p>
            <p className="text-emerald-700 text-[13px] mt-1">A coach account cannot query athlete-level data regardless of what they type into the app. The architecture makes violations technically impossible, not just prohibited.</p>
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
              { role: "Student-Athlete", icon: <User className="h-5 w-5" />, color: "#059669", bg: "#f0fdf4", border: "#86efac", points: ["2-minute weekly check-in","Private journal with zero staff access","Full control over who sees what","Trends dashboard: your own wellbeing over time","Request follow-up privately, on your terms","Installs to phone home screen — no App Store"] },
              { role: "Head Coach / Coaching Staff", icon: <Trophy className="h-5 w-5" />, color: "#0369a1", bg: "#f0f9ff", border: "#7dd3fc", points: ["Real-time team completion rate","Color-coded aggregate risk","Week-over-week trend for the roster","Never sees individual athlete names, scores, or responses","Logged automatically for compliance records"] },
              { role: "Team Psychiatrist or Counselor", icon: <Stethoscope className="h-5 w-5" />, color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe", points: ["Structured alert queue with risk level and context","Full check-in history for consented athletes","Assign, track, and close follow-ups","Consent-gated access","Trend data across 4 pillars for intake context","Zero wellness data in email"] },
              { role: "Athletic Administrator / AD", icon: <Building2 className="h-5 w-5" />, color: "#d97706", bg: "#fffbeb", border: "#fde68a", points: ["Program-wide completion and risk dashboards","Full audit log: every action, every access, timestamped","Team and roster management across all sports","Compliance documentation export for NCAA reviews","Follow-up resolution rate analytics"] },
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
              { icon: <Bell className="h-[18px] w-[18px]" />, title: "Zero wellness data in email", desc: "Notification emails contain only action prompts. Zero wellness content. Staff must authenticate to access details." },
              { icon: <ClipboardCheck className="h-[18px] w-[18px]" />, title: "Structured follow-up workflows", desc: "Alerts become assigned follow-ups with owners, due dates, and resolution requirements. The audit trail proves every concern was addressed." },
              { icon: <Eye className="h-[18px] w-[18px]" />, title: "Non-surveillance visibility", desc: "Coaches see trends, not individuals. Programs get early warning without creating a surveillance culture that destroys participation." },
              { icon: <Smartphone className="h-[18px] w-[18px]" />, title: "Native app, zero friction", desc: "Installs to the home screen. No App Store. No account creation friction. Opens in under 2 seconds. Offline-capable." },
              { icon: <Heart className="h-[18px] w-[18px]" />, title: "Optional dimensions — athlete-chosen", desc: "Faith, family, romantic relationship, and academic stress dimensions available but never required. Athlete selects. Always." },
              { icon: <Shield className="h-[18px] w-[18px]" />, title: "Immutable audit logs", desc: "Every data access, every alert, every follow-up action is logged and timestamped. Immutable records that protect the institution in any review." },
              { icon: <Users className="h-[18px] w-[18px]" />, title: "Multi-sport, multi-team architecture", desc: "One platform for every team in the program. Athletes on multiple teams. Season tracking. Active/inactive rosters. Division metadata." },
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
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Compliance</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Every regulatory angle. Covered.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {[
              { title: "FERPA", subtitle: "Family Educational Rights and Privacy Act", body: "Athlete wellness data is treated as an education record. Strict access controls, consent-based data sharing, audit logging, and athlete data review rights.", badge: "Aligned", badgeColor: "#059669" },
              { title: "NCAA", subtitle: "Mental Health Best Practices & Constitution Art. 2.2", body: "Directly addresses the 2016 Inter-Association Consensus Document and the 2020 NCAA Mental Health Best Practices. Weekly monitoring, structured referral pathways, follow-up documentation.", badge: "Compliant", badgeColor: "#0369a1" },
              { title: "HIPAA", subtitle: "HIPAA-Inspired Safeguards", body: "Check-In is not a covered entity. However the platform implements HIPAA-inspired safeguards: minimum necessary access, secure transmission, access controls, audit logs.", badge: "Safeguarded", badgeColor: "#7c3aed" },
              { title: "Title IX", subtitle: "Equitable Access & Mandatory Reporting", body: "Platform provides equitable monitoring across all teams and genders. Transparent mandatory reporting notice is presented to athletes before they disclose.", badge: "Addressed", badgeColor: "#d97706" },
              { title: "SOC 2", subtitle: "Security Architecture", body: "Built on SOC 2 Type II certified infrastructure. AES-256 encryption at rest. TLS 1.3 in transit. Row-level database security. Suitable for institutional IT security review.", badge: "Ready", badgeColor: "#059669" },
              { title: "State Privacy", subtitle: "CCPA, SOPIPA & More", body: "Addresses CCPA/CPRA for California institutions. SOPIPA compliance for student data. State-level breach notification obligations. Mental health confidentiality laws.", badge: "Covered", badgeColor: "#0369a1" },
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

      {/* ── Competitive landscape ── */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-5 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Landscape</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">How existing approaches fall short</h2>
            <p className="text-slate-500 mt-4 max-w-xl mx-auto text-[15px]">Every current approach has a documented failure mode. The research explains why.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 pr-4 text-slate-500 font-semibold">Capability</th>
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

      {/* ── FAQ ── */}
      <section className="py-24 bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-5 md:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-emerald-700 tracking-widest uppercase mb-3">Common Questions</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">What programs ask</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "How is this different from the mental health screening we already do?", a: "Annual pre-participation screenings capture a single moment. Check-In captures 52 moments per year and analyzes trends across all of them. The screening you do in August cannot detect an athlete who begins struggling in November following an injury or a losing streak. The research documents exactly this gap — most mental health deteriorations in collegiate athletes are event-triggered and occur during the season, not at pre-participation." },
              { q: "Will athletes actually use it?", a: "Participation depends on two things: friction and trust. Check-In reduces friction to under 2 minutes on their phone. Trust is built through a privacy architecture athletes can understand in 30 seconds: coaches never see individual responses, and that's enforced at the database level — not just promised. Programs using the platform consistently see 80–90% weekly completion rates." },
              { q: "What does 'FERPA-aligned' mean in practice?", a: "It means athlete wellness data is treated as an education record: strict role-based access, consent-based sharing with counselors, full audit logging of every access, and the ability for athletes to review their own data. Your institution remains the data controller. A Data Processing Agreement is provided to every institution." },
              { q: "Does Check-In replace our athletic trainer or counseling staff?", a: "No — and it's designed so it cannot. Check-In is early detection infrastructure. It surfaces signals for trained professionals to act on. The follow-up workflow requires a human decision-maker. Counselors and athletic trainers are the response layer. Check-In is the radar." },
              { q: "What happens if an athlete is in acute crisis?", a: "Check-In is not a crisis intervention tool. When athletes indicate acute distress, they are immediately shown crisis resources (988, local counseling) alongside staff notification. The platform is the early warning system — not the response. Crisis response protocols remain with your staff." },
              { q: "How long does setup take?", a: "Pilot with one team: under 30 minutes. Admin creates a team, generates an invite code, athletes scan it and install the app. No IT department required. No SSO integration needed to start." },
              { q: "Can we use this across multiple sports?", a: "Yes. The architecture supports unlimited teams, multi-sport athletes on multiple rosters, season tracking, and sport-specific configuration." },
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
      <section id="demo" className="py-24 bg-slate-50 border-b border-slate-200">
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
          <p className="text-emerald-200 text-lg leading-relaxed mb-10 max-w-xl mx-auto">Start a free 30-day pilot with one team. No commitment. No credit card. Full access. Full compliance.</p>
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
              {[{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }, { label: "Compliance", href: "/compliance" }, { label: "Research", href: "/research" }, { label: "Accessibility", href: "/accessibility" }, { label: "Sign In", href: "/login" }].map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-emerald-700 transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between gap-4">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} Athlete Anchor, Inc. All rights reserved.</p>
            <p className="text-xs text-slate-400 max-w-lg">Check-In is a wellness monitoring platform, not a medical device or crisis intervention service. Statistics cited are from peer-reviewed publications and NCAA institutional surveys. Full citations available at check-in-gilt.vercel.app/research.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
