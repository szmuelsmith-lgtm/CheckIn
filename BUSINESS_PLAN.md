# Check-In by Athlete Anchor — Business Plan

## Executive Summary

Check-In is a privacy-first weekly wellness monitoring platform for college and university athletic programs. Athletes complete a 2-minute weekly check-in covering mood, stress, sleep, and support. The system automatically scores risk, routes alerts to licensed counselors, and gives coaches aggregate-only visibility — ensuring athletes trust the system enough to actually use it.

The product fills a critical gap: NCAA recommends ongoing mental health monitoring, but most programs still rely on a single annual screening. Check-In replaces that with weekly signal, structured follow-up workflows, and compliance documentation — all built on a three-tier privacy model enforced at the database layer.

**Target market:** ~500 NCAA Division I programs, ~1,100 D-II/D-III programs, plus NAIA and junior colleges.

**Revenue model:** Per-athlete SaaS subscription with a free 30-day pilot per team.

---

## Problem

1. **Annual screenings miss everything between screenings.** A student-athlete's mental health can deteriorate rapidly during a season. A once-a-year questionnaire catches almost nothing.

2. **Athletes don't trust existing tools.** When athletes believe coaches can see their responses, they underreport. Completion rates and honesty both drop.

3. **Staff lack structured follow-up workflows.** Even when a concern is flagged, there's no system to assign, track, and document the follow-up. People fall through the cracks.

4. **Compliance is manual and fragile.** Programs piece together spreadsheets, emails, and paper forms to demonstrate NCAA compliance. Audit trails are incomplete or nonexistent.

5. **Email and communication leak private data.** Many programs discuss athlete wellness over email, creating FERPA exposure and eroding athlete trust.

---

## Solution

### Three-Tier Privacy Model (Database-Enforced)

| Tier | Visible To | Data |
|------|-----------|------|
| **Private** | Athlete only | Journals, free-text notes, faith/family preferences |
| **Support** | Licensed counselors + admin | Flagged responses, alert details, crisis indicators |
| **Coach** | Team coach | Completion rates, risk color (green/yellow/red), team aggregates |

Privacy is enforced via PostgreSQL Row-Level Security — coaches cannot access support-tier data even by bypassing the UI.

### Weekly Check-In (2 Minutes)

- Core questions: mood, stress, sleep, support (1-10 scale)
- Optional life dimensions: family, social, spiritual, academic, athletic confidence
- Optional follow-up request (immediate RED escalation)
- Private notes field (athlete-only, never shared)
- Delivered as a PWA — installs like a native app, works offline

### Automatic Risk Scoring

Priority-ordered decision tree:
1. Follow-up requested -> RED (immediate)
2. Composite score from core factors (weight 1.0) + life dimensions (weight 0.5)
3. Score >= 3 -> RED | >= 1.5 -> YELLOW | < 1.5 -> GREEN

RED alerts trigger instant email notifications to all support staff and admins in the athlete's organization. Emails contain zero wellness data — only a link to the authenticated platform.

### Structured Follow-Up Workflows

- Alerts are system-generated, not manual
- Support staff acknowledge, assign, and resolve alerts
- Follow-up tasks track assignee, reason, due date, and completion
- Every action is audit-logged for compliance

---

## User Roles

### Athlete
- Complete weekly check-ins
- Maintain private journal
- Control privacy preferences (faith, family, peer support, reminder opt-out)
- View personal trends and risk status
- Request follow-up support
- Export or delete personal data

### Coach
- View team completion rates and aggregate risk distribution
- See per-athlete check-in status and risk color (no detail)
- Manage assigned follow-up tasks
- Cannot access individual scores, journals, notes, or alert details

### Support Staff (Licensed Counselors)
- Receive and manage support-tier alerts
- Access detailed check-in data for at-risk athletes
- Create and assign follow-up tasks
- View alert history and trigger types

### Admin
- Manage institutional settings and user provisioning
- Create invite codes for team onboarding
- Access audit logs for compliance reviews
- Manage institutional resource library
- Full organizational oversight

---

## Market

### Primary: NCAA Division I Athletic Programs
- ~500 programs
- ~350 student-athletes per program (avg)
- ~175,000 total athletes
- High compliance pressure, established budgets for athlete welfare
- Sports psychology staff already on payroll

### Secondary: NCAA Division II & III
- ~1,100 programs
- Smaller rosters, tighter budgets, but growing NCAA wellness mandates
- Often lack dedicated sports psych staff — Check-In fills the gap

### Tertiary: NAIA, Junior Colleges, High School Athletics
- ~2,000+ additional programs
- Regulatory pressure increasing, especially around concussion and mental health protocols

### Market Size Estimate

| Segment | Programs | Avg Athletes | Price/Athlete/Year | TAM |
|---------|----------|-------------|-------------------|-----|
| D-I | 500 | 350 | $30 | $5.25M |
| D-II/III | 1,100 | 200 | $20 | $4.4M |
| NAIA/JuCo | 2,000 | 150 | $15 | $4.5M |
| **Total** | | | | **~$14M** |

This is a focused, defensible niche with expansion potential into professional sports, military, and corporate wellness.

---

## Business Model

### Pricing Structure

**Per-athlete, per-year SaaS subscription.**

| Plan | Price | Includes |
|------|-------|----------|
| **Pilot** | Free (30 days, 1 team) | Full platform access, up to 50 athletes |
| **Program** | $20-30/athlete/year | Unlimited teams, all roles, email notifications, audit logs |
| **Enterprise** | Custom | SSO/SAML, custom integrations, dedicated support, SLA |

### Revenue Drivers
- Land with one team via free pilot, expand to full athletic department
- Annual contracts with auto-renewal
- Enterprise upsell for Power 5 conferences and athletic departments with 500+ athletes

### Unit Economics (Target)

| Metric | Target |
|--------|--------|
| Pilot-to-paid conversion | 40% |
| Annual contract value (D-I) | $7,000-10,000 |
| Gross margin | 85%+ (infrastructure costs are minimal) |
| CAC payback | < 6 months |
| Net revenue retention | 120%+ (seat expansion as more teams adopt) |

---

## Go-to-Market Strategy

### Phase 1: Founder-Led Sales (Months 1-12)
- Target 10-20 D-I programs through direct outreach
- Leverage sports psychology conferences (AASP, NCAA Convention)
- Free pilots with one team per program — low friction entry
- Case studies and testimonials from early adopters

### Phase 2: Conference-Level Deals (Months 12-24)
- Pitch conference-wide adoption (e.g., entire SEC, Big Ten)
- Athletic director referral network
- Integration partnerships with existing athletic compliance platforms

### Phase 3: Expand Segments (Months 24-36)
- D-II/III with self-serve onboarding and lower price point
- NAIA and junior colleges
- High school athletics (state athletic association partnerships)

### Distribution Channels
- Direct sales to athletic directors and sports psychology staff
- Conference and association partnerships
- Content marketing: compliance guides, NCAA best practice whitepapers
- Referral incentives for existing customers

---

## Competitive Landscape

| Competitor | Weakness Check-In Exploits |
|-----------|--------------------------|
| Annual screenings (status quo) | Point-in-time only, no ongoing monitoring |
| Generic survey tools (Qualtrics, Google Forms) | No privacy tiers, no risk scoring, no follow-up workflows, no compliance |
| Athlete monitoring platforms (Teamworks, ARMS) | Focused on scheduling/compliance, not mental wellness |
| Mental health apps (Calm, Headspace) | Consumer-facing, no institutional oversight, no compliance |
| Custom internal tools | Expensive to build, no FERPA/NCAA compliance expertise |

### Defensibility
1. **Privacy architecture** — three-tier model enforced at database layer is hard to replicate as an afterthought
2. **Compliance depth** — FERPA, HIPAA-inspired, NCAA, SOC 2, Title IX, CCPA built in from day one
3. **Trust moat** — once athletes trust the system and have history, switching costs are high
4. **Institutional lock-in** — audit logs, compliance documentation, and workflows become institutional infrastructure

---

## Compliance Framework

Check-In is built compliance-first:

- **FERPA-aligned**: Institution is data controller; Athlete Anchor operates as school official
- **HIPAA-inspired controls**: Not HIPAA-covered, but implements equivalent safeguards
- **NCAA best practices**: Weekly monitoring, licensed staff routing, referral workflows, documentation
- **SOC 2 ready architecture**: Security, availability, and confidentiality controls
- **WCAG 2.1 Level AA**: Keyboard, screen reader, and mobile accessible
- **Title IX compliant**: Mandatory reporter protocols, disclosure guidance
- **State privacy laws**: CCPA/CPRA, SOPIPA, breach notification ready
- **CAN-SPAM compliant**: Opt-out mechanism on all emails
- **Zero data in emails**: Notification emails never contain athlete wellness information

---

## Technology

### Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: Supabase (PostgreSQL + Auth + RLS), Next.js API routes
- **Email**: Resend (transactional, privacy-safe)
- **Hosting**: Vercel (edge functions, cron jobs)
- **Security**: AES-256 at rest, TLS 1.2+ in transit, RLS enforcement, audit logging

### Architecture Advantages
- Server-side rendering for performance and SEO
- PWA support — installs like a native app, works offline
- Row-Level Security enforces privacy at database layer, not application layer
- Automated cron-based reminders (daily at 2 PM UTC, respects org schedule and athlete opt-out)
- Zero-trust email design — notifications contain no wellness data

---

## Team Requirements

### Immediate (Pre-Revenue)
- **Founder/CEO** — sales, product, fundraising
- **Full-stack engineer** — ship and iterate on core platform
- **Clinical advisor** (part-time) — validate risk scoring, workflow design, compliance

### Post-Pilot (10+ Paying Customers)
- **Customer success** — onboarding, training, retention
- **Second engineer** — scale, reliability, feature velocity
- **Compliance/legal** — SOC 2 audit, institutional contracts

### Growth (50+ Customers)
- **Sales team** — dedicated AEs for D-I programs
- **Marketing** — content, conferences, demand gen
- **Engineering team** — mobile app, integrations, analytics

---

## Financial Projections

| | Year 1 | Year 2 | Year 3 |
|---|--------|--------|--------|
| Paying programs | 10 | 40 | 120 |
| Avg athletes/program | 200 | 250 | 250 |
| Revenue/athlete | $25 | $25 | $25 |
| **ARR** | **$50K** | **$250K** | **$750K** |
| Gross margin | 80% | 85% | 87% |
| Headcount | 2 | 5 | 10 |
| Burn rate/month | $15K | $35K | $60K |

### Key Assumptions
- 40% pilot-to-paid conversion
- 90%+ annual retention (institutional contracts are sticky)
- 120% net revenue retention (team expansion within programs)
- Infrastructure costs stay low (Supabase + Vercel scale efficiently)

---

## Funding Strategy

### Pre-Seed ($250K-500K)
- Build MVP (done), run first 10 pilots, close first 5 paying customers
- Sources: angel investors in sports tech, NCAA-adjacent funds, pre-seed firms

### Seed ($1M-2M)
- Hire sales + engineering, reach 40+ paying programs
- SOC 2 Type II certification
- Conference-level deal pipeline

### Trigger for Seed: 10+ paying programs with >70% athlete weekly completion rate

---

## Key Metrics to Track

| Metric | Why It Matters |
|--------|---------------|
| Weekly athlete completion rate | Core engagement — target >70% |
| Pilot-to-paid conversion | Sales efficiency |
| Time-to-first-checkin (onboarding) | Activation speed |
| Alert-to-resolution time | Platform value delivery |
| Net revenue retention | Growth efficiency |
| Athlete trust score (survey) | Moat validation |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Low athlete adoption / completion | PWA install, 2-min check-in, reminder cron, coach visibility into completion rates (not data) |
| Liability if athlete crisis is missed | Platform is monitoring tool, not clinical replacement. Terms require institutions to maintain independent counseling. Mandatory reporter guidance built in. |
| FERPA/compliance challenge | Privacy enforced at database layer. Audit logs on every access. Institutional data processing agreement. |
| Competitor copies features | Privacy-at-database-layer is architectural, not a feature flag. Trust moat and compliance depth take years to replicate. |
| Long sales cycles (institutional) | Free pilot reduces friction. Land with one team, expand from within. |

---

## 12-Month Milestones

1. **Month 1-3**: Launch 10 free pilots with D-I programs
2. **Month 3-6**: Convert 4+ pilots to paid; achieve >70% weekly completion
3. **Month 6-9**: Reach 10 paying programs; begin SOC 2 Type II process
4. **Month 9-12**: Close first conference-level conversation; hit $50K ARR
