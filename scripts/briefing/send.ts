#!/usr/bin/env bun
/**
 * Send a pre-built HTML briefing via Resend.
 *
 * Usage:
 *   bun scripts/briefing/send.ts <path-to-html-file> [subject]
 *
 * The HTML file is written by the scheduled Claude task, then this
 * script handles delivery so the task prompt doesn't need to manage
 * API keys directly.
 */
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  // Load .env.local
  try {
    const env = readFileSync(join(import.meta.dir, "../../.env.local"), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (m && !process.env[m[1].trim()]) {
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch { /* env set externally */ }

  const htmlFile = process.argv[2];
  const subject  = process.argv[3] ?? "Athlete Anchor — Daily Intelligence Briefing";

  if (!htmlFile) {
    console.error("Usage: bun send.ts <html-file> [subject]");
    process.exit(1);
  }

  const html = readFileSync(htmlFile, "utf8");
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("RESEND_API_KEY not set");
    process.exit(1);
  }

  const to   = process.env.BRIEFING_TO_EMAIL ?? "szmuelsmith@gmail.com";
  const from = process.env.FROM_EMAIL        ?? "Athlete Anchor <onboarding@resend.dev>";

  const { Resend } = await import("resend");
  const { error }  = await new Resend(key).emails.send({ from, to, subject, html, text });

  if (error) {
    console.error("Send failed:", JSON.stringify(error));
    process.exit(1);
  }

  console.log(`✅ Briefing sent to ${to}`);
}

main().catch(e => { console.error(e); process.exit(1); });
