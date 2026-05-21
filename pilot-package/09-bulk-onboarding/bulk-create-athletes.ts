#!/usr/bin/env bun
/**
 * Athlete Anchor — Bulk Athlete Account Creator
 *
 * Usage:
 *   bun bulk-create-athletes.ts --csv roster.csv --org-id <uuid> [--dry-run]
 *
 * CSV format (one header row required):
 *   name,email
 *   Jane Smith,jsmith@school.edu
 *   Marcus Jones,mjones@school.edu
 *
 * What it does:
 *   1. Reads the CSV
 *   2. Creates a Supabase auth user for each athlete (sends magic link invite)
 *   3. Creates their profile row in the profiles table
 *   4. Sends each athlete a welcome email via Resend
 *   5. Prints a summary
 *
 * Requirements:
 *   NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   RESEND_API_KEY in .env.local
 */

import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────

function loadEnv() {
  try {
    const env = readFileSync(join(import.meta.dir, "../../.env.local"), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (m && !process.env[m[1].trim()]) {
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch { /* env set externally */ }
}

loadEnv();

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RESEND_API_KEY    = process.env.RESEND_API_KEY!;
const FROM_EMAIL        = process.env.FROM_EMAIL ?? "Check-In by Athlete Anchor <onboarding@resend.dev>";
const APP_URL           = process.env.NEXT_PUBLIC_APP_URL ?? "https://athleteanchor.com";

// ── Args ──────────────────────────────────────────────────────────────────────

const args   = process.argv.slice(2);
const csvIdx = args.indexOf("--csv");
const orgIdx = args.indexOf("--org-id");
const dryRun = args.includes("--dry-run");

if (csvIdx === -1 || orgIdx === -1) {
  console.error("Usage: bun bulk-create-athletes.ts --csv roster.csv --org-id <uuid> [--dry-run]");
  process.exit(1);
}

const csvPath = args[csvIdx + 1];
const orgId   = args[orgIdx + 1];

// ── Parse CSV ─────────────────────────────────────────────────────────────────

function parseCSV(path: string): { name: string; email: string }[] {
  const raw   = readFileSync(path, "utf8");
  const lines = raw.trim().split("\n").filter(Boolean);
  const header = lines[0].toLowerCase().split(",").map(s => s.trim());
  const nameIdx  = header.indexOf("name");
  const emailIdx = header.indexOf("email");

  if (nameIdx === -1 || emailIdx === -1) {
    throw new Error("CSV must have 'name' and 'email' columns in the header row.");
  }

  return lines.slice(1).map(line => {
    const cols = line.split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
    return { name: cols[nameIdx], email: cols[emailIdx] };
  }).filter(r => r.name && r.email);
}

// ── Welcome Email ─────────────────────────────────────────────────────────────

function buildWelcomeEmail(name: string, loginLink: string, orgId: string): { html: string; text: string } {
  const firstName = name.split(" ")[0];

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px; color: #111;">

  <p style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Hey ${firstName} 👋</p>

  <p style="font-size: 15px; line-height: 1.6; color: #444;">
    Your athletic program is using <strong>Check-In by Athlete Anchor</strong> to support athlete wellbeing this season.
    It takes about <strong>90 seconds</strong> and you can do it right from your phone — no app download required.
  </p>

  <p style="font-size: 15px; line-height: 1.6; color: #444;">
    <strong>Your coaches cannot see your individual responses.</strong> They only see anonymized team trends.
    You're in control of what you share.
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${loginLink}"
       style="background: #111; color: #fff; text-decoration: none; padding: 14px 28px;
              border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
      Open Check-In →
    </a>
  </div>

  <p style="font-size: 13px; color: #888; line-height: 1.5;">
    This link is personal to you — don't share it. It expires in 24 hours.
    If you need a new link, just reply to this email.
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">

  <p style="font-size: 12px; color: #aaa;">
    Check-In by Athlete Anchor &nbsp;·&nbsp; Your data is private and owned by your school.
  </p>

</body>
</html>
  `.trim();

  const text = `Hey ${firstName},

Your athletic program is using Check-In by Athlete Anchor this season. It takes 90 seconds on your phone — no app download needed.

Your coaches cannot see your individual responses. They only see anonymized team trends.

Open Check-In: ${loginLink}

This link is personal to you. It expires in 24 hours.

— Athlete Anchor`;

  return { html, text };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🏃 Athlete Anchor — Bulk Onboarding`);
  console.log(`   CSV:    ${csvPath}`);
  console.log(`   Org ID: ${orgId}`);
  console.log(`   Mode:   ${dryRun ? "DRY RUN (no changes)" : "LIVE"}\n`);

  const athletes = parseCSV(csvPath);
  console.log(`   Found ${athletes.length} athletes in CSV\n`);

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { Resend } = await import("resend");
  const resend = new Resend(RESEND_API_KEY);

  const results: { email: string; status: "ok" | "error"; reason?: string }[] = [];

  for (const athlete of athletes) {
    console.log(`   Processing: ${athlete.name} <${athlete.email}>`);

    if (dryRun) {
      results.push({ email: athlete.email, status: "ok" });
      continue;
    }

    try {
      // 1. Invite user via Supabase auth (sends magic link)
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        athlete.email,
        {
          data: { full_name: athlete.name, role: "athlete" },
          redirectTo: `${APP_URL}/auth/callback?next=/check-in`,
        }
      );

      if (inviteError) throw new Error(`Auth invite failed: ${inviteError.message}`);

      const userId = inviteData.user.id;

      // 2. Upsert profile row
      const { error: profileError } = await supabase.from("profiles").upsert({
        id:              userId,
        full_name:       athlete.name,
        email:           athlete.email,
        role:            "athlete",
        organization_id: orgId,
      }, { onConflict: "id" });

      if (profileError) throw new Error(`Profile upsert failed: ${profileError.message}`);

      // 3. Send welcome email via Resend
      const loginLink = `${APP_URL}/auth/login?email=${encodeURIComponent(athlete.email)}`;
      const { html, text } = buildWelcomeEmail(athlete.name, loginLink, orgId);

      const { error: emailError } = await resend.emails.send({
        from:    FROM_EMAIL,
        to:      athlete.email,
        subject: "Your Check-In link is ready 🏃",
        html,
        text,
      });

      if (emailError) {
        console.warn(`   ⚠️  Email delivery failed for ${athlete.email}: ${JSON.stringify(emailError)}`);
      }

      results.push({ email: athlete.email, status: "ok" });
      console.log(`   ✅ ${athlete.email}`);

    } catch (err: any) {
      console.error(`   ❌ ${athlete.email}: ${err.message}`);
      results.push({ email: athlete.email, status: "error", reason: err.message });
    }

    // Small delay to avoid rate limiting
    await Bun.sleep(300);
  }

  // Summary
  const ok    = results.filter(r => r.status === "ok").length;
  const error = results.filter(r => r.status === "error").length;

  console.log(`\n──────────────────────────────`);
  console.log(`   ✅ Success: ${ok}`);
  if (error > 0) {
    console.log(`   ❌ Failed:  ${error}`);
    results.filter(r => r.status === "error").forEach(r => {
      console.log(`      ${r.email}: ${r.reason}`);
    });
  }
  console.log(`──────────────────────────────\n`);

  if (dryRun) {
    console.log(`   DRY RUN complete. No accounts were created.`);
    console.log(`   Remove --dry-run to go live.\n`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
