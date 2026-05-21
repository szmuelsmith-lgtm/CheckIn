# Athlete Anchor — Pilot Package

*Everything you need to get a university athletic program to say yes to a free pilot.*

---

## Documents

| # | File | What It Is | Status |
|---|------|-----------|--------|
| 01 | `01-pilot-agreement.md` | One-page pilot agreement, pre-signed | ⚠️ Lawyer review recommended |
| 02 | `02-ferpa-dpa.md` | FERPA Data Processing Agreement | ⚠️ Lawyer review recommended |
| 03 | `03-security-overview.md` | IT security one-pager for reviewers | Ready to use |
| 04 | `04-data-deletion-policy.md` | Deletion policy + SQL wipe script | Ready to use |
| 05 | `05-breach-notification-policy.md` | Breach policy + email template | Ready to use |
| 06 | `06-internal-sell-sheet.md` | One-pager champion shares with AD | Ready to use |
| 07 | `07-internal-email-templates.md` | 3 email versions for champion | Ready to use |
| 08 | `08-objection-faq.md` | FAQ for internal objections | Ready to use |
| 09 | `09-bulk-onboarding/` | CSV → bulk account creation script | Ready to use |
| 10 | `10-athlete-welcome-email.md` | Welcome email copy + first check-in flow | Ready to use |
| 11 | `11-demo-video-script.md` | 3-minute demo video script | Ready to use |

---

## Three Things a Real Lawyer Should Review Before Use

1. **Pilot Agreement — liability clause.** The $0 liability cap may not be enforceable in all states. A nominal cap (e.g., $100) is more defensible.
2. **Pilot Agreement — governing law.** Add a Florida governing law clause (or wherever you incorporate).
3. **FERPA DPA — signatory authority.** The person signing the DPA should be confirmed to have FERPA agreement authority at their institution (often the Registrar or General Counsel, not always an AD).

Everything else is ready to use as-is for a free pilot with a cooperative champion.

---

## How to Use This Package

**When they ask "can you send me something to look at":**
→ Send `06-internal-sell-sheet.md` (converted to PDF)

**When they ask "what about privacy / FERPA":**
→ Send `03-security-overview.md` + `02-ferpa-dpa.md`

**When IT security gets involved:**
→ Send `03-security-overview.md` first. Answer questions. Then `02-ferpa-dpa.md`.

**When they're ready to start:**
→ Send `01-pilot-agreement.md` + `02-ferpa-dpa.md` together. One link, one email.

**When they say yes:**
→ Get their roster CSV, run `bun 09-bulk-onboarding/bulk-create-athletes.ts --csv roster.csv --org-id <uuid>`

**When a champion needs to sell internally:**
→ Give them `07-internal-email-templates.md` and `08-objection-faq.md`

---

## The One-Link Answer

When they ask "what do we need to get started?" — your answer is a Google Drive link to this folder.

One link. Everything in it. They can forward it to IT, legal, and the AD without another email from you.
