#!/usr/bin/env bun
/**
 * Scale-test seed: 5 INDEPENDENT organizations, each fully staffed.
 *
 * Each org is a separate "administration" — its own admin, coach, psychiatrist,
 * one team, and 50 athletes — so nothing is shared across the five. This both
 * matches a realistic multi-customer footprint and exercises cross-org
 * isolation (one org's admin/coach/psych must never see another org's data).
 *
 *   5 orgs × (1 admin + 1 psychiatrist + 1 coach + 1 team × 50 athletes)
 *   = 5 admins, 5 psychiatrists, 5 coaches, 5 teams, 250 athletes
 *
 * All rows use the deterministic UUID prefix `5ca1e000-` ("scale") so the whole
 * dataset is namespaced away from demo and load-test data. IDs are reused across
 * re-runs (pure upsert — no deletes), so seeding is idempotent.
 *
 * Login accounts (real, email-confirmed auth users). Password: ScaleTest-2026!
 *   admin   o : scale.admin{o}@scaletest.dev      (o = 1..5)
 *   coach   o : scale.coach{o}@scaletest.dev
 *   psych   o : scale.psych{o}@scaletest.dev
 *   athlete o : scale.athlete{o}@scaletest.dev    (athlete #1 of each org)
 *
 * Usage:
 *   bun supabase/seed-scale-test.ts            # seed
 *   bun supabase/seed-scale-test.ts --verify   # print per-org counts
 *   bun supabase/seed-scale-test.ts --wipe     # remove scale-test data + auth users
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// ── Supabase creds from .env.local (no secrets baked into this file) ─────────────
function loadEnv(): { url: string; serviceKey: string } {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceKey) {
    try {
      const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
      for (const line of raw.split("\n")) {
        const m = line.match(/^([A-Z_]+)=(.*)$/);
        if (!m) continue;
        const [, k, v] = m;
        if (k === "NEXT_PUBLIC_SUPABASE_URL" && !url) url = v.trim();
        if (k === "SUPABASE_SERVICE_ROLE_KEY" && !serviceKey) serviceKey = v.trim();
      }
    } catch { /* ignore */ }
  }
  if (!url || !serviceKey) throw new Error("Missing Supabase URL / service key (env or .env.local)");
  return { url, serviceKey };
}

const { url: SUPABASE_URL, serviceKey: SERVICE_KEY } = loadEnv();
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// ── Config ──────────────────────────────────────────────────────────────────
const N_ORGS = 5;
const N_ATH = 50;
const N_WEEKS = 4;
const PASSWORD = "ScaleTest-2026!";
const PREFIX = "5ca1e000";

const ORG_NAMES = ["North Valley University", "Eastlake College", "Riverside State", "Summit University", "Pinecrest College"];
const SPORTS = ["Football", "Basketball", "Soccer", "Volleyball", "Track & Field"];
const PSYCH_NAMES = ["Dr. Chen", "Dr. Patel", "Dr. Okafor", "Dr. Reyes", "Dr. Nguyen"];
const ADMIN_NAMES = ["Dana Holt", "Marcus Webb", "Priya Shah", "Tom Bauer", "Lena Ford"];

// ── Deterministic UUID helpers (all under 5ca1e000-) ────────────────────────────
const p4 = (n: number) => String(n).padStart(4, "0");
const p12 = (n: number) => String(n).padStart(12, "0");

const orgId = (o: number) => `${PREFIX}-0000-0000-0000-${p12(o)}`;
const teamId = (o: number) => `${PREFIX}-0000-0000-${p4(o)}-000000000001`;
const athId = (o: number, a: number) => `${PREFIX}-0000-${p4(o)}-0000-${p12(a)}`;
const coachId = (o: number) => `${PREFIX}-0c00-0000-${p4(o)}-000000000001`;
// Org 1 reuses the original single-org admin/psych IDs (…-0000-…) so the prior
// seed's leftover profiles are repurposed rather than orphaned.
const adminId = (o: number) => o === 1 ? `${PREFIX}-ad00-0000-0000-000000000001` : `${PREFIX}-ad00-0000-${p4(o)}-000000000001`;
const psychId = (o: number) => o === 1 ? `${PREFIX}-bd00-0000-0000-000000000001` : `${PREFIX}-bd00-0000-${p4(o)}-000000000001`;
const fakeAuth = (o: number, a: number) => `${PREFIX}-fa00-${p4(o)}-0000-${p12(a)}`;

const FIRST = ["Jordan", "Alex", "Morgan", "Taylor", "Casey", "Riley", "Jamie", "Drew", "Quinn", "Blake",
  "Avery", "Parker", "Hayden", "Cameron", "Reagan", "Logan", "Skylar", "Peyton", "Reese", "Kendall",
  "Charlie", "Finley", "Rowan", "Emery", "River", "Phoenix", "Sage", "Remi", "Kai", "Dakota",
  "Eden", "Lane", "Robin", "Wren", "Spencer", "Lennon", "Harper", "Emerson", "Sloane", "Paige",
  "Briar", "Sutton", "Marlowe", "Ellis", "Harlow", "Jess", "Lee", "Ari", "Ray", "Skye"];
const LAST = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Wilson", "Taylor",
  "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson", "Moore", "Young", "Allen",
  "King", "Wright", "Scott", "Torres", "Hill", "Green", "Adams", "Baker", "Nelson", "Carter",
  "Mitchell", "Perez", "Roberts", "Turner", "Phillips", "Campbell", "Parker", "Evans", "Edwards", "Collins",
  "Stewart", "Morris", "Rogers", "Reed", "Cook", "Morgan", "Bell", "Murphy", "Bailey", "Rivera"];

// One login account per role per org
interface LoginAcct { profileId: string; email: string; role: string; full_name: string; org: number; team: number | null; }
function loginAccts(): LoginAcct[] {
  const out: LoginAcct[] = [];
  for (let o = 1; o <= N_ORGS; o++) {
    out.push({ profileId: adminId(o), email: `scale.admin${o}@scaletest.dev`, role: "admin", full_name: `${ADMIN_NAMES[o - 1]} (Admin)`, org: o, team: null });
    out.push({ profileId: psychId(o), email: `scale.psych${o}@scaletest.dev`, role: "psychiatrist", full_name: `${PSYCH_NAMES[o - 1]} (Counselor)`, org: o, team: null });
    out.push({ profileId: coachId(o), email: `scale.coach${o}@scaletest.dev`, role: "coach", full_name: `Coach ${SPORTS[o - 1]}`, org: o, team: o });
    out.push({ profileId: athId(o, 1), email: `scale.athlete${o}@scaletest.dev`, role: "athlete", full_name: `${FIRST[0]} ${LAST[o % LAST.length]}`, org: o, team: o });
  }
  return out;
}
const LOGINS = loginAccts();

async function ensureAuthUser(email: string, full_name: string, role: string): Promise<string> {
  const { data: existing } = await supabase.from("profiles").select("auth_user_id").eq("email", email).maybeSingle();
  if (existing?.auth_user_id) {
    const { error } = await supabase.auth.admin.updateUserById(existing.auth_user_id, { password: PASSWORD, email_confirm: true });
    if (!error) return existing.auth_user_id;
  }
  const { data, error } = await supabase.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true, user_metadata: { full_name, role } });
  if (data?.user) return data.user.id;
  // already-exists fallback
  const { data: list } = await supabase.auth.admin.listUsers();
  const found = list?.users.find(u => u.email === email);
  if (found) {
    await supabase.auth.admin.updateUserById(found.id, { password: PASSWORD, email_confirm: true });
    return found.id;
  }
  throw new Error(`createUser ${email}: ${error?.message}`);
}

async function upsert(table: string, rows: Record<string, unknown>[]) {
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + 200), { onConflict: "id" });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function seed() {
  const t0 = Date.now();
  console.log(`\n=== Scale-test seed: ${N_ORGS} independent orgs × (admin+coach+psych+team of ${N_ATH}) ===\n`);

  // 1. Orgs
  console.log("[1/6] Organizations (5, each its own administration)...");
  await upsert("organizations", Array.from({ length: N_ORGS }, (_, i) => ({
    id: orgId(i + 1), name: ORG_NAMES[i], type: "university", reminder_day: (i + 1) % 7,
  })));

  // 2. Teams (one per org)
  console.log("[2/6] Teams (one per org)...");
  await upsert("teams", Array.from({ length: N_ORGS }, (_, i) => ({
    id: teamId(i + 1), organization_id: orgId(i + 1), name: `${SPORTS[i]} Team`, sport: SPORTS[i], active: true,
  })));

  // 3. Auth users for every login account (20: 5×admin/coach/psych/athlete)
  console.log("[3/6] Login accounts (auth users — 5 admins, 5 coaches, 5 psychiatrists, 5 athletes)...");
  const authIdByProfile = new Map<string, string>();
  for (const a of LOGINS) {
    authIdByProfile.set(a.profileId, await ensureAuthUser(a.email, a.full_name, a.role));
    process.stdout.write(`  ${a.role.padEnd(12)} ${a.email}\n`);
  }

  // 4. Profiles: admin + psych + coach per org, then 50 athletes per org
  console.log("[4/6] Profiles (per-org staff + 250 athletes)...");
  const profiles: Record<string, unknown>[] = [];
  for (const a of LOGINS.filter(l => l.role !== "athlete")) {
    profiles.push({
      id: a.profileId, auth_user_id: authIdByProfile.get(a.profileId), full_name: a.full_name,
      email: a.email, role: a.role, organization_id: orgId(a.org), team_id: a.team ? teamId(a.team) : null, onboarded: true,
    });
  }
  for (let o = 1; o <= N_ORGS; o++) {
    for (let a = 1; a <= N_ATH; a++) {
      const isLogin = a === 1;
      profiles.push({
        id: athId(o, a),
        auth_user_id: isLogin ? authIdByProfile.get(athId(o, 1)) : fakeAuth(o, a),
        full_name: `${FIRST[(a - 1) % FIRST.length]} ${LAST[(a + o) % LAST.length]}`,
        email: isLogin ? `scale.athlete${o}@scaletest.dev` : `scale_o${o}_a${a}@scaletest.dev`,
        role: "athlete", organization_id: orgId(o), team_id: teamId(o), onboarded: true,
      });
    }
  }
  await upsert("profiles", profiles);
  console.log(`  ${profiles.length} profiles upserted`);

  // 5. Check-ins: N_WEEKS per athlete
  console.log(`[5/6] Check-ins (${N_WEEKS} weeks × 250 = ${N_WEEKS * 250})...`);
  const now = Date.now();
  const checkins: Record<string, unknown>[] = [];
  for (let o = 1; o <= N_ORGS; o++) {
    for (let a = 1; a <= N_ATH; a++) {
      const base = 4.0 + (((o * 17 + a * 31) % 60) / 10.0);
      for (let wk = 0; wk < N_WEEKS; wk++) {
        const e = Math.max(1, Math.min(10, Math.round(base + ((o + a + wk) % 30 - 15) / 10)));
        const r = Math.max(1, Math.min(10, Math.round(base + ((o * 2 + a + wk) % 28 - 14) / 10)));
        const rc = Math.max(1, Math.min(10, Math.round(base + ((a * 3 + o + wk) % 26 - 13) / 10)));
        const s = Math.max(1, Math.min(10, Math.round(base + ((o + a * 2 + wk) % 24 - 12) / 10)));
        const minScore = Math.min(e, r, rc, s);
        const risk = minScore < 3 ? "red" : minScore < 5 ? "yellow" : "green";
        const msAgo = (wk * 7 + (a % 7)) * 86400000 + ((o * 3 + a) % 12) * 3600000;
        checkins.push({
          athlete_id: athId(o, a), team_id: teamId(o), mode: "weekly",
          emotional_score: e, resilience_score: r, recovery_score: rc, support_score: s,
          risk_level: risk, is_private: true, wants_followup: false, completed_at: new Date(now - msAgo).toISOString(),
        });
      }
    }
  }
  for (let i = 0; i < checkins.length; i += 200) {
    const { error } = await supabase.from("checkins").insert(checkins.slice(i, i + 200));
    if (error) throw new Error(`checkins: ${error.message}`);
  }
  console.log(`  ${checkins.length} check-ins inserted`);

  // 6. Alerts for at-risk athletes (per org)
  console.log("[6/6] Alerts...");
  const alerts: Record<string, unknown>[] = [];
  for (let o = 1; o <= N_ORGS; o++) {
    for (let a = 1; a <= N_ATH; a++) {
      const base = 4.0 + (((o * 17 + a * 31) % 60) / 10.0);
      const e = Math.max(1, Math.min(10, Math.round(base + ((o + a) % 30 - 15) / 10)));
      const r = Math.max(1, Math.min(10, Math.round(base + ((o * 2 + a) % 28 - 14) / 10)));
      const rc = Math.max(1, Math.min(10, Math.round(base + ((a * 3 + o) % 26 - 13) / 10)));
      const s = Math.max(1, Math.min(10, Math.round(base + ((o + a * 2) % 24 - 12) / 10)));
      const minScore = Math.min(e, r, rc, s);
      if (minScore < 5) {
        alerts.push({
          athlete_id: athId(o, a), team_id: teamId(o), organization_id: orgId(o),
          severity: minScore < 3 ? "red" : "yellow", trigger_type: "risk_score", status: "open",
          created_at: new Date(now - ((o + a) % 72) * 3600000).toISOString(),
        });
      }
    }
  }
  for (let i = 0; i < alerts.length; i += 200) {
    const { error } = await supabase.from("alerts").insert(alerts.slice(i, i + 200));
    if (error) throw new Error(`alerts: ${error.message}`);
  }
  console.log(`  ${alerts.length} alerts inserted`);

  console.log(`\n✅ Seeded in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`\nLog in at /login (password: ${PASSWORD}):`);
  for (let o = 1; o <= N_ORGS; o++) {
    console.log(`  ${ORG_NAMES[o - 1]}:  admin scale.admin${o}@  ·  coach scale.coach${o}@  ·  psych scale.psych${o}@  ·  athlete scale.athlete${o}@  (@scaletest.dev)`);
  }
  await verify();
}

async function verify() {
  console.log("\n=== Scale-test per-org counts ===");
  for (let o = 1; o <= N_ORGS; o++) {
    const [ath, coach, admin, psych] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organization_id", orgId(o)).eq("role", "athlete"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organization_id", orgId(o)).eq("role", "coach"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organization_id", orgId(o)).eq("role", "admin"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organization_id", orgId(o)).eq("role", "psychiatrist"),
    ]);
    console.log(`  ${ORG_NAMES[o - 1].padEnd(24)} athletes:${ath.count ?? 0}  coaches:${coach.count ?? 0}  admins:${admin.count ?? 0}  psych:${psych.count ?? 0}`);
  }
}

async function wipe() {
  console.log("\n=== Wiping scale-test data ===");
  const lo = `${PREFIX}-0000-0000-0000-000000000000`, hi = `${PREFIX}-ffff-ffff-ffff-ffffffffffff`;
  for (const l of LOGINS) {
    const { data } = await supabase.from("profiles").select("auth_user_id").eq("email", l.email).maybeSingle();
    if (data?.auth_user_id) {
      const { error } = await supabase.auth.admin.deleteUser(data.auth_user_id);
      console.log(`  auth delete ${l.email}: ${error ? "WARN " + error.message : "ok"}`);
    }
  }
  for (const { table, col } of [
    { table: "alerts", col: "organization_id" }, { table: "checkins", col: "athlete_id" },
    { table: "profiles", col: "id" }, { table: "teams", col: "id" }, { table: "organizations", col: "id" },
  ]) {
    process.stdout.write(`  DELETE ${table}... `);
    const { error } = await supabase.from(table).delete().gte(col, lo).lte(col, hi);
    console.log(error ? `WARN ${error.message}` : "ok");
  }
  console.log("Wipe complete. (If profiles time out, it's the 1M-row load-test data + unindexed linked_athlete_id FK.)");
}

const mode = process.argv[2];
if (mode === "--wipe") await wipe();
else if (mode === "--verify") await verify();
else await seed();
