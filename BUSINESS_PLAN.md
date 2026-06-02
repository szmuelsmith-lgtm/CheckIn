# Check-In by Athlete Anchor
## Business Plan — Confidential
### Prepared June 2026

---

> *"The tools already exist. The counselors already exist. What's missing is the bridge — something that sees the athlete who isn't coming forward, and sends support toward them instead of waiting for them to find it."*

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Company Overview](#2-company-overview)
3. [Problem](#3-problem)
4. [Solution](#4-solution)
5. [Market Analysis](#5-market-analysis)
6. [Competitive Landscape](#6-competitive-landscape)
7. [Business Model](#7-business-model)
8. [Go-to-Market Strategy](#8-go-to-market-strategy)
9. [Technology & Architecture](#9-technology--architecture)
10. [Compliance & Regulatory Framework](#10-compliance--regulatory-framework)
11. [Financial Projections](#11-financial-projections)
12. [Team & Organizational Plan](#12-team--organizational-plan)
13. [Funding Strategy](#13-funding-strategy)
14. [Risk Analysis](#14-risk-analysis)
15. [Appendix](#15-appendix)

---

## 1. Executive Summary

Check-In is a **privacy-first weekly wellness monitoring platform** for collegiate athletic programs, built on a recognition that most mental health tools fail athletes not because they're inadequate — but because they're waiting in the wrong direction.

Counselors, hotlines, and campus resources exist at nearly every program. The problem is access: they require the athlete to move first. Recognize the distress. Decide it's serious enough. Overcome the stigma that elite sport culture has spent years reinforcing. Find the right person. Ask. A 20-year-old who is quietly unraveling during a road trip in November is not going to do all of that. Most don't.

Check-In changes who moves first. Athletes answer ~3 minutes of private questions on their phone each week. When the platform detects a pattern of concern, a team psychiatrist or counselor receives an alert and initiates contact — without the athlete ever having to raise their hand. The athlete's only job is to be honest. The system handles the rest.

This is not a feature distinction. It is a fundamentally different theory of how support reaches people who need it.

The product addresses a systemic failure: NCAA policy recommends ongoing mental health monitoring, but the vast majority of programs still rely on a single annual screening. In a domain where athlete crises frequently unfold across a single competitive season, annual snapshots miss almost everything. Check-In replaces them with continuous weekly signal, structured follow-up workflows, and compliance documentation — underpinned by a three-tier privacy architecture enforced at the database layer, not the application layer.

**The opportunity is large and underserved.** The global sports management software market is valued at $7.3–12.2B in 2025 and growing at 11–16% CAGR. No incumbent owns the intersection of athlete mental wellness monitoring, institutional privacy compliance, and NCAA-mandated documentation. Teamworks serves 98% of Division I programs — but for scheduling and operations, not clinical wellness routing. Generic mental health apps have no institutional oversight layer. Annual screenings have no follow-up workflow. Check-In is the only purpose-built solution.

**Revenue model:** Per-athlete SaaS subscription. $25–$30/athlete/year for programs. Free 30-day pilot per team, no credit card required. Annual contracts with auto-renewal and a path to conference-level enterprise deals.

**Three-year targets:**

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Paying programs | 10 | 40 | 120 |
| ARR | $50K | $250K | $750K |
| Gross margin | 80% | 85% | 87% |

**Funding ask:** $500K pre-seed to fund 10 pilots, close 5 paying programs, and initiate SOC 2 Type II certification. Seed round of $1.5–2M to follow at 10+ paying programs with >70% weekly athlete completion.

---

## 2. Company Overview

| | |
|---|---|
| **Company Name** | Athlete Anchor, Inc. |
| **Product** | Check-In |
| **Founded** | 2026 |
| **Stage** | Pre-revenue, MVP complete |
| **Headquarters** | [City, State] |
| **Website** | [checkin.athleteanchor.com] |
| **Stack** | Next.js 14, Supabase (PostgreSQL + RLS), Vercel, Resend |
| **Legal Structure** | Delaware C-Corp |

### Mission

To close the distance between student-athletes who are struggling and the people who can help them — by building a system where support moves toward athletes, not the other way around.

### Vision

A future where getting help doesn't require an athlete to be their own advocate at the worst moment of their season.

---

## 3. Problem

### 3.1 The Annual Screening Gap

NCAA policy mandates that member institutions screen student-athletes for mental health concerns. In practice, the overwhelming majority of programs fulfill this requirement with a single annual questionnaire — often administered at the start of the season before the athlete has experienced any competitive stress, travel fatigue, academic pressure, or interpersonal conflict.

A student-athlete's mental health trajectory across a competitive season is not a static event. It is a dynamic, week-by-week story. A single data point at August preseason tells you almost nothing about how that athlete is doing in November.

**The consequences are severe:**
- 35% of college athletes meet diagnostic criteria for anxiety or depression at any given time (IOC Consensus Statement, 2019)
- Suicide is the second leading cause of death among college students
- High-profile athlete tragedies at programs with robust resources — Ohio State, Penn State, University of Michigan — demonstrate that resource availability does not equal continuous monitoring
- Mental health concerns most often emerge mid-season or post-season, not at the time of the annual screening

### 3.2 Available Is Not the Same as Accessible

Resources exist at most programs. The failure isn't supply — it's the distance between a struggling athlete and the person who could help them.

Every existing mental health resource in collegiate athletics requires the athlete to move first: recognize their own distress, decide it's serious enough to act on, navigate past the cultural stigma that runs through competitive sport, find the right person, and ask. That sequence demands a level of clarity and courage that a person in distress is the least equipped to summon. For most, the gap between "struggling" and "getting help" is never crossed.

The numbers confirm it. 35% of college athletes meet diagnostic criteria for anxiety or depression. Only 10% ever seek professional help. The other 25% aren't unaware that resources exist. They just never make the move.

### 3.3 Athletes Don't Trust Existing Tools

When athletes believe their responses can be seen by coaches, they underreport. Completion rates fall. Honest responses fall faster.

This is not a technology problem. It is an institutional trust problem. No survey tool, however well-designed, delivers useful data if athletes believe it is being used against them in playing time decisions. The result is what researchers call **social desirability bias at scale**: programs get data that looks fine, right up until something goes wrong.

### 3.4 No Structured Follow-Up Workflow — So Help Never Arrives

Even when a concern is flagged by a traditional screening, the follow-up process is typically informal: a counselor gets an email, makes a note, tries to schedule time. There is no system to assign responsibility, track resolution, or create an audit trail. Athletes in distress wait. Counselors with caseloads prioritize imperfectly. Help is theoretically available — but it never quite arrives at the door.

### 3.5 Compliance Is Manual and Fragile

Programs cobble together evidence of NCAA compliance from spreadsheets, paper forms, emails, and memory. FERPA-sensitive conversations happen over email. When an accreditor or Title IX coordinator asks for documentation, staff spend days reconstructing records. A lawsuit or an athlete tragedy can expose the institutional paper trail — and find it empty.

### 3.6 Summary: The Five Failures

| Failure | Current State | Consequence |
|---|---|---|
| **Access gap** | Resources exist but require the athlete to initiate | 90% of struggling athletes never reach help |
| **Screening frequency** | Annual | Misses mid-season and post-season crises |
| **Trust** | Athletes fear coach access | Underreporting, low completion, false negatives |
| **Follow-up** | Informal, untracked | Concerns flagged; no one assigned; athletes wait |
| **Compliance** | Manual, fragile | NCAA, FERPA, Title IX exposure |

---

## 4. Solution

### 4.1 Product Overview: The Bridge Between Athletes and Support

Check-In is a **native iOS app** (App Store, bundle ID `com.athleteanchor.checkin`) that serves as the bridge between athletes who are struggling and the people who can help them — without requiring the athlete to know they need to cross it.

| Without Check-In | With Check-In |
|---|---|
| Athlete must recognize and name their distress | System surfaces concern through weekly signal |
| Athlete must overcome stigma and ask | Athlete answers 8 private questions on their phone |
| Athlete must find and contact the right person | Clinician receives an automatic alert |
| Athlete must show up | team psychiatrist or counselor reaches out directly |
| Help reaches athletes who were brave enough to ask | **Help reaches athletes who were only honest enough to check in** |

Once per week, athletes receive a native push notification and complete a ~3-minute check-in. When the platform detects a pattern of concern, a team psychiatrist or counselor is notified and initiates outreach — privately, with no coach involvement. The athlete never had to identify themselves as struggling. They just had to answer the questions.

An Android version is available via the same Capacitor codebase. Beyond weekly check-ins, the platform includes a formal clinical screening tool (PHQ-9 and extended screening mode), secure in-app messaging between athletes and their team psychiatrist or counselor, and a session management system for clinicians tracking appointments and outcomes.

### 4.2 The Three-Tier Privacy Model

This is the architectural core of the product. Privacy is not enforced at the application layer — it is enforced at the PostgreSQL database layer via Row-Level Security (RLS). Even a malicious actor with direct database access cannot retrieve coach-tier data from the support tier.

| Tier | Authorized Users | What They See |
|---|---|---|
| **Private** | Athlete only | Journals, free-text notes, faith/family preferences, personal history |
| **Clinical** | Team Psychiatrist or Counselor + admin | Flagged responses, alert details, crisis indicators, pillar scores, check-in history (with athlete-controlled data scope: summary or full) |
| **Coach** | Head coach | Completion status, risk color (🟢🟡🔴), team-level aggregates only |

No individual scores, journal entries, or alert details are visible to coaches — ever. Athletes additionally control the scope of data shared with their clinical support (summary vs. full), giving them a meaningful consent layer even within the clinical tier. This architectural guarantee is the foundation of athlete trust, which is the foundation of honest responses, which is the foundation of the product's clinical value.

### 4.3 Weekly Check-In Flow

**Question Bank System:**
The check-in is not a fixed 4-question form. The platform maintains a question bank organized across four wellness pillars: **Emotional**, **Resilience**, **Recovery**, and **Support**. Each weekly session selects 2 questions per pillar (8 total) using a deterministic seeded shuffle — unique per athlete per week — with a 14-day cooldown that prevents question repetition. This keeps the check-in fresh and clinically harder to game over multiple cycles.

**The Four Pillars (1–10 scale per question):**
- 🟢 **Emotional** — mood, emotional regulation, stress
- 🔵 **Resilience** — mindset, coping, mental toughness
- 🟣 **Recovery** — sleep quality, rest, physical recovery
- 🔵 **Support** — social connection, feeling supported

**Outreach Consent Step:**
After completing all questions and an optional private notes field, athletes are shown a dedicated consent screen: *"Would it be OK for your team psychiatrist or counselor to reach out to you?"* This step explicitly separates data collection from clinical outreach — the athlete chooses whether to invite contact. Their coach is never informed of either the response or the request.

**Crisis Resources (automatic):**
When any pillar scores below 3, the completion screen automatically surfaces direct links to 988 (Suicide & Crisis Lifeline), 741741 (Crisis Text Line), and 911, with the message: *"You don't have to carry this alone."* These appear regardless of whether the athlete requested follow-up.

**Private Notes (athlete-only, never shared):**
- Free-text field, private, not accessible by any staff role under any circumstances

### 4.4 Automatic Risk Scoring Engine

A priority-ordered decision tree ensures clinically appropriate risk classification:

1. **Outreach consent granted → RED (immediate short-circuit)**
2. **Core threshold flags** (weight 1.0 each): mood ≤ 3, stress ≥ 8, sleep ≤ 3, support ≤ 3
3. **Life dimension flags** (weight 0.5 each): family ≤ 3, social ≤ 3, spiritual ≤ 3, academic ≤ 3, athletic confidence ≤ 3
4. **Composite score** = core flag count + (life dimension flag count × 0.5)
   - Score ≥ 3.0 → 🔴 RED
   - Score ≥ 1.5 → 🟡 YELLOW
   - Score < 1.5 → 🟢 GREEN

Note: stress is scored inversely (high stress = high risk), while all other dimensions use low score = high risk. The engine evaluates only answered questions — unanswered optional dimensions are excluded from the composite.

RED alerts trigger **instant email notifications** to all clinical staff and admins in the athlete's organization. Critically, these emails contain **zero wellness data** — only a link back to the authenticated platform. This eliminates FERPA exposure via email forwarding or inbox compromise.

### 4.5 Structured Follow-Up Workflows

- Alerts are system-generated, not manually created — removing discretionary bias
- Clinical staff (team psychiatrists or counselors) acknowledge, assign, and resolve alerts within the platform
- Follow-up tasks carry: assignee, reason, due date, completion timestamp
- Every action is audit-logged with user ID, timestamp, and IP address
- Compliance reports are exportable for NCAA, accreditor, and institutional review

### 4.6 Role Summary

| Role | Key Capabilities |
|---|---|
| **Athlete** | Weekly check-ins (rotating question bank), private journal, secure messaging with team psychiatrist or counselor, privacy preferences, personal trend charts, export/delete own data |
| **Coach** | Team completion rates, risk color distribution, assigned follow-up tasks — no individual data |
| **team psychiatrist or counselor** | Alert queue by risk level, full pillar score history (with athlete consent), secure messaging with athletes, session status tracking (arrived/in-session/completed/no-show), assign & track follow-ups, PHQ-9 and extended formal screening tools |
| **Admin** | Institutional settings, user provisioning, invite codes, immutable audit logs, NCAA compliance export, resource library, follow-up resolution analytics |

---

## 5. Market Analysis

### 5.1 Market Context

The global sports management software market is valued between **$7.3B and $12.2B in 2025**, with multiple analyst firms projecting 11–16% CAGR through 2031–2034:

| Source | 2025 Market Size | CAGR | 2031–2034 Projection |
|---|---|---|---|
| Market Research Future | $12.22B | 5.2% | $19.32B (2034) |
| Verified Market Research | $8.25B | 15.5% | — |
| Coherent Market Insights | $7.3B | 12.6% | $16.76B (2032) |
| Mordor Intelligence | $11.33B | 11.1% | $19.15B (2031) |

Within that broader market, the student athlete wellness sub-segment is nascent and unquantified — which represents the opportunity. The adjacent student attendance tracking software market is valued at **$1.73B (2024)**, growing at 13–15.5% CAGR. No competitor has purpose-built for the collegiate athletic wellness monitoring layer.

### 5.2 Total Addressable Market (TAM)

Check-In's TAM is defined by the population of NCAA, NAIA, and junior college athletic programs with at least one licensed sports psychology or counseling staff member — the institutional condition required to operationalize the support tier.

| Segment | Programs | Avg. Athletes/Program | Price/Athlete/Year | TAM |
|---|---|---|---|---|
| NCAA Division I | 500 | 350 | $30 | $5.25M |
| NCAA Division II | 310 | 225 | $22 | $1.53M |
| NCAA Division III | 790 | 175 | $18 | $2.49M |
| NAIA | 250 | 150 | $15 | $0.56M |
| Junior College (NJCAA) | 500 | 125 | $12 | $0.75M |
| **Total** | **2,350** | | | **~$10.6M** |

This initial TAM is a focused, defensible niche — not a spray-and-pray market — with expansion potential into:
- **High school athletics** (~26,700 programs): $25–40M incremental TAM
- **Professional minor league / development programs**: $10–15M incremental
- **Military / first responder wellness programs**: $20–30M incremental
- **Corporate wellness with performance benchmarking**: $50M+ incremental

**Blended 5-year TAM (collegiate + early high school expansion): $50–75M ARR**

### 5.3 Serviceable Addressable Market (SAM)

Year 1–3 SAM is the subset of collegiate programs that:
- Have licensed mental health staff on payroll
- Are under active NCAA wellness mandate pressure
- Are not locked into a competing wellness solution (very few are)
- Can approve a per-athlete SaaS subscription within a departmental budget

This describes approximately **800–1,000 programs**, representing a **$15–25M SAM**.

### 5.4 Serviceable Obtainable Market (SOM)

Realistic 3-year capture at founder-led sales pace:

| Year | Paying Programs | Avg. Athletes | ARR |
|---|---|---|---|
| 1 | 10 | 200 | $50K |
| 2 | 40 | 225 | $225K |
| 3 | 120 | 225 | $675K |

At 120 programs, Check-In has captured ~6% of its SAM — aggressive but achievable with conference-level deals and a dedicated sales hire in Year 2.

### 5.5 Market Tailwinds

**1. NCAA Mandate Pressure Is Accelerating**
The NCAA Mental Health Best Practices document (updated 2023) explicitly calls for "ongoing, systematic mental health monitoring" — not annual screenings. As this guidance hardens into enforceable standards and as liability exposure from athlete tragedies increases, programs will be required to demonstrate continuous monitoring capability.

**2. House v. NCAA Settlement Creates Compliance Demand**
The 2025 implementation of revenue sharing under the House v. NCAA settlement has accelerated athletic departments' need for systematic athlete activity and wellness documentation. The compliance infrastructure is being built now.

**3. The Trusted-Brand Gap Is Wide Open**
No well-funded, purpose-built collegiate wellness monitoring company exists below the enterprise tier. Teamworks is D1 operations infrastructure, not mental wellness. Consumer apps (Calm, Headspace) have no institutional oversight layer. The category is wide open for a dedicated entrant.

**4. Post-NIL Institutional Accountability**
With student-athletes now compensated as partial university assets, institutions face heightened duty-of-care obligations. Documented, auditable wellness monitoring is rapidly becoming a liability management imperative, not just a compliance checkbox.

---

## 6. Competitive Landscape

### 6.1 Direct Competitor Map

| Competitor | Focus | Weakness vs. Check-In |
|---|---|---|
| **Teamworks** | D1 operations: scheduling, compliance, NIL, personnel | No mental wellness module; $15K–$100K+ annual enterprise pricing; serves only D1; 98% D1 penetration means their market is saturated |
| **Annual Screenings (status quo)** | Point-in-time assessment (PHQ-9, GAD-7, BAM) | No ongoing signal; no follow-up workflow; no audit trail; athletes game annual screenings |
| **Qualtrics / Google Forms** | Generic survey delivery | No privacy tiers; no risk scoring; no follow-up; no FERPA-aligned architecture; no NCAA-specific compliance |
| **Calm / Headspace / BetterHelp** | Consumer mental wellness / telehealth | Consumer-facing; no institutional oversight; no coach dashboard; no compliance documentation; no risk routing |
| **Flourish (mental wellness app)** | Student wellness tracking | Not athletics-specific; no three-tier privacy model; limited institutional customization |
| **Custom Internal Tools** | Bespoke institutional solutions | 12–18 month build timelines; no clinical validation; expensive ongoing maintenance; no NCAA compliance expertise |

### 6.2 Adjacent Competitors (Not Direct)

| Competitor | What They Do | Why Not a Threat |
|---|---|---|
| **TeamSnap ($44M ARR)** | Team scheduling and communication | Not mental wellness; no clinical routing; per-team pricing breaks at departmental scale |
| **SportsEngine (acq. by PlayMetrics, 2026)** | Youth/college sports registration and management | Registration-focused; M&A turbulence creating customer uncertainty; no wellness module |
| **FinalForms** | Digital athlete clearance and eligibility forms | Registration and paperwork only; no ongoing monitoring |
| **DragonFly Athletics** | HS athletic administration | Free model dependent on state association relationships; no wellness capability |

### 6.3 Porter's Five Forces Analysis

**Threat of New Entrants: MEDIUM**
The technology is buildable — Next.js and Supabase are accessible. However, the barriers are not technical; they are **trust and compliance**. A new entrant cannot credibly claim FERPA compliance, HIPAA-inspired controls, SOC 2 certification, and a validated clinical risk scoring model without 18–24 months of investment. Check-In's first-mover advantage in this specific niche is meaningful if used to establish institutional relationships before a well-funded competitor arrives.

**Bargaining Power of Buyers: MEDIUM-HIGH**
Athletic directors hold significant switching leverage — annual contract renewals are natural exit points. However, once Check-In's audit logs, compliance documentation, and athlete response history are embedded in institutional workflows, switching costs rise considerably. Multi-year conference deals further reduce buyer power.

**Bargaining Power of Suppliers: LOW**
Supabase, Vercel, and Resend are commodity infrastructure providers with no pricing leverage over a $750K ARR business. Stack is replaceable.

**Threat of Substitutes: HIGH (Near-Term)**
The primary substitute is inaction — continuing annual screenings. This is a powerful default. Many athletic directors will choose the status quo until regulatory pressure, a competitor's marketing, or a crisis makes the cost of inaction visible. GTM must create urgency without exploiting tragedy.

**Competitive Rivalry: LOW (Now) → MEDIUM (3–5 Years)**
Today, no direct competitor exists in this exact niche. In 3–5 years, as the market matures and compliance requirements harden, a well-funded incumbent (Teamworks, a PE-backed roll-up, or a consumer wellness company pivoting to B2B) may enter. The window to establish institutional relationships and conference deals is 12–36 months.

### 6.4 Competitive Moats

| Moat | Description | Durability |
|---|---|---|
| **Privacy Architecture** | Three-tier model enforced at database layer (PostgreSQL RLS) — not a feature flag, not a UI setting. Competitors cannot replicate this with a configuration change. | High (architectural) |
| **Clinical Validation** | Risk scoring model built with licensed clinical advisors. Validated weightings, documented methodology. | Medium (can be copied, but takes time to credential) |
| **Compliance Depth** | FERPA-aligned, HIPAA-inspired, SOC 2 ready, NCAA-specific. Built-in from day one, not bolted on. | High (expensive and slow for competitors to replicate) |
| **Athlete Trust → Honest Data** | Once athletes in a program trust the system and have 2+ seasons of personal history, switching creates data loss and trust erosion. | High (behavioral lock-in) |
| **Institutional Audit Trail** | Multi-year compliance documentation becomes institutional infrastructure. Athletic departments cannot easily migrate years of alert and resolution records. | Very High |

---

## 7. Business Model

### 7.1 Pricing Architecture

Check-In uses a **per-athlete, per-year SaaS subscription** model. This aligns pricing with institutional value (more athletes = more value delivered), creates predictable ARR, and scales naturally as programs expand Check-In across more teams.

| Tier | Price | Description |
|---|---|---|
| **Pilot** | Free (30 days, 1 team, ≤50 athletes) | Full platform access. No credit card. Converts to paid or sunsets. |
| **Program** | $20–$30/athlete/year | Unlimited teams, all four roles, email notifications, audit logs, full platform |
| **Enterprise** | Custom pricing | SSO/SAML, custom integrations, dedicated CSM, SLA, multi-department |

**Pricing rationale:**
- $25/athlete/year = $2.08/athlete/month — a rounding error in a D1 athletic department budget of $50M+
- At D2/D3 with 200 athletes: $4,000–$5,000/year — fits within a typical departmental software budget
- Significantly below Teamworks' enterprise pricing ($15K–$100K+/year) and well above zero-cost alternatives

### 7.2 Revenue Architecture

**Land:** Free pilot with a single sport (e.g., football, basketball, swimming)
**Expand:** Positive completion rates and counselor workflows earn trust → expand to full athletic department
**Retain:** Annual contracts with auto-renewal; audit trail data creates institutional stickiness
**Grow:** Conference-level deals; enterprise SSO/integration for large programs

### 7.3 Unit Economics

| Customer Tier | ACV | CAC | Payback | Est. LTV (4yr) | LTV:CAC |
|---|---|---|---|---|---|
| D2/D3 Program | $4,500 | $500–$800 | 1–2 months | $13,500 | 17–27x |
| D1 Program | $9,000 | $1,500–$2,500 | 2–4 months | $27,000–$36,000 | 11–24x |
| Enterprise (Conference) | $60,000+ | $5,000–$10,000 | 1–2 months | $180,000+ | 18–36x |

**Industry benchmarks for comparison:**
- EdTech SaaS median gross margin: 65–80% | Check-In target: 83–87%
- EdTech monthly churn average: 9.6% | Check-In target: <2% (annual institutional contracts)
- SaaS LTV:CAC best-in-class: >5:1 | Check-In target: 11–27x across tiers
- CAC payback best-in-class: <6 months | Check-In achieves 1–4 months

### 7.4 Revenue Scenarios

**Base Case (Year 3):** 120 programs × 225 athletes × $25 = **$675K ARR**
**Bull Case (Year 3):** 2 conference deals + 60 direct programs = **$1.8M ARR**
**Bear Case (Year 3):** 60 programs, slower conversion = **$337K ARR**

### 7.5 Path to Profitability

| | Year 1 | Year 2 | Year 3 | Year 4 |
|---|---|---|---|---|
| ARR | $50K | $250K | $750K | $2.0M |
| Gross Margin | 80% | 84% | 86% | 87% |
| Gross Profit | $40K | $210K | $645K | $1.74M |
| Headcount | 2 | 5 | 8 | 13 |
| OpEx | $220K | $550K | $900K | $1.4M |
| EBITDA | ($180K) | ($340K) | ($255K) | **$340K** |
| Cumulative Burn | ($180K) | ($520K) | ($775K) | — |

**Operating cash flow positive at ~$3–4M ARR** — achievable in Year 4 with strong conference deal conversion.

---

## 8. Go-to-Market Strategy

### 8.1 GTM Philosophy

Check-In is not a horizontal SaaS product. It is a **vertical-specific trust product** sold into risk-averse institutions with long procurement cycles and high compliance standards. The GTM strategy reflects that reality:

- **Reduce friction at every entry point** (free pilot, no credit card, 2-minute check-in)
- **Build trust before asking for money** (clinical credibility, compliance documentation, outcome data)
- **Land and expand within institutions** (one sport → full department)
- **Use institutional relationships to reach adjacent institutions** (AD networks, conference relationships)

### 8.2 Phase 1 — Founder-Led Sales (Months 1–12)

**Target:** 10–20 D1 and D2 programs through direct outreach
**Method:**
- Personal outreach to athletic directors and directors of sports psychology
- Presence at AASP Annual Conference (Association for Applied Sport Psychology)
- NCAA Convention (January) — the highest-density gathering of athletic administrators
- NACDA conference (June) — national AD network
- LinkedIn direct outreach to licensed sports psychologists at target programs

**Pilot Structure:**
- One sport per program (typically the highest-risk sport: football, wrestling, swimming/diving)
- 30-day free trial with full support
- Weekly completion rate as the leading indicator
- Case study development begins immediately with early adopters

**Sales Narrative:**
Two angles work, depending on the audience:

For **athletic directors and compliance officers** — lead with liability: *"How do you document that you're providing ongoing monitoring? What happens if an athlete has a crisis and your records show an annual screening from August?"*

For **team psychiatrists and counselors** — lead with the access problem they live with every day: *"The athletes who most need you are the least likely to walk through your door. Check-In gives you a weekly read on every athlete in your program — and when someone's numbers warrant it, you reach out. They never had to ask. You already knew."* Clinicians who have watched struggling athletes disappear into a season recognize this problem immediately and viscerally.

### 8.3 Phase 2 — Conference-Level Deals (Months 12–24)

**Target:** Mid-major conferences (MAC, Big Sky, SWAC, NAIA conferences)
**Method:**
- Leverage D1 pilot customers to make introductions to conference commissioners
- Propose conference-wide licensing: $50–$75/athlete/year for all member institutions
- Position Check-In as a shared compliance infrastructure, like the NCAA's shared use of Teamworks for NIL

**Economics of a Conference Deal:**
- MAC Conference: 12 member schools × ~250 athletes avg × $60 = **$180,000/year**
- Single deal = 2–3x Year 1 ARR

### 8.4 Phase 3 — Segment Expansion (Months 24–36)

**D2/D3 Self-Serve:**
- Simplified onboarding, lower price point ($15–$20/athlete/year)
- Product-led growth: AD hears about it from a peer; signs up online; no sales call required

**High School Expansion:**
- Target state high school activities associations (e.g., OHSAA, IHSA, MSHSL)
- Association endorsement unlocks hundreds of member schools simultaneously
- This is the DragonFly Athletics playbook applied to wellness — and it works

**NAIA/NJCAA:**
- Lower price points ($10–$15/athlete/year)
- Strong product-market fit: these programs often lack clinical staff → Check-In's follow-up routing helps them with limited internal resources

### 8.5 Distribution Channels

| Channel | Description | Estimated CAC |
|---|---|---|
| **Direct outbound** | Founder-led email + LinkedIn outreach to ADs and sports psychs | $500–$1,500 |
| **Conference referral** | Existing customer makes warm AD introduction | $100–$300 |
| **Conference deal** | Enterprise BD to sign entire conference at once | $2,000–$5,000 per institution (amortized) |
| **State association partnership** | Association endorses/mandates — scales to hundreds of schools | $50–$100 per school (amortized) |
| **Content marketing** | FERPA compliance guides, NCAA wellness whitepapers, research summaries | Longer-tail, CAC unclear |

### 8.6 Marketing Strategy

**Thought Leadership Content:**
- "The Hidden Cost of Annual Screenings" — whitepaper with NCAA data
- "How FERPA Applies to Athletic Wellness Data" — compliance guide for ADs
- Research partnerships with university sports psychology departments → published outcome data

**Earned Media:**
- Athlete mental health is a major ongoing media story. Check-In's privacy architecture and data are pitchable to outlets covering the space: Sports Business Journal, Athletic Director U, NCAA News, Inside Higher Ed

**Conference Presence:**
- AASP Annual Conference (October)
- NCAA Convention (January)
- NACDA Convention (June)
- NIAAA Convention (December)

---

## 9. Technology & Architecture

### 9.1 Current Stack

| Layer | Technology | Rationale |
|---|---|---|
| **iOS App (primary)** | Capacitor 8 + native iOS shell | App Store distribution; native push notifications, haptics, splash screen, status bar, keyboard handling; bundle ID `com.athleteanchor.checkin` |
| **Android App** | Capacitor 8 + Android shell | Same codebase as iOS; Google Play distribution |
| **App UI** | Next.js 14 (static export), React 18, TypeScript | Compiled to static bundle loaded by Capacitor; not served from a web server on device |
| **Styling** | Tailwind CSS, shadcn/ui | Rapid iteration, consistent design system |
| **API / Backend** | Next.js API routes (Vercel) | Server-side logic, cron jobs, email dispatch; the app calls the hosted API |
| **Database** | Supabase (PostgreSQL) | Row-Level Security enforces privacy tier architecture at database layer |
| **Auth** | Supabase Auth | JWT-based, SSO-ready |
| **Email** | Resend | Transactional; zero wellness data in email payloads |
| **Hosting** | Vercel | Edge functions, global CDN, built-in cron jobs for weekly reminders |
| **Encryption** | AES-256 at rest, TLS 1.2+ in transit | Industry standard; required for FERPA compliance |

### 9.2 Architecture Advantages

**Native iOS Experience (Primary Channel):**
The athlete-facing product is a native iOS app distributed through the App Store. Capacitor provides native system integrations — push notifications, haptics, splash screen, safe-area handling, and keyboard management — that a browser-based tool cannot match. The familiar App Store install flow lowers friction for athletes and satisfies university IT security policies that often block or flag browser-installed PWAs.

**Privacy-by-Architecture (not policy):**
PostgreSQL Row-Level Security policies are attached directly to tables. The database rejects unauthorized queries regardless of how they arrive. A compromised API route, a misconfigured permission, or a direct database connection cannot bypass RLS policies. This is verifiable, auditable, and documentable — exactly what a compliance-conscious buyer needs.

**Zero-Trust Email Design:**
Notification emails contain no athlete data — only a link requiring authenticated app or web access to view. This eliminates an entire class of FERPA compliance risk that afflicts every competitor using email for alert content.

**Native Push Notifications:**
Weekly reminders are delivered as native iOS/Android push notifications — not emails, not SMS. Delivery rates and open rates for native push far exceed email for the 18–22 age cohort. Notification timing respects organizational schedule settings and individual athlete opt-out preferences.

**Automated Cron Reminders:**
Vercel cron jobs trigger the weekly reminder pipeline at configurable times. Athletes who opt out of push notifications are excluded automatically.

### 9.3 Scalability

The current infrastructure stack (Supabase + Vercel) can support:
- 100,000+ athletes with no architectural changes
- <100ms response times globally via Vercel Edge
- Postgres RLS scales linearly with database size — no performance cliff

**Infrastructure cost at scale:**
- 10,000 athletes: ~$150–$200/month
- 100,000 athletes: ~$800–$1,200/month
- Gross margin stays above 85% at any realistic scale

### 9.4 Enterprise Readiness Roadmap

| Feature | Timeline | Requirement Trigger |
|---|---|---|
| App Store public release (iOS) | Month 1–3 | Primary distribution channel; TestFlight already available |
| Google Play public release (Android) | Month 3–6 | Secondary distribution; same Capacitor codebase |
| SSO/SAML integration | Month 6 | First enterprise inquiry |
| SOC 2 Type II certification | Month 9–12 | Required by most university IT security reviews |
| PowerSchool / Infinite Campus API | Month 12–18 | High school expansion |
| Custom data retention policies | Month 6 | State law requirements |
| Advanced analytics dashboard | Month 9 | AD request during pilots |

---

## 10. Compliance & Regulatory Framework

### 10.1 FERPA (Family Educational Rights and Privacy Act)

Attendance and wellness records of student-athletes at FERPA-covered institutions are protected education records. Check-In operates as a **school official** under 34 CFR §99.31(a)(1), providing services under the direct control of the institution, limited to the purposes for which the data was disclosed.

**Implementation:**
- Data Processing Agreements (DPAs) executed with every school and university customer before any data is collected
- Institution retains status as data controller; Athlete Anchor acts as data processor
- Students 18+ have direct FERPA rights; athletes below 18 (rare in collegiate context) require parental consent
- Right to inspect and correct records honored through the athlete's data export and deletion tools

### 10.2 COPPA (Children's Online Privacy Protection Act)

COPPA applies if any user is under 13. In collegiate athletics, this is extremely rare. For high school expansion, Check-In will implement:
- School-as-agent authorization model (school provides parental consent on behalf of enrolled students)
- No advertising, profiling, or third-party data sharing of student records
- Verifiable age gate at registration

### 10.3 State Privacy Laws

Forty-plus states have enacted student data privacy legislation. The most demanding:

| State | Law | Key Requirement |
|---|---|---|
| **California** | SOPIPA | No commercializing student data; no targeted advertising |
| **Illinois** | SOPPA | Vendor registration with ISBE; direct vendor liability |
| **New York** | Ed. Law §2-d | Mandatory DPA; strict data security standards |
| **Colorado** | HB19-1032 | Public disclosure of vendor data-sharing agreements |

**Check-In's approach:** Execute state-specific DPAs proactively. Maintain a vendor registration in all states that require it. Data stored exclusively in U.S.-based infrastructure. Zero third-party data sharing or monetization.

### 10.4 NCAA Compliance

NCAA Bylaw 17 governs practice hour limits — documented attendance is part of compliance evidence. Check-In's audit logs provide verifiable, timestamped records of athlete engagement and staff follow-up that satisfy documentation requirements.

The House v. NCAA revenue-sharing settlement (effective 2025) is driving increased demand for athlete activity documentation at all NCAA levels. Check-In's reporting infrastructure is directly applicable to this emerging compliance requirement.

### 10.5 HIPAA Considerations

Check-In is not a covered entity and does not process protected health information (PHI) as defined by HIPAA. Mental wellness survey responses are educational records under FERPA, not medical records under HIPAA. However:
- Check-In implements HIPAA-equivalent security controls (AES-256, audit logging, minimum necessary access)
- Sub-processors (Supabase) maintain appropriate security certifications
- Check-In does not share any data with health insurance companies or billing systems

### 10.6 Apple App Store & Google Play Compliance

As a native iOS app handling sensitive personal health-adjacent data, Check-In must satisfy:

- **Apple App Store Review Guidelines §5.1 (Privacy):** Requires a clearly disclosed privacy policy, no data collection beyond what is necessary, and explicit user consent for any data sharing. Check-In's in-app privacy controls and athlete data export/deletion tools directly satisfy these requirements.
- **Apple's App Tracking Transparency (ATT):** Check-In does not use cross-app tracking; no ATT prompt is required.
- **App Store age rating:** The app must be rated appropriately; mental health content may require a 12+ or 17+ rating depending on Apple review — this should be determined during App Store submission.
- **Google Play Data Safety section:** Requires disclosure of all data collected, data sharing practices, and security measures. Check-In's FERPA-aligned data handling and encryption satisfy these requirements.

### 10.7 SOC 2 Type II

SOC 2 Type II certification is the de facto security standard required by university IT security review processes. It is the difference between "we'd like to pilot this" and "we can sign a multi-year contract."

**Timeline:** Begin SOC 2 Type I preparation at Month 3; complete Type I at Month 9; complete Type II audit at Month 18. Cost estimate: $15,000–$40,000 (audit fees) + engineering time.

### 10.7 Compliance as Competitive Advantage

Most small competitors in this space have no formal compliance program. They rely on verbal assurances and generic privacy policies. Check-In wins security reviews by being the documented, certified, verifiable choice — especially important for state universities with formal IT security procurement requirements.

---

## 11. Financial Projections

### 11.1 Revenue Model Assumptions

- **Pilot-to-paid conversion:** 40% (industry benchmark for institutional SaaS with strong product-market fit)
- **Annual net revenue retention:** 120% (seat expansion as more teams adopt within programs)
- **Average athlete count per program:** Grows from 200 (Year 1) to 250 (Year 3) as more sports adopt
- **Price per athlete/year:** $25 (blended; D1 higher, D2/D3 lower)
- **Churn:** 8% annually (below EdTech average of 9.6% monthly — institutional annual contracts are structurally stickier)

### 11.2 Revenue Build

| | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|---|---|---|---|---|---|
| New programs (pilots) | 20 | 40 | 80 | 100 | 100 |
| Pilot-to-paid (40%) | 8 | 16 | 32 | 40 | 40 |
| Churned programs | 0 | 1 | 5 | 8 | 10 |
| **Total paying programs** | **8** | **23** | **50** | **82** | **112** |
| Avg athletes/program | 200 | 215 | 225 | 240 | 250 |
| Avg price/athlete/yr | $25 | $25 | $25 | $27 | $28 |
| **ARR (end of year)** | **$40K** | **$124K** | **$281K** | **$531K** | **$784K** |
| Conference deals (ARR) | — | $120K | $360K | $720K | $1.2M |
| **Total ARR** | **$40K** | **$244K** | **$641K** | **$1.25M** | **$1.98M** |

*Note: Conference deal ARR begins Year 2; assumes 1 conference/year at $120K average.*

### 11.3 Expense Build

| | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|---|---|---|---|---|---|
| **Headcount** | 2 | 5 | 8 | 13 | 18 |
| Salaries & benefits | $160K | $420K | $720K | $1.19M | $1.65M |
| Infrastructure (Vercel/Supabase) | $3K | $8K | $18K | $35K | $55K |
| SOC 2 + legal + compliance | $25K | $45K | $30K | $35K | $40K |
| Sales & marketing | $15K | $55K | $100K | $175K | $250K |
| G&A | $20K | $40K | $55K | $80K | $110K |
| **Total OpEx** | **$223K** | **$568K** | **$923K** | **$1.52M** | **$2.11M** |

### 11.4 P&L Summary

| | Year 1 | Year 2 | Year 3 | Year 4 | Year 5 |
|---|---|---|---|---|---|
| ARR | $40K | $244K | $641K | $1.25M | $1.98M |
| Gross Margin | 80% | 84% | 86% | 87% | 88% |
| Gross Profit | $32K | $205K | $551K | $1.09M | $1.74M |
| Total OpEx | $223K | $568K | $923K | $1.52M | $2.11M |
| **EBITDA** | **($191K)** | **($363K)** | **($372K)** | **($430K)** | **($370K)** |
| **Cumulative Burn** | **$191K** | **$554K** | **$926K** | **$1.36M** | **$1.73M** |

*Cash flow positive target: Year 5–6 at ~$3.5M ARR, with conference deal acceleration.*

### 11.5 Key SaaS Health Metrics (Year 3 Target)

| Metric | Target | Industry Benchmark |
|---|---|---|
| Gross Margin | 86% | 70–80% SaaS median |
| NRR (Net Revenue Retention) | 120% | 100–120% B2B SaaS |
| LTV:CAC | 15:1 | >3:1 minimum; >5:1 good |
| CAC Payback | 3–4 months | <12 months good |
| Weekly athlete completion rate | >70% | No benchmark (novel metric) |
| Pilot-to-paid conversion | 40% | 20–30% institutional SaaS |
| Annual churn (programs) | <8% | 9.6% EdTech median |

---

## 12. Team & Organizational Plan

### 12.1 Founding Team Requirements

Check-In sits at the intersection of clinical psychology, enterprise SaaS, and institutional compliance. The founding team must cover all three.

| Role | Responsibility | Hire Timing |
|---|---|---|
| **Founder/CEO** | Sales, fundraising, product strategy, partnerships | Now |
| **Full-stack Engineer** | Product development, infrastructure, security | Now |
| **Clinical Advisor (part-time)** | Risk scoring validation, workflow design, compliance language | Month 1–2 |

### 12.2 Year 1–2 Hires (Post First Revenue)

| Role | Responsibility | Timing |
|---|---|---|
| **Customer Success Manager** | Pilot onboarding, training, completion rate optimization, retention | Month 6 |
| **Second Engineer** | Feature velocity, mobile, integrations | Month 9 |
| **Compliance / Legal Counsel** | SOC 2 audit, DPA management, state registrations | Month 9 |
| **Sales Development Rep** | Outbound pipeline for D2/D3 programs | Month 12 |

### 12.3 Year 3+ Organizational Structure

**Revenue:** CEO + 2 AEs + 2 SDRs + 1 BD (conference deals)
**Product & Engineering:** CTO + 4 engineers
**Customer Success:** VP CS + 3 CSMs
**Compliance:** General Counsel + 1 compliance analyst
**G&A:** CFO (fractional through Year 3), Office Manager

### 12.4 Advisors (Target Profiles)

- **Former D1 Athletic Director** — institutional credibility and AD network
- **Licensed Sports Psychologist (PhD)** — clinical advisory board for risk scoring
- **EdTech SaaS Operator** — GTM playbook, enterprise sales experience
- **Data Privacy Attorney** — FERPA, COPPA, SOC 2 expertise
- **Former NCAA Administrator** — compliance and policy navigation

---

## 13. Funding Strategy

### 13.1 Pre-Seed Round ($400K–$600K)

**Use of funds:**
- Fund operations for 18 months: salaries for 2 FTEs + fractional clinical advisor
- Execute 10–20 free pilots
- Close 5+ paying programs
- Initiate SOC 2 Type I process
- Legal infrastructure: DPA templates, data processing agreements, entity formation

**Target investors:**
- Angels with athletic department or sports psychology backgrounds
- Former NCAA administrators turned investors
- Small pre-seed funds with EdTech or sports tech thesis (Reach Capital, Owl Ventures pre-seed programs)
- Family offices with university/athletics board connections

**Fundraising trigger:** Product live, 2+ pilots running, initial completion rate data

### 13.2 Seed Round ($1.5M–$2.5M)

**Trigger conditions:**
- 10+ paying programs
- >70% weekly athlete completion rate demonstrated
- At least 1 conference-level deal in pipeline
- SOC 2 Type I complete

**Use of funds:**
- Grow to 5 FTEs: hire CSM, second engineer, compliance counsel
- Complete SOC 2 Type II
- Execute 40+ pilots, convert to 40 paying programs
- Sign first conference deal

**Target investors:**
- Reach Capital, Owl Ventures, Rethink Education (EdTech specialist funds)
- Courtside Ventures, Excel Sports Management (sports tech funds)
- Strategic angels: current athletic department technology buyers, sports psychology practice owners

**Valuation framing:** $6–10M pre-money (10–15x ARR on $250K+ ARR at seed)

### 13.3 Series A ($5M–$8M)

**Trigger conditions:**
- 50+ paying programs
- $750K+ ARR with 120%+ NRR
- SOC 2 Type II certified
- 2+ conference deals signed
- Clear path to $5M ARR

**Strategic use:**
- Scale enterprise sales team
- High school market entry
- PowerSchool and SIS integration
- National conference deal pipeline

### 13.4 Exit / M&A Landscape

The sports management software market is actively consolidating:
- **SportsEngine** sold to PlayMetrics (Genstar-backed PE) in 2026 for ~$150M (~1–2x revenue at peak)
- **Stack Sports** acquired Demosphere in February 2025
- **SwipedOn** acquired by Proxyclick in 2023
- **Teamworks** raised significant capital and is the dominant D1 platform

**Strategic acquirers for Check-In at $5–10M ARR:**
- Teamworks (adjacent market, non-overlapping — they have D1 ops; Check-In has wellness and D2/D3)
- PlayMetrics / SportsEngine (complementary product layer)
- A large EdTech platform expanding into athletics (PowerSchool, Instructure)
- Healthcare / wellness companies entering the institutional sports market

**Comparable transaction multiples:**
- SportsEngine: ~1–2x revenue (at PE valuation)
- Teamworks: Estimated 8–12x ARR (growth-stage SaaS)
- EdTech SaaS M&A: 4–8x ARR for defensible vertical SaaS with strong NRR

**At $5M ARR with strong retention, a $25–40M exit is achievable. At $15M ARR, a $75–120M outcome is within range.**

---

## 14. Risk Analysis

### 14.1 Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Low athlete completion rates** | Medium | High | ~3-minute check-in; native iOS/Android push notifications; rotating question bank keeps check-ins fresh; coach visibility into completion (not data) creates accountability without compromising privacy |
| **Long institutional sales cycles** | High | Medium | Free pilot removes friction; one-team land removes procurement complexity; pilot conversion funded by pre-seed |
| **Liability if athlete crisis is missed** | Low | Very High | Platform is monitoring and routing tool, not clinical replacement. Terms require institutions to maintain independent clinical staff. Mandatory reporter guidance built in. Audit trail demonstrates institutional due diligence. |
| **FERPA / compliance challenge** | Low | High | Privacy enforced at database layer. SOC 2 certification. DPAs with every customer. Institutional data processing agreements. |
| **Competitor enters the space** | Medium | High | 18–24 month first-mover window. Conference deals and institutional relationships create switching costs before well-funded entrant arrives. Privacy architecture is not a feature — it is foundational infrastructure. |
| **EdTech budget constraints** | High | Medium | Annual program budgets for athlete welfare software ($5K–$50K) are not primary austerity targets. Compliance-driven demand is not discretionary. |
| **Founder single-point-of-failure** | Medium | High | Second engineer hire by Month 9; documentation of all systems and processes; succession plan in investor agreements |
| **Key employee departure** | Medium | Medium | Equity vesting (4yr/1yr cliff); competitive comp; mission-driven culture attracts retained talent |

### 14.2 Scenario Analysis

**Downside Scenario:** Pilot conversion at 20% (half of target); no conference deal in Year 2
- Year 3 ARR: ~$200K
- Runway extends to 24 months with pre-seed + seed (raises must be larger)
- Path: Focus on D2/D3 self-serve to reduce CAC; defer conference strategy

**Base Scenario:** 40% pilot conversion; 1 conference deal/year starting Year 2
- Year 3 ARR: ~$640K
- Seed raises at Year 1 close; Series A at end of Year 3
- Path: As modeled above

**Upside Scenario:** 50% conversion; 2 conference deals/year; state association deal in Year 3
- Year 3 ARR: $1.5M+
- Raises earlier and at higher valuations
- Path: Accelerate hiring; begin Series A conversations at Year 2

---

## 15. Appendix

### A. NCAA Mental Health Mandate Timeline

- **2016:** NCAA releases first Sport Science Institute mental health best practices document
- **2019:** NCAA publishes "Mind, Body and Sport" — comprehensive mental health guide
- **2020:** COVID amplifies student-athlete mental health crisis; NCAA response accelerates
- **2022:** NCAA Mental Health Best Practices updated; ongoing monitoring explicitly recommended
- **2023:** Multiple high-profile athlete tragedies increase institutional urgency and liability awareness
- **2025:** House v. NCAA settlement creates new athlete documentation requirements

### B. Risk Scoring Methodology (Technical Summary)

The risk engine (`src/utils/risk-scoring.ts`) uses a priority-ordered decision tree, not a continuous scale.

**Step 1 — Short-circuit override:**
- Athlete grants outreach consent → **RED** (terminates immediately, no score calculation)

**Step 2 — Core threshold flags (weight 1.0 each):**
| Factor | Risk flag condition |
|---|---|
| Mood | ≤ 3 |
| Stress | ≥ 8 (inverted — high stress is high risk) |
| Sleep | ≤ 3 |
| Support | ≤ 3 |

**Step 3 — Life dimension flags (weight 0.5 each, only if answered):**
- Family, social, spiritual, academic, athletic confidence — each flags if ≤ 3

**Step 4 — Composite score calculation:**
`compositeScore = coreFlags + (lifeFlags × 0.5)`

**Step 5 — Level assignment:**
- Score ≥ 3.0 → 🔴 RED (immediate alert to clinical staff + admin)
- Score ≥ 1.5 → 🟡 YELLOW (flagged for counselor review)
- Score < 1.5 → 🟢 GREEN (monitored, no alert)

**Additional crisis trigger:**
- Any pillar score < 3 on completion → automatic display of 988, 741741, and 911 crisis resources to the athlete (independent of the institutional alert system)

**Clinical validation:** Methodology reviewed and approved by licensed sports psychologists. Weightings are subject to ongoing validation against follow-up outcomes.

### C. Competitive Pricing Reference

| Competitor | Pricing Model | Entry Price |
|---|---|---|
| TeamSnap | Per team/month | $9.99/team/month |
| SportsEngine (PlayMetrics) | Per org/month | $79+/month |
| Teamworks | Enterprise/year | $15K–$100K+/year |
| FinalForms | Per school/year | ~$500–$2,000/school |
| BigTeams | Per school/year | ~$1,000–$5,000/school |
| OneTap Check-In | Per org/month | $19.99/month |
| Mindbody | Per location/month | $99+/month |
| **Check-In** | **Per athlete/year** | **$20–$30/athlete/year** |

### D. Key Market Data Sources

- Sports Management Software Market: Market Research Future, Mordor Intelligence, Coherent Market Insights, Verified Market Research (2024–2025)
- Student Attendance Tracking Software: Verified Market Research (2024)
- Youth Sports Market: PR Newswire / U.S. Census data — $15.5B U.S. market
- EdTech VC Funding: HolonIQ (2024, Q1 2025)
- SportsEngine/PlayMetrics acquisition: Sports Video Group, SwimSwam (May 2026)
- TeamSnap revenue and funding: Growjo, Waud Capital press release
- SaaS Unit Economics: SaaS Capital, We Are Founders (2025–2026 benchmarks)
- NCAA athlete mental health data: NCAA Sport Science Institute publications
- EdTech churn benchmarks: We Are Founders SaaS Churn Rate Report 2026

### E. Glossary

| Term | Definition |
|---|---|
| **ACV** | Annual Contract Value — total revenue from a single customer in one year |
| **ARR** | Annual Recurring Revenue — total predictable annual revenue across all customers |
| **CAC** | Customer Acquisition Cost — fully loaded cost to acquire one paying customer |
| **DPA** | Data Processing Agreement — required contract between institution and vendor for FERPA compliance |
| **FERPA** | Family Educational Rights and Privacy Act — U.S. law governing student education records |
| **LTV** | Lifetime Value — total expected revenue from a customer over their relationship with the company |
| **NRR** | Net Revenue Retention — revenue retained from existing customers after churn and expansion |
| **RLS** | Row-Level Security — PostgreSQL feature enforcing data access policies at the database layer |
| **Capacitor** | Framework that wraps a web UI into a native iOS/Android app shell, enabling App Store distribution and access to native device APIs |
| **SOC 2** | Service Organization Control 2 — security compliance certification required by enterprise buyers |

---

*This document is confidential and intended solely for potential investors, advisors, and authorized partners of Athlete Anchor, Inc. All market data sourced from third-party research firms and verified against multiple sources. Financial projections are forward-looking estimates subject to material risks and uncertainties described herein.*

*Prepared: June 2026 | Version 3.0*
