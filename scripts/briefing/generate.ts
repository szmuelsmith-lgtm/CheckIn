#!/usr/bin/env bun
/**
 * ATHLETE ANCHOR — DAILY BRIEFING GENERATOR
 *
 * Pulls live data from four sources and prints (+ optionally emails) a
 * formatted briefing:
 *   1. GitHub issues          — `gh` CLI  (must be authenticated)
 *   2. Supabase pilot metrics — service role key
 *   3. Sales pipeline         — scripts/briefing/pipeline.json
 *   4. Priority recommendation — derived from above
 *
 * Usage:
 *   bun scripts/briefing/generate.ts            # print to stdout
 *   bun scripts/briefing/generate.ts --email    # print + email
 *
 * Required env (set in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional env:
 *   RESEND_API_KEY                              # enables email delivery
 *   BRIEFING_TO_EMAIL                          # defaults to sjs25h@fsu.edu
 *   NEXT_PUBLIC_APP_URL                        # link in email footer
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────

const REPO       = "szmuelsmith-lgtm/CheckIn";
const TO_EMAIL   = process.env.BRIEFING_TO_EMAIL ?? "sjs25h@fsu.edu";
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.athleteanchor.com";
const SEND_EMAIL = process.argv.includes("--email");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TODAY = new Date();
const DATE_LABEL = TODAY.toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
});
const YESTERDAY = new Date(TODAY.getTime() - 86_400_000).toISOString().split("T")[0];

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8", timeout: 10_000 }).trim();
  } catch {
    return "";
  }
}

function pad(s: string, width = 60): string {
  return s.padEnd(width);
}

// ── 1. GitHub Issues ──────────────────────────────────────────────────────────

interface GhIssue {
  number: number;
  title: string;
  labels: { name: string }[];
  updatedAt: string;
  url: string;
}

function fetchGitHubIssues(): GhIssue[] {
  const raw = run(
    `gh issue list --repo ${REPO} --state open --json number,title,labels,updatedAt,url --limit 20`
  );
  if (!raw) return [];
  try {
    return JSON.parse(raw) as GhIssue[];
  } catch {
    return [];
  }
}

function getRecentCommits(): string {
  const raw = run(`gh api repos/${REPO}/commits?per_page=5 --jq '.[].commit.message' 2>/dev/null`);
  if (!raw) {
    // Fallback to local git if no gh API access
    return run("git log --oneline -5 2>/dev/null");
  }
  return raw;
}

// ── 2. Supabase Pilot Metrics ─────────────────────────────────────────────────

interface MetricsSummary {
  checkinsYesterday: number;
  redAlertsOpen: number;
  redAlertsYesterday: number;
  totalAthletes: number;
  totalOrgs: number;
  weeklyCompletionRate: number | null;
}

async function fetchSupabaseMetrics(): Promise<MetricsSummary> {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return {
      checkinsYesterday: 0, redAlertsOpen: 0, redAlertsYesterday: 0,
      totalAthletes: 0, totalOrgs: 0, weeklyCompletionRate: null,
    };
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const [
    { count: checkinsYesterday },
    { count: redAlertsOpen },
    { count: redAlertsYesterday },
    { count: totalAthletes },
    { count: totalOrgs },
  ] = await Promise.all([
    sb.from("checkins")
      .select("*", { count: "exact", head: true })
      .gte("completed_at", YESTERDAY + "T00:00:00.000Z")
      .lt("completed_at",  YESTERDAY + "T23:59:59.999Z"),
    sb.from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("risk_level", "red")
      .eq("resolved", false),
    sb.from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("risk_level", "red")
      .gte("created_at", YESTERDAY + "T00:00:00.000Z"),
    sb.from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "athlete"),
    sb.from("organizations")
      .select("*", { count: "exact", head: true }),
  ]);

  // 7-day completion rate (athletes who checked in last 7 days / total athletes)
  const sevenDaysAgo = new Date(TODAY.getTime() - 7 * 86_400_000).toISOString();
  const { data: recentCheckins } = await sb
    .from("checkins")
    .select("athlete_id")
    .gte("completed_at", sevenDaysAgo);

  const uniqueAthletes = new Set((recentCheckins ?? []).map((c: { athlete_id: string }) => c.athlete_id)).size;
  const weeklyCompletionRate = totalAthletes && totalAthletes > 0
    ? Math.round((uniqueAthletes / totalAthletes) * 100)
    : null;

  return {
    checkinsYesterday:   checkinsYesterday  ?? 0,
    redAlertsOpen:       redAlertsOpen      ?? 0,
    redAlertsYesterday:  redAlertsYesterday ?? 0,
    totalAthletes:       totalAthletes      ?? 0,
    totalOrgs:           totalOrgs          ?? 0,
    weeklyCompletionRate,
  };
}

// ── 3. Sales Pipeline ─────────────────────────────────────────────────────────

interface PipelineSchool {
  name: string;
  contact: string;
  contact_title: string;
  stage: string;
  last_contact: string | null;
  next_followup: string | null;
  notes: string;
}

interface Pipeline { schools: PipelineSchool[] }

function fetchPipeline(): Pipeline {
  try {
    const raw = readFileSync(
      join(import.meta.dir, "pipeline.json"),
      "utf8"
    );
    return JSON.parse(raw) as Pipeline;
  } catch {
    return { schools: [] };
  }
}

function getDueFollowUps(pipeline: Pipeline): PipelineSchool[] {
  const todayStr = TODAY.toISOString().split("T")[0];
  return pipeline.schools.filter((s) => {
    if (!s.next_followup) return false;
    return s.next_followup <= todayStr;
  });
}

// ── 4. Priority Recommendation ────────────────────────────────────────────────

function derivePriority(
  metrics: MetricsSummary,
  issues: GhIssue[],
  dueFollowUps: PipelineSchool[]
): string {
  if (metrics.redAlertsOpen > 0) {
    return `Review ${metrics.redAlertsOpen} open red alert${metrics.redAlertsOpen > 1 ? "s" : ""} in the dashboard — ${APP_URL}/admin/alerts`;
  }
  if (dueFollowUps.length > 0) {
    return `Follow up with ${dueFollowUps[0].name} — email is due today.`;
  }
  const secIssues = issues.filter(i =>
    i.labels.some(l => ["security","critical","bug"].includes(l.name.toLowerCase()))
  );
  if (secIssues.length > 0) {
    return `Resolve open security/critical issue #${secIssues[0].number}: "${secIssues[0].title}"`;
  }
  if (metrics.totalOrgs === 0 || metrics.totalAthletes < 5) {
    return "Land your first pilot — reach out to one FSU coach today with a 30-day free offer.";
  }
  if (metrics.weeklyCompletionRate !== null && metrics.weeklyCompletionRate < 50) {
    return `Check-in completion is at ${metrics.weeklyCompletionRate}%. Review reminder email cadence and athlete onboarding friction.`;
  }
  return "Ship: work the top open GitHub issue or expand the pilot to a second sport.";
}

// ── 5. Format Briefing ────────────────────────────────────────────────────────

function formatBriefing(
  metrics:     MetricsSummary,
  issues:      GhIssue[],
  commits:     string,
  pipeline:    Pipeline,
  dueFollowUps: PipelineSchool[],
  priority:    string,
): { text: string; html: string } {

  // ── Text version ──
  const divider = "─".repeat(60);
  const lines: string[] = [
    "",
    "╔══════════════════════════════════════════════════════════╗",
    "║         ATHLETE ANCHOR — DAILY BRIEFING                 ║",
    `║  ${DATE_LABEL.padEnd(56)}║`,
    "╚══════════════════════════════════════════════════════════╝",
    "",
    divider,
    "  INDUSTRY NEWS",
    divider,
    "  → NCAA mental health best-practice guidance requires routine",
    "    screening and early escalation paths — exactly what this",
    "    product provides. Lead with the Sport Science Institute",
    "    framework in every pilot conversation.",
    "  → FERPA reminder: schools need a signed DPA before any live",
    "    pilot. Draft one before your first real sales meeting.",
    "  → Market gap: no product in the NCAA space combines private",
    "    athlete journaling + structured check-ins + coach workflow",
    "    in one privacy-first tool. That's your positioning.",
    "",
    divider,
    "  SALES PIPELINE",
    divider,
  ];

  if (dueFollowUps.length > 0) {
    lines.push("  🔔 FOLLOW UP TODAY:");
    dueFollowUps.forEach((s) => {
      lines.push(`     → ${s.name}`);
      if (s.contact) lines.push(`       Contact: ${s.contact} (${s.contact_title})`);
      if (s.notes)   lines.push(`       Note: ${s.notes}`);
    });
  } else {
    lines.push("  → No follow-ups due today.");
  }

  lines.push("");
  lines.push("  Pipeline summary:");
  const stages: Record<string, string[]> = {};
  pipeline.schools.forEach((s) => {
    if (!stages[s.stage]) stages[s.stage] = [];
    stages[s.stage].push(s.name);
  });
  Object.entries(stages).forEach(([stage, names]) => {
    lines.push(`     ${stage.padEnd(20)} ${names.join(", ")}`);
  });

  lines.push(
    "",
    divider,
    "  PRODUCT",
    divider,
  );

  if (issues.length === 0) {
    lines.push("  → No open GitHub issues.");
  } else {
    const bugIssues = issues.filter(i =>
      i.labels.some(l => ["bug","security","critical"].includes(l.name.toLowerCase()))
    );
    const otherIssues = issues.filter(i =>
      !i.labels.some(l => ["bug","security","critical"].includes(l.name.toLowerCase()))
    );

    if (bugIssues.length > 0) {
      lines.push(`  🐛 Bugs / Security (${bugIssues.length}):`);
      bugIssues.slice(0, 5).forEach((i) => {
        lines.push(`     #${i.number} ${i.title}`);
      });
    }
    if (otherIssues.length > 0) {
      lines.push(`  📋 Open issues (${otherIssues.length}):`);
      otherIssues.slice(0, 5).forEach((i) => {
        lines.push(`     #${i.number} ${i.title}`);
      });
    }
  }

  if (commits) {
    lines.push("  → Recent commits:");
    commits.split("\n").slice(0, 3).forEach((c) => {
      lines.push(`     ${c.trim().slice(0, 70)}`);
    });
  }

  lines.push(
    "",
    divider,
    "  PILOT METRICS",
    divider,
  );

  if (metrics.totalAthletes === 0) {
    lines.push("  → No live pilot yet. These will populate once your first school onboards.");
  } else {
    lines.push(`  → Orgs active:              ${metrics.totalOrgs}`);
    lines.push(`  → Total athletes:           ${metrics.totalAthletes}`);
    lines.push(`  → Check-ins yesterday:      ${metrics.checkinsYesterday}`);
    lines.push(`  → 7-day completion rate:    ${metrics.weeklyCompletionRate !== null ? metrics.weeklyCompletionRate + "%" : "—"}`);
    lines.push(`  → Open red alerts:          ${metrics.redAlertsOpen}${metrics.redAlertsOpen > 0 ? " ⚠️" : ""}`);
    lines.push(`  → Red alerts triggered yesterday: ${metrics.redAlertsYesterday}`);
  }

  lines.push(
    "",
    divider,
    "  TODAY'S PRIORITY",
    divider,
    `  → ${priority}`,
    "",
    divider,
    `  Dashboard: ${APP_URL}/admin/dashboard`,
    `  Pipeline:  scripts/briefing/pipeline.json`,
    divider,
    "",
  );

  const text = lines.join("\n");

  // ── HTML version ──
  const htmlRows = (items: string[]) =>
    items.map(i => `<li style="margin:4px 0;color:#334155;">${i}</li>`).join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:32px;">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">

  <div style="background:#0f172a;padding:28px 32px;">
    <h1 style="color:#fff;margin:0;font-size:18px;font-weight:700;letter-spacing:0.05em;">
      ATHLETE ANCHOR — DAILY BRIEFING
    </h1>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:14px;">${DATE_LABEL}</p>
  </div>

  <div style="padding:28px 32px;">

    <!-- INDUSTRY NEWS -->
    <h2 style="color:#0f172a;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin:0 0 12px;">
      Industry News
    </h2>
    <ul style="margin:0 0 24px;padding-left:20px;">
      <li style="margin:4px 0;color:#334155;">NCAA Sport Science Institute framework calls for routine screening + escalation paths — your core value prop, cite it in pilots.</li>
      <li style="margin:4px 0;color:#334155;">FERPA: every school needs a signed DPA before a live pilot. Get one drafted before your first real meeting.</li>
      <li style="margin:4px 0;color:#334155;">Market gap: no competitor combines private journaling + structured check-ins + coach workflow in a privacy-first tool.</li>
    </ul>

    <!-- SALES PIPELINE -->
    <h2 style="color:#0f172a;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin:0 0 12px;">
      Sales Pipeline
    </h2>
    ${dueFollowUps.length > 0 ? `
    <div style="background:#fefce8;border:1px solid #fef08a;border-radius:8px;padding:12px 16px;margin-bottom:12px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#854d0e;">🔔 Follow up today:</p>
      <ul style="margin:6px 0 0;padding-left:16px;">
        ${dueFollowUps.map(s => `<li style="color:#713f12;font-size:13px;">${s.name}${s.contact ? ` — ${s.contact}` : ""}</li>`).join("\n")}
      </ul>
    </div>
    ` : `<p style="color:#64748b;font-size:14px;">No follow-ups due today.</p>`}
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:24px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="text-align:left;padding:8px 10px;color:#475569;font-weight:600;">School</th>
          <th style="text-align:left;padding:8px 10px;color:#475569;font-weight:600;">Stage</th>
          <th style="text-align:left;padding:8px 10px;color:#475569;font-weight:600;">Next follow-up</th>
        </tr>
      </thead>
      <tbody>
        ${pipeline.schools.map((s, i) => `
        <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
          <td style="padding:8px 10px;color:#0f172a;">${s.name}</td>
          <td style="padding:8px 10px;color:#64748b;">${s.stage}</td>
          <td style="padding:8px 10px;color:#64748b;">${s.next_followup ?? "—"}</td>
        </tr>`).join("\n")}
      </tbody>
    </table>

    <!-- PRODUCT -->
    <h2 style="color:#0f172a;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin:0 0 12px;">
      Product
    </h2>
    ${issues.length === 0
      ? `<p style="color:#64748b;font-size:14px;margin-bottom:24px;">No open GitHub issues.</p>`
      : `<ul style="margin:0 0 24px;padding-left:20px;">
          ${issues.slice(0, 8).map(i => {
            const isBug = i.labels.some(l => ["bug","security","critical"].includes(l.name.toLowerCase()));
            return `<li style="margin:4px 0;color:#334155;">${isBug ? "🐛 " : ""}<a href="${i.url}" style="color:#4f46e5;">#${i.number}</a> ${i.title}</li>`;
          }).join("\n")}
        </ul>`
    }
    ${commits ? `
    <p style="color:#64748b;font-size:13px;margin:0 0 4px;">Recent commits:</p>
    <pre style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;font-size:12px;color:#334155;overflow-x:auto;margin:0 0 24px;">${commits.split("\n").slice(0,3).join("\n")}</pre>
    ` : ""}

    <!-- PILOT METRICS -->
    <h2 style="color:#0f172a;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin:0 0 12px;">
      Pilot Metrics
    </h2>
    ${metrics.totalAthletes === 0
      ? `<p style="color:#64748b;font-size:14px;margin-bottom:24px;">No live pilot yet — these populate once your first school onboards.</p>`
      : `<table style="width:100%;font-size:13px;margin-bottom:24px;">
          <tr><td style="padding:5px 0;color:#64748b;">Orgs active</td><td style="font-weight:600;color:#0f172a;">${metrics.totalOrgs}</td></tr>
          <tr><td style="padding:5px 0;color:#64748b;">Total athletes</td><td style="font-weight:600;color:#0f172a;">${metrics.totalAthletes}</td></tr>
          <tr><td style="padding:5px 0;color:#64748b;">Check-ins yesterday</td><td style="font-weight:600;color:#0f172a;">${metrics.checkinsYesterday}</td></tr>
          <tr><td style="padding:5px 0;color:#64748b;">7-day completion rate</td><td style="font-weight:600;color:#0f172a;">${metrics.weeklyCompletionRate !== null ? metrics.weeklyCompletionRate + "%" : "—"}</td></tr>
          <tr><td style="padding:5px 0;color:#64748b;">Open red alerts</td><td style="font-weight:600;color:${metrics.redAlertsOpen > 0 ? "#dc2626" : "#16a34a"};">${metrics.redAlertsOpen}${metrics.redAlertsOpen > 0 ? " ⚠️" : " ✓"}</td></tr>
          <tr><td style="padding:5px 0;color:#64748b;">Red alerts yesterday</td><td style="font-weight:600;color:#0f172a;">${metrics.redAlertsYesterday}</td></tr>
        </table>`
    }

    <!-- TODAY'S PRIORITY -->
    <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:16px 20px;margin-bottom:16px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#4338ca;letter-spacing:0.06em;text-transform:uppercase;">Today's Priority</p>
      <p style="margin:0;font-size:15px;font-weight:600;color:#1e1b4b;">${priority}</p>
    </div>

    <div style="text-align:center;margin-top:20px;">
      <a href="${APP_URL}/admin/dashboard"
         style="display:inline-block;background:#0f172a;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;">
        Open Dashboard →
      </a>
    </div>

  </div>

  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
    <p style="color:#94a3b8;font-size:12px;margin:0;">
      Athlete Anchor — Daily Briefing · Edit pipeline: <code>scripts/briefing/pipeline.json</code>
    </p>
  </div>
</div>
</body>
</html>
  `.trim();

  return { text, html };
}

// ── 6. Email Delivery ─────────────────────────────────────────────────────────

async function sendEmail(subject: string, html: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("\n⚠️  RESEND_API_KEY not set — skipping email delivery.");
    console.warn("   Add it to .env.local to enable email briefings.\n");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(key);

  const { error } = await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "Athlete Anchor <notifications@athleteanchor.com>",
    to:   TO_EMAIL,
    subject,
    html,
    text,
  });

  if (error) {
    console.error("Email send failed:", error);
  } else {
    console.log(`\n✅ Briefing emailed to ${TO_EMAIL}`);
  }
}

// ── 7. Save to file ───────────────────────────────────────────────────────────

function saveBriefing(text: string): void {
  const dir = join(import.meta.dir, "archive");
  mkdirSync(dir, { recursive: true });
  const filename = join(dir, `${TODAY.toISOString().split("T")[0]}.txt`);
  writeFileSync(filename, text, "utf8");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Load .env.local if present (Bun doesn't auto-load it outside Next.js)
  try {
    const env = readFileSync(
      join(import.meta.dir, "../../.env.local"),
      "utf8"
    );
    for (const line of env.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) {
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch { /* no .env.local — that's fine in CI */ }

  console.log("Generating Athlete Anchor daily briefing...");

  const [metrics, pipeline] = await Promise.all([
    fetchSupabaseMetrics(),
    Promise.resolve(fetchPipeline()),
  ]);

  const issues     = fetchGitHubIssues();
  const commits    = getRecentCommits();
  const dueFollowUps = getDueFollowUps(pipeline);
  const priority   = derivePriority(metrics, issues, dueFollowUps);

  const { text, html } = formatBriefing(
    metrics, issues, commits, pipeline, dueFollowUps, priority
  );

  // Always print to stdout
  console.log(text);

  // Save archive copy
  saveBriefing(text);

  // Email if flag set
  if (SEND_EMAIL) {
    const subject = `Athlete Anchor Briefing — ${DATE_LABEL}`;
    await sendEmail(subject, html, text);
  }
}

main().catch((e) => {
  console.error("Briefing generation failed:", e);
  process.exit(1);
});
