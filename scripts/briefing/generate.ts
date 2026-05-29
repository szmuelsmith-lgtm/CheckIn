#!/usr/bin/env bun
/**
 * ATHLETE ANCHOR — DAILY BRIEFING GENERATOR
 *
 * Pulls live data from four sources and prints (+ optionally emails) a
 * formatted briefing:
 *   1. GitHub issues          — `gh` CLI  (must be authenticated)
 *   2. Supabase pilot metrics — service role key
 *   3. Sales pipeline         — scripts/briefing/pipeline.json
 *   4. Opportunities          — scripts/briefing/opportunities.json
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
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────

const REPO       = "szmuelsmith-lgtm/CheckIn";
const TO_EMAIL   = process.env.BRIEFING_TO_EMAIL ?? "sjs25h@fsu.edu";
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.athleteanchor.com";
const SEND_EMAIL = process.argv.includes("--email");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TODAY        = new Date();
const TODAY_STR    = TODAY.toISOString().split("T")[0];
const YESTERDAY_D  = new Date(TODAY.getTime() - 86_400_000);
const YESTERDAY    = YESTERDAY_D.toISOString().split("T")[0];
const IN_7_DAYS    = new Date(TODAY.getTime() + 7 * 86_400_000).toISOString().split("T")[0];
const IN_30_DAYS   = new Date(TODAY.getTime() + 30 * 86_400_000).toISOString().split("T")[0];

const DATE_LABEL = TODAY.toLocaleDateString("en-US", {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
});

const DAY_CONTEXT: Record<number, string> = {
  1: "Monday — plan the week. One big thing per day, sequenced.",
  2: "Tuesday — execution day. Deep work, ship something.",
  3: "Wednesday — mid-week check. Are you ahead or behind?",
  4: "Thursday — push to finish anything that can ship by Friday.",
  5: "Friday — close open loops. Nothing worse than leaving Sunday-you a mess.",
  6: "Saturday — optional. If you work, make it strategy or prep, not grind.",
  0: "Sunday — rest or plan only. No coding guilt.",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8", timeout: 10_000 }).trim();
  } catch {
    return "";
  }
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.ceil((d.getTime() - TODAY.getTime()) / 86_400_000);
}

function urgencyLabel(days: number): string {
  if (days <= 0)  return "⚠️  OVERDUE";
  if (days <= 7)  return "🔴 THIS WEEK";
  if (days <= 30) return "🟡 THIS MONTH";
  return "⚪ UPCOMING";
}

function urgencyLabelHtml(days: number): string {
  if (days <= 0)  return `<span style="color:#dc2626;font-weight:700;">⚠️ OVERDUE</span>`;
  if (days <= 7)  return `<span style="color:#dc2626;font-weight:700;">🔴 THIS WEEK</span>`;
  if (days <= 30) return `<span style="color:#d97706;font-weight:700;">🟡 THIS MONTH</span>`;
  return `<span style="color:#64748b;">⚪ Upcoming</span>`;
}

// ── 1. GitHub ────────────────────────────────────────────────────────────────

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
  try { return JSON.parse(raw) as GhIssue[]; } catch { return []; }
}

interface Commit { hash: string; message: string; type: string; scope: string; body: string }

function parseCommits(): Commit[] {
  // Try GitHub API first for author context, fall back to local git
  const raw = run("git log --pretty=format:'%h|%s' -10 2>/dev/null");
  if (!raw) return [];

  return raw.split("\n").map(line => {
    const [hash, ...rest] = line.replace(/^'|'$/g, "").split("|");
    const message = rest.join("|").trim();

    // Parse conventional commit format: type(scope): body
    const match = message.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);
    if (match) {
      return { hash: hash.trim(), message, type: match[1], scope: match[2] ?? "", body: match[3] };
    }
    return { hash: hash.trim(), message, type: "other", scope: "", body: message };
  });
}

const COMMIT_EMOJI: Record<string, string> = {
  feat:     "✨",
  fix:      "🐛",
  perf:     "⚡",
  refactor: "♻️",
  chore:    "🔧",
  docs:     "📝",
  test:     "🧪",
  style:    "💅",
  other:    "•",
};

// ── 2. Supabase Metrics ───────────────────────────────────────────────────────

interface MetricsSummary {
  checkinsYesterday:   number;
  checkinsToday:       number;
  redAlertsOpen:       number;
  yellowAlertsOpen:    number;
  totalAthletes:       number;
  totalOrgs:           number;
  weeklyCompletionRate: number | null;
  uniqueCheckinsLast7:  number;
}

async function fetchSupabaseMetrics(): Promise<MetricsSummary> {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return {
      checkinsYesterday: 0, checkinsToday: 0, redAlertsOpen: 0, yellowAlertsOpen: 0,
      totalAthletes: 0, totalOrgs: 0, weeklyCompletionRate: null, uniqueCheckinsLast7: 0,
    };
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const sevenDaysAgo = new Date(TODAY.getTime() - 7 * 86_400_000).toISOString();

  const [
    { count: checkinsYesterday },
    { count: checkinsToday },
    { count: redAlertsOpen },
    { count: yellowAlertsOpen },
    { count: totalAthletes },
    { count: totalOrgs },
    { data: recentCheckins },
  ] = await Promise.all([
    sb.from("checkins").select("*", { count: "exact", head: true })
      .gte("completed_at", YESTERDAY + "T00:00:00.000Z")
      .lt("completed_at",  YESTERDAY + "T23:59:59.999Z"),
    sb.from("checkins").select("*", { count: "exact", head: true })
      .gte("completed_at", TODAY_STR + "T00:00:00.000Z"),
    sb.from("alerts").select("*", { count: "exact", head: true })
      .eq("severity", "red").eq("status", "open"),
    sb.from("alerts").select("*", { count: "exact", head: true })
      .eq("severity", "yellow").eq("status", "open"),
    sb.from("profiles").select("*", { count: "exact", head: true }).eq("role", "athlete"),
    sb.from("organizations").select("*", { count: "exact", head: true }),
    sb.from("checkins").select("athlete_id").gte("completed_at", sevenDaysAgo),
  ]);

  const uniqueCheckinsLast7 = new Set((recentCheckins ?? []).map((c: { athlete_id: string }) => c.athlete_id)).size;
  const weeklyCompletionRate = totalAthletes && totalAthletes > 0
    ? Math.round((uniqueCheckinsLast7 / totalAthletes) * 100)
    : null;

  return {
    checkinsYesterday:   checkinsYesterday   ?? 0,
    checkinsToday:       checkinsToday       ?? 0,
    redAlertsOpen:       redAlertsOpen       ?? 0,
    yellowAlertsOpen:    yellowAlertsOpen    ?? 0,
    totalAthletes:       totalAthletes       ?? 0,
    totalOrgs:           totalOrgs           ?? 0,
    weeklyCompletionRate,
    uniqueCheckinsLast7,
  };
}

// ── 3. Pipeline ───────────────────────────────────────────────────────────────

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
    return JSON.parse(readFileSync(join(import.meta.dir, "pipeline.json"), "utf8")) as Pipeline;
  } catch { return { schools: [] }; }
}

const STAGE_LABEL: Record<string, string> = {
  prospect:          "Prospect",
  outreach:          "Outreach sent",
  pilot_discussion:  "Pilot discussion",
  pilot_active:      "Pilot active 🟢",
  paid:              "Paid ✅",
};

const STAGE_NEXT_ACTION: Record<string, string> = {
  prospect:          "Find the right contact (Assoc. AD for Student-Athlete Welfare). LinkedIn or athletics.fsu.edu.",
  outreach:          "Send intro email. Lead with the privacy angle — coaches see zero individual data.",
  pilot_discussion:  "Get a 30-min demo call on calendar. Offer 30-day free pilot.",
  pilot_active:      "Check in on engagement. Ask for one coach testimonial.",
  paid:              "Ensure renewal is in place. Ask for a referral to another sport.",
};

// ── 4. Opportunities ─────────────────────────────────────────────────────────

interface Opportunity {
  id: string;
  name: string;
  category: string;
  what: string;
  deadline: string;
  deadline_note: string;
  amount: string;
  fit_notes: string;
  link: string;
  difficulty: string;
  status: string;
  priority: number;
  action: string;
}

interface OpportunitiesFile { opportunities: Opportunity[] }

function fetchOpportunities(): Opportunity[] {
  try {
    const f = JSON.parse(readFileSync(join(import.meta.dir, "opportunities.json"), "utf8")) as OpportunitiesFile;
    return f.opportunities ?? [];
  } catch { return []; }
}

function getActionableOpportunities(opps: Opportunity[]): { urgent: Opportunity[]; upcoming: Opportunity[]; watchlist: Opportunity[] } {
  const active = opps.filter(o => !["rejected", "passed"].includes(o.status));

  const urgent = active.filter(o => o.status === "apply_now").sort((a, b) => a.priority - b.priority);
  const upcoming = active.filter(o => {
    if (o.status !== "prepare" && o.status !== "watch") return false;
    if (o.deadline === "rolling") return o.status === "prepare";
    return o.deadline <= IN_30_DAYS && o.deadline >= TODAY_STR;
  }).sort((a, b) => (a.deadline < b.deadline ? -1 : 1));
  const watchlist = active.filter(o => o.status === "watch" && !upcoming.includes(o))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3);

  return { urgent, upcoming, watchlist };
}

// ── 5. Priority — 3 ordered actions ─────────────────────────────────────────

function derivePriority(
  metrics:     MetricsSummary,
  issues:      GhIssue[],
  pipeline:    Pipeline,
  opps:        { urgent: Opportunity[]; upcoming: Opportunity[] },
): string[] {
  const actions: string[] = [];

  // 1. Red alerts always first
  if (metrics.redAlertsOpen > 0) {
    actions.push(`🚨 Review ${metrics.redAlertsOpen} open RED alert${metrics.redAlertsOpen > 1 ? "s" : ""} now — ${APP_URL}/admin/alerts`);
  }

  // 2. Apply-now opportunities
  opps.urgent.slice(0, 2).forEach(o => {
    actions.push(`📋 ${o.name} — ${o.action}`);
  });

  // 3. Pipeline follow-ups due today
  const todayFollowups = pipeline.schools.filter(s => s.next_followup && s.next_followup <= TODAY_STR);
  todayFollowups.forEach(s => {
    actions.push(`📞 Follow up: ${s.name} — ${STAGE_NEXT_ACTION[s.stage] ?? "Move to next stage."}`);
  });

  // 4. Critical/security bugs
  const critIssues = issues.filter(i => i.labels.some(l => ["security","critical","bug"].includes(l.name.toLowerCase())));
  if (critIssues.length > 0) {
    actions.push(`🐛 Fix: #${critIssues[0].number} — "${critIssues[0].title}"`);
  }

  // 5. No pilot yet — land first school
  if (metrics.totalOrgs === 0) {
    actions.push(`🏫 Cold outreach: contact FSU Track & Cross Country coach today. 2 sentences max. Offer free pilot.`);
  }

  // 6. Low completion rate
  if (metrics.weeklyCompletionRate !== null && metrics.weeklyCompletionRate < 50) {
    actions.push(`📉 Completion ${metrics.weeklyCompletionRate}% — review athlete onboarding friction.`);
  }

  // Default if nothing urgent
  if (actions.length === 0) {
    const topIssue = issues[0];
    if (topIssue) actions.push(`✨ Ship: GitHub #${topIssue.number} — "${topIssue.title}"`);
    else          actions.push(`✨ Ship: work the highest-priority open GitHub issue.`);
    actions.push(`🏫 Reach out to one new FSU coach program this week.`);
  }

  return actions.slice(0, 3);
}

// ── 6. Format Briefing ────────────────────────────────────────────────────────

function formatBriefing(
  metrics:     MetricsSummary,
  issues:      GhIssue[],
  commits:     Commit[],
  pipeline:    Pipeline,
  oppGroups:   ReturnType<typeof getActionableOpportunities>,
  priorities:  string[],
): { text: string; html: string } {

  const divider = "─".repeat(60);
  const dayNote = DAY_CONTEXT[TODAY.getDay()] ?? "";

  // ── TEXT VERSION ──────────────────────────────────────────────────────────

  const lines: string[] = [
    "",
    "╔══════════════════════════════════════════════════════════╗",
    "║         ATHLETE ANCHOR — DAILY BRIEFING                 ║",
    `║  ${DATE_LABEL.padEnd(56)}║`,
    "╚══════════════════════════════════════════════════════════╝",
    "",
    `  ${dayNote}`,
    "",
  ];

  // TODAY'S PRIORITIES
  lines.push(divider, "  🎯 TODAY'S PRIORITIES", divider);
  priorities.forEach((p, i) => lines.push(`  ${i + 1}. ${p}`));
  lines.push("");

  // OPPORTUNITIES — apply_now first
  if (oppGroups.urgent.length > 0 || oppGroups.upcoming.length > 0) {
    lines.push(divider, "  🚀 OPPORTUNITIES", divider);

    oppGroups.urgent.forEach(o => {
      lines.push(`  🔴 APPLY NOW: ${o.name}`);
      lines.push(`     Amount:    ${o.amount}`);
      lines.push(`     Deadline:  ${o.deadline === "rolling" ? "Rolling — apply this week" : `${o.deadline} (${urgencyLabel(daysUntil(o.deadline))})`}`);
      lines.push(`     Action:    ${o.action}`);
      lines.push(`     Link:      ${o.link}`);
      lines.push("");
    });

    if (oppGroups.upcoming.length > 0) {
      lines.push("  Coming up:");
      oppGroups.upcoming.forEach(o => {
        const days = o.deadline === "rolling" ? "rolling" : `${daysUntil(o.deadline)}d`;
        lines.push(`     → ${o.name.padEnd(40)} ${days}  ${o.amount}`);
      });
      lines.push("");
    }

    if (oppGroups.watchlist.length > 0) {
      lines.push("  On your radar:");
      oppGroups.watchlist.forEach(o => {
        lines.push(`     → ${o.name}  |  ${o.deadline === "rolling" ? "rolling" : o.deadline}`);
      });
      lines.push("");
    }
  }

  // SALES PIPELINE
  lines.push(divider, "  🏫 SALES PIPELINE", divider);
  if (pipeline.schools.length === 0) {
    lines.push("  → No schools in pipeline yet. Add entries to scripts/briefing/pipeline.json.");
  } else {
    pipeline.schools.forEach(s => {
      const dueToday = s.next_followup && s.next_followup <= TODAY_STR;
      lines.push(`  ${dueToday ? "🔔" : "  "} ${s.name}`);
      lines.push(`     Stage:      ${STAGE_LABEL[s.stage] ?? s.stage}`);
      if (s.contact) lines.push(`     Contact:    ${s.contact}${s.contact_title ? ` (${s.contact_title})` : ""}`);
      lines.push(`     Next action: ${STAGE_NEXT_ACTION[s.stage] ?? "—"}`);
      if (s.notes) lines.push(`     Note:       ${s.notes}`);
      if (s.next_followup) lines.push(`     Follow-up:  ${s.next_followup}${dueToday ? " ← TODAY" : ""}`);
      lines.push("");
    });
  }

  // PRODUCT — what shipped + what's open
  lines.push(divider, "  📦 PRODUCT", divider);

  if (commits.length > 0) {
    lines.push("  Recent commits:");
    commits.slice(0, 6).forEach(c => {
      const emoji = COMMIT_EMOJI[c.type] ?? "•";
      const label = c.scope ? `(${c.scope})` : "";
      lines.push(`     ${emoji} ${label} ${c.body.slice(0, 65)}`);
    });
    lines.push("");
  }

  const bugIssues   = issues.filter(i => i.labels.some(l => ["bug","security","critical"].includes(l.name.toLowerCase())));
  const otherIssues = issues.filter(i => !bugIssues.includes(i));

  if (bugIssues.length > 0) {
    lines.push(`  🐛 Bugs / Critical (${bugIssues.length}):`);
    bugIssues.slice(0, 5).forEach(i => lines.push(`     #${i.number} ${i.title}`));
    lines.push("");
  }
  if (otherIssues.length > 0) {
    lines.push(`  📋 Open issues (${otherIssues.length}):`);
    otherIssues.slice(0, 5).forEach(i => lines.push(`     #${i.number} ${i.title}`));
    lines.push("");
  }
  if (issues.length === 0) { lines.push("  → No open GitHub issues."); lines.push(""); }

  // PILOT METRICS
  lines.push(divider, "  📊 PILOT METRICS", divider);

  if (metrics.totalAthletes === 0) {
    lines.push("  → No live pilot yet.");
    lines.push("  → These numbers populate once your first school onboards.");
  } else {
    lines.push(`  → Orgs active:           ${metrics.totalOrgs}`);
    lines.push(`  → Total athletes:        ${metrics.totalAthletes}`);
    lines.push(`  → Check-ins today:       ${metrics.checkinsToday}`);
    lines.push(`  → Check-ins yesterday:   ${metrics.checkinsYesterday}`);
    lines.push(`  → 7-day completion:      ${metrics.weeklyCompletionRate !== null ? metrics.weeklyCompletionRate + "%" : "—"}  (${metrics.uniqueCheckinsLast7} unique athletes)`);
    if (metrics.redAlertsOpen > 0) {
      lines.push(`  → 🚨 Open red alerts:    ${metrics.redAlertsOpen}  ← action required`);
    } else {
      lines.push(`  → Open red alerts:       ${metrics.redAlertsOpen} ✓`);
    }
    if (metrics.yellowAlertsOpen > 0) {
      lines.push(`  → Open yellow alerts:    ${metrics.yellowAlertsOpen}`);
    }
  }

  lines.push(
    "",
    divider,
    `  Dashboard: ${APP_URL}/admin/dashboard`,
    `  Pipeline:  scripts/briefing/pipeline.json`,
    divider,
    "",
  );

  const text = lines.join("\n");

  // ── HTML VERSION ──────────────────────────────────────────────────────────

  const section = (title: string, content: string) => `
    <h2 style="color:#0f172a;font-size:12px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;
               border-bottom:2px solid #e2e8f0;padding-bottom:8px;margin:28px 0 14px;">${title}</h2>
    ${content}
  `;

  const priorityHtml = priorities.map((p, i) => `
    <div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start;">
      <div style="width:22px;height:22px;border-radius:50%;background:#0f172a;color:#fff;font-size:11px;font-weight:700;
                  display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i + 1}</div>
      <p style="margin:0;font-size:14px;color:#1e293b;line-height:1.5;">${p}</p>
    </div>
  `).join("");

  const urgentOppsHtml = oppGroups.urgent.map(o => `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
        <span style="font-size:13px;font-weight:700;color:#991b1b;">🔴 APPLY NOW: ${o.name}</span>
        <span style="font-size:12px;font-weight:600;color:#16a34a;">${o.amount}</span>
      </div>
      <p style="margin:0 0 6px;font-size:12px;color:#7f1d1d;">
        Deadline: ${o.deadline === "rolling" ? "Rolling — apply this week" : `${o.deadline} ${urgencyLabelHtml(daysUntil(o.deadline))}`}
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#334155;">${o.action}</p>
      <a href="${o.link}" style="font-size:12px;color:#4f46e5;">${o.link}</a>
    </div>
  `).join("");

  const upcomingOppsHtml = oppGroups.upcoming.length > 0 ? `
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px;">
      <thead><tr style="background:#f1f5f9;">
        <th style="text-align:left;padding:7px 10px;color:#475569;font-weight:600;">Opportunity</th>
        <th style="text-align:left;padding:7px 10px;color:#475569;font-weight:600;">Deadline</th>
        <th style="text-align:left;padding:7px 10px;color:#475569;font-weight:600;">Amount</th>
      </tr></thead>
      <tbody>
        ${oppGroups.upcoming.map((o, i) => `
          <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
            <td style="padding:7px 10px;color:#0f172a;font-weight:500;">${o.name}</td>
            <td style="padding:7px 10px;">${o.deadline === "rolling" ? "Rolling" : `${o.deadline} ${urgencyLabelHtml(daysUntil(o.deadline))}`}</td>
            <td style="padding:7px 10px;color:#16a34a;font-weight:600;">${o.amount}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  ` : "";

  const pipelineHtml = pipeline.schools.length === 0
    ? `<p style="color:#64748b;font-size:14px;">No schools in pipeline yet.</p>`
    : pipeline.schools.map(s => {
        const dueToday = s.next_followup && s.next_followup <= TODAY_STR;
        return `
          <div style="border:1px solid ${dueToday ? "#fef08a" : "#e2e8f0"};border-radius:10px;padding:12px 16px;margin-bottom:10px;background:${dueToday ? "#fefce8" : "#fff"};">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <span style="font-size:14px;font-weight:700;color:#0f172a;">${dueToday ? "🔔 " : ""}${s.name}</span>
              <span style="font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;background:#e2e8f0;color:#334155;">${STAGE_LABEL[s.stage] ?? s.stage}</span>
            </div>
            ${s.contact ? `<p style="margin:2px 0;font-size:12px;color:#64748b;">Contact: <strong>${s.contact}</strong>${s.contact_title ? ` · ${s.contact_title}` : ""}</p>` : ""}
            <p style="margin:4px 0 0;font-size:13px;color:#334155;"><strong>Next action:</strong> ${STAGE_NEXT_ACTION[s.stage] ?? "—"}</p>
            ${s.notes ? `<p style="margin:3px 0 0;font-size:12px;color:#64748b;">${s.notes}</p>` : ""}
            ${s.next_followup ? `<p style="margin:3px 0 0;font-size:12px;color:${dueToday ? "#92400e" : "#64748b"};">Follow-up: ${s.next_followup}${dueToday ? " ← TODAY" : ""}</p>` : ""}
          </div>`;
      }).join("");

  const commitsHtml = commits.length === 0 ? "" : `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:14px;font-size:13px;">
      ${commits.slice(0, 6).map(c => {
        const emoji = COMMIT_EMOJI[c.type] ?? "•";
        const label = c.scope ? `<span style="color:#64748b;">(${c.scope})</span> ` : "";
        return `<div style="padding:3px 0;color:#334155;">${emoji} ${label}${c.body.slice(0, 75)}</div>`;
      }).join("")}
    </div>
  `;

  const issuesHtml = issues.length === 0
    ? `<p style="color:#64748b;font-size:13px;margin-bottom:14px;">No open GitHub issues.</p>`
    : `<ul style="margin:0 0 14px;padding-left:18px;">
        ${issues.slice(0, 8).map(i => {
          const isBug = i.labels.some(l => ["bug","security","critical"].includes(l.name.toLowerCase()));
          return `<li style="margin:4px 0;font-size:13px;color:#334155;">${isBug ? "🐛 " : ""}<a href="${i.url}" style="color:#4f46e5;font-weight:600;">#${i.number}</a> ${i.title}</li>`;
        }).join("")}
      </ul>`;

  const metricsHtml = metrics.totalAthletes === 0
    ? `<p style="color:#64748b;font-size:14px;">No live pilot yet — metrics populate once your first school onboards.</p>`
    : `<table style="width:100%;font-size:13px;">
        <tr><td style="padding:5px 0;color:#64748b;width:55%;">Orgs active</td><td style="font-weight:600;color:#0f172a;">${metrics.totalOrgs}</td></tr>
        <tr><td style="padding:5px 0;color:#64748b;">Total athletes</td><td style="font-weight:600;color:#0f172a;">${metrics.totalAthletes}</td></tr>
        <tr><td style="padding:5px 0;color:#64748b;">Check-ins today</td><td style="font-weight:600;color:#0f172a;">${metrics.checkinsToday}</td></tr>
        <tr><td style="padding:5px 0;color:#64748b;">Check-ins yesterday</td><td style="font-weight:600;color:#0f172a;">${metrics.checkinsYesterday}</td></tr>
        <tr><td style="padding:5px 0;color:#64748b;">7-day completion</td><td style="font-weight:600;color:#0f172a;">${metrics.weeklyCompletionRate !== null ? metrics.weeklyCompletionRate + "%" : "—"} <span style="color:#64748b;font-weight:400;">(${metrics.uniqueCheckinsLast7} athletes)</span></td></tr>
        <tr><td style="padding:5px 0;color:#64748b;">Open red alerts</td><td style="font-weight:600;color:${metrics.redAlertsOpen > 0 ? "#dc2626" : "#16a34a"};">${metrics.redAlertsOpen}${metrics.redAlertsOpen > 0 ? " ⚠️ — action required" : " ✓"}</td></tr>
        ${metrics.yellowAlertsOpen > 0 ? `<tr><td style="padding:5px 0;color:#64748b;">Open yellow alerts</td><td style="font-weight:600;color:#d97706;">${metrics.yellowAlertsOpen}</td></tr>` : ""}
      </table>`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;margin:0;padding:32px 16px;">
<div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

  <div style="background:#0f172a;padding:28px 32px;">
    <h1 style="color:#fff;margin:0;font-size:17px;font-weight:700;letter-spacing:0.04em;">
      ATHLETE ANCHOR — DAILY BRIEFING
    </h1>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:13px;">${DATE_LABEL}</p>
    <p style="color:#64748b;margin:8px 0 0;font-size:12px;font-style:italic;">${dayNote}</p>
  </div>

  <div style="padding:24px 32px 32px;">
    ${section("🎯 Today's Priorities", `<div style="margin-bottom:8px;">${priorityHtml}</div>`)}
    ${(oppGroups.urgent.length > 0 || oppGroups.upcoming.length > 0) ? section("🚀 Opportunities", urgentOppsHtml + upcomingOppsHtml) : ""}
    ${section("🏫 Sales Pipeline", pipelineHtml)}
    ${section("📦 Product", commitsHtml + issuesHtml)}
    ${section("📊 Pilot Metrics", metricsHtml)}

    <div style="text-align:center;margin-top:24px;">
      <a href="${APP_URL}/admin/dashboard"
         style="display:inline-block;background:#0f172a;color:white;padding:10px 24px;border-radius:8px;
                text-decoration:none;font-size:13px;font-weight:600;">
        Open Dashboard →
      </a>
    </div>
  </div>

  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 32px;text-align:center;">
    <p style="color:#94a3b8;font-size:11px;margin:0;">
      Athlete Anchor · Daily Briefing · Update opportunities: <code>scripts/briefing/opportunities.json</code>
    </p>
  </div>
</div>
</body>
</html>`.trim();

  return { text, html };
}

// ── 7. Email ──────────────────────────────────────────────────────────────────

async function sendEmail(subject: string, html: string, text: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("\n⚠️  RESEND_API_KEY not set — skipping email delivery.");
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: process.env.FROM_EMAIL ?? "Athlete Anchor <notifications@athleteanchor.com>",
    to: TO_EMAIL, subject, html, text,
  });
  if (error) console.error("Email send failed:", error);
  else        console.log(`\n✅ Briefing emailed to ${TO_EMAIL}`);
}

// ── 8. Archive ────────────────────────────────────────────────────────────────

function saveBriefing(text: string): void {
  const dir = join(import.meta.dir, "archive");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${TODAY_STR}.txt`), text, "utf8");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Load .env.local
  try {
    const env = readFileSync(join(import.meta.dir, "../../.env.local"), "utf8");
    for (const line of env.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m && !process.env[m[1].trim()]) {
        process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch { /* no .env.local — fine in CI */ }

  console.log("Generating Athlete Anchor daily briefing...");

  const [metrics, pipeline, oppsRaw] = await Promise.all([
    fetchSupabaseMetrics(),
    Promise.resolve(fetchPipeline()),
    Promise.resolve(fetchOpportunities()),
  ]);

  const issues     = fetchGitHubIssues();
  const commits    = parseCommits();
  const oppGroups  = getActionableOpportunities(oppsRaw);
  const priorities = derivePriority(metrics, issues, pipeline, oppGroups);

  const { text, html } = formatBriefing(metrics, issues, commits, pipeline, oppGroups, priorities);

  console.log(text);
  saveBriefing(text);

  if (SEND_EMAIL) {
    await sendEmail(`Athlete Anchor Briefing — ${DATE_LABEL}`, html, text);
  }
}

main().catch((e) => { console.error("Briefing generation failed:", e); process.exit(1); });
