# Security Overview — Check-In by Athlete Anchor

*Prepared for IT Security Review*
*Last updated: May 2026 | Contact: szmuelsmith@gmail.com*

---

## Platform Summary

Check-In is a web-based athlete wellness platform. Athletes submit brief daily check-ins via mobile browser. Coaches and administrators view anonymized, aggregated wellness trends. No app download required.

---

## Infrastructure

| Component | Provider | Region | Notes |
|-----------|---------|--------|-------|
| Database | Supabase (PostgreSQL on AWS) | us-east-1 (N. Virginia) | SOC 2 Type II |
| Application hosting | Vercel | US (Edge Network) | SOC 2 Type II |
| Authentication | Supabase Auth | us-east-1 | Email magic link, no passwords |
| Email delivery | Resend | US | Transactional only |

**All data remains in the United States.** No international data transfers.

---

## Data Residency

Student athlete data never leaves US-based infrastructure. Database and backups are stored exclusively in AWS us-east-1. Vercel serves application code only — no student data is cached at the edge.

---

## Encryption

- **At rest:** AES-256 (managed by Supabase / AWS RDS)
- **In transit:** TLS 1.2 minimum for all connections (browser ↔ Vercel, Vercel ↔ Supabase)
- **Backups:** Encrypted with the same AES-256 standard

---

## Authentication

Check-In uses **passwordless magic link authentication**. Athletes and staff receive a one-time login link via email. There are no passwords to steal or reset. Sessions expire automatically.

Multi-factor authentication is available for administrator accounts.

---

## Access Control — Row Level Security

Every database query is scoped to the requesting user's organization. An athlete at School A cannot access any data from School B — not through the UI and not through the API. This is enforced at the database layer (PostgreSQL Row Level Security), not just the application layer.

Coaches see only aggregated, anonymized wellness averages for their team. Individual athlete responses are never surfaced to coaches unless the athlete explicitly flags a wellness alert.

---

## Subprocessors

| Vendor | Purpose | Security Documentation |
|--------|---------|----------------------|
| Supabase | Database, auth, storage | supabase.com/security |
| Vercel | Application hosting | vercel.com/security |
| Resend | Transactional email | resend.com/security |

We do not use advertising networks, analytics trackers, or any vendor that processes student data for commercial purposes.

---

## No Third-Party Data Sharing

Student athlete data is never sold, licensed, shared, or disclosed to any third party. Data is used exclusively to deliver the Check-In service to the contracting institution.

---

## Breach Notification

In the event of a confirmed or suspected breach:

1. The institution is notified within **72 hours** by email and phone
2. A written incident report is provided within 5 business days
3. Affected individuals are notified as directed by the institution
4. Full cooperation with institution IT security and legal teams

This process is consistent with FERPA breach notification requirements.

---

## Vulnerability Management

- Dependencies are monitored and updated on a rolling basis
- Authentication tokens rotate on each session
- Database credentials are never exposed in client-side code
- All API routes require server-side session validation

---

## Compliance

- **FERPA:** Athlete Anchor operates as a "school official" data processor under FERPA. Full DPA available on request.
- **Data residency:** US only
- **Subprocessor SOC 2:** Supabase and Vercel both maintain SOC 2 Type II certifications. Documentation available on request.

---

*Questions? Contact Samuel Smith directly at szmuelsmith@gmail.com. We will respond to IT security review questions within one business day.*
