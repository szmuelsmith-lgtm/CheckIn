/**
 * rls-probe.mjs — Live RLS + API diagnostic
 * node scripts/rls-probe.mjs
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const SUPABASE_URL         = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY    = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const anon    = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const svc     = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let passed = 0, failed = 0, warned = 0;
const ok   = l       => { console.log(`  ✅ ${l}`); passed++; };
const fail = (l, d)  => { console.log(`  ❌ ${l}\n     → ${d}`); failed++; };
const warn = (l, d)  => { console.log(`  ⚠️  ${l}\n     → ${d}`); warned++; };
const sec  = t       => console.log(`\n━━ ${t} ${'─'.repeat(Math.max(0,60-t.length))}`);

// ── §1  Anon blocked everywhere ───────────────────────────────────────────────
sec('§1  Anon access (all should be blocked)');
const SENSITIVE = ['profiles','checkins','alerts','followups','audit_logs',
                   'consent_logs','access_logs','question_usage','journals','athlete_preferences'];
for (const t of SENSITIVE) {
  const { data, error } = await anon.from(t).select('id').limit(1);
  (error || !data || data.length === 0)
    ? ok(`anon blocked from ${t}`)
    : fail(`anon can READ ${t}`, `returned ${data.length} row(s) — RLS not blocking`);
}

// ── §2  Service role reads all ─────────────────────────────────────────────
sec('§2  Service role reads (sanity)');
for (const t of ['profiles','organizations','teams','checkins','alerts','questions']) {
  const { error } = await svc.from(t).select('id').limit(1);
  error ? fail(`service role blocked from ${t}`, error.message) : ok(`service role reads ${t}`);
}

// ── §3  Policy existence via information_schema ────────────────────────────
sec('§3  RLS policy existence (via Supabase REST)');

// Use the Supabase REST API to hit pg_catalog.pg_policies via a raw SQL call
const policyRes = await fetch(
  `${SUPABASE_URL}/rest/v1/rpc/`,  // placeholder — try SQL API instead
  { method: 'GET' }
).catch(() => null);

// Direct approach: check via service role querying a known view/function
// We'll just test observable behaviour for each table instead of querying pg_policies

// Test: can service role see policies are in effect by testing a known policy predicate
const TABLE_CHECKS = [
  { table: 'questions',      desc: 'anon blocked from questions (migration 014: auth required)',
    fn: async () => {
      const { data, error } = await anon.from('questions').select('id').limit(1);
      // After migration 014, anon must be blocked (permission denied OR empty due to RLS)
      return (error || !data?.length)
        ? { ok: true, detail: 'anon blocked — auth.uid() IS NOT NULL policy active' }
        : { ok: false, detail: `anon can read ${data.length} question(s) — migration 014 not applied` };
    }
  },
  { table: 'consent_logs',   desc: 'RLS enabled (anon blocked)',
    fn: async () => {
      const { data, error } = await anon.from('consent_logs').select('id').limit(1);
      return (error || !data?.length) ? { ok: true, detail: 'blocked as expected' } : { ok: false, detail: 'anon can read consent_logs!' };
    }
  },
  { table: 'access_logs',    desc: 'RLS enabled (anon blocked)',
    fn: async () => {
      const { data, error } = await anon.from('access_logs').select('id').limit(1);
      return (error || !data?.length) ? { ok: true, detail: 'blocked as expected' } : { ok: false, detail: 'anon can read access_logs!' };
    }
  },
  { table: 'question_usage', desc: 'RLS enabled (anon blocked)',
    fn: async () => {
      const { data, error } = await anon.from('question_usage').select('id').limit(1);
      return (error || !data?.length) ? { ok: true, detail: 'blocked as expected' } : { ok: false, detail: 'anon can read question_usage!' };
    }
  },
];

for (const { table, desc, fn } of TABLE_CHECKS) {
  const result = await fn();
  result.ok ? ok(`${table}: ${desc} (${result.detail})`) : fail(`${table}: ${desc}`, result.detail);
}

// ── §4  Schema: access_logs.athlete_id nullable ────────────────────────────
sec('§4  access_logs.athlete_id nullable (migration 011 §1)');

// Try inserting with null athlete_id via service role (FK will fail if UUID is fake, NOT NULL will fail first if still constrained)
const fakeUUID = '00000000-0000-0000-0000-000000000099';
// First: does a row with null athlete_id fail on NOT NULL or on FK?
const { error: nullColErr } = await svc.from('access_logs').insert({
  viewer_profile_id: fakeUUID,
  athlete_id: null,
  access_type: 'probe_null_athlete',
});

if (!nullColErr) {
  ok('access_logs.athlete_id is nullable — insert with null succeeded (unexpected: viewer FK should have failed)');
  await svc.from('access_logs').delete().eq('access_type', 'probe_null_athlete');
} else if (nullColErr.message.includes('not-null') || nullColErr.code === '23502') {
  fail('access_logs.athlete_id is still NOT NULL', 'Migration 011 §1 not applied → coach aggregate logs silently fail');
} else if (nullColErr.message.includes('foreign key') || nullColErr.code === '23503') {
  ok('access_logs.athlete_id is nullable (FK error hit before NOT NULL — column accepts null)');
} else {
  warn('access_logs.athlete_id nullable status unclear', `${nullColErr.code}: ${nullColErr.message}`);
}

// ── §5  audit_logs INSERT tightness ───────────────────────────────────────
sec('§5  audit_logs INSERT policy (migration 011 §6 — spoofing blocked)');

// Anon insert should fail (no JWT = get_my_profile_id() = NULL → NULL != UUID)
const { error: anonAuditErr } = await anon.from('audit_logs').insert({
  actor_profile_id: fakeUUID,
  action: 'rls_probe_spoof',
  target_type: 'test',
  target_id: fakeUUID,
});
if (anonAuditErr) {
  ok('anon cannot INSERT into audit_logs (spoofing blocked)');
} else {
  fail('anon CAN INSERT into audit_logs', 'Migration 011 §6 not applied — run SQL in Supabase Dashboard');
  await svc.from('audit_logs').delete().eq('action', 'rls_probe_spoof');
}

// Also test: service role can still insert (bypasses RLS)
const { error: svcAuditErr } = await svc.from('audit_logs').insert({
  actor_profile_id: fakeUUID,   // FK will fail if profile doesn't exist
  action: 'rls_probe_svc_test',
  target_type: 'test',
  target_id: fakeUUID,
});
if (!svcAuditErr) {
  ok('service role can INSERT into audit_logs (bypasses RLS — expected)');
  await svc.from('audit_logs').delete().eq('action', 'rls_probe_svc_test');
} else if (svcAuditErr.code === '23503') {
  ok('service role INSERT reached FK check (not RLS) — RLS bypass confirmed');
} else {
  warn('service role audit_log insert failed unexpectedly', `${svcAuditErr.code}: ${svcAuditErr.message}`);
}

// ── §6  access_logs INSERT tightness ──────────────────────────────────────
sec('§6  access_logs INSERT policy (migration 011 §5 — spoofing blocked)');

const { error: anonAccessErr } = await anon.from('access_logs').insert({
  viewer_profile_id: fakeUUID,
  athlete_id: fakeUUID,
  access_type: 'rls_probe_spoof',
});
if (anonAccessErr) {
  ok('anon cannot INSERT into access_logs (spoofing blocked)');
} else {
  fail('anon CAN INSERT into access_logs', 'Migration 011 §5 not applied');
  await svc.from('access_logs').delete().eq('access_type', 'rls_probe_spoof');
}

// ── §7  alerts INSERT tightness ────────────────────────────────────────────
sec('§7  alerts INSERT (migration 011 §7 — staff-only, not anon)');

const { error: anonAlertErr } = await anon.from('alerts').insert({
  athlete_id: fakeUUID, checkin_id: fakeUUID,
  severity: 'red', trigger_type: 'test',
  status: 'open',
});
if (anonAlertErr) {
  ok('anon cannot INSERT into alerts (staff-only policy enforced)');
} else {
  fail('anon CAN INSERT into alerts', 'Migration 011 §7 not applied');
  await svc.from('alerts').delete().eq('trigger_type', 'test');
}

// ── §8  API route auth gates ──────────────────────────────────────────────
sec('§8  API route auth gates (localhost:3000)');

const BASE = 'http://localhost:3000';
async function probeApi(method, path, expectStatus, label) {
  try {
    const r = await fetch(`${BASE}${path}`, { method, headers: { 'Content-Type': 'application/json' } });
    r.status === expectStatus
      ? ok(`${method} ${path} → ${r.status} (${label})`)
      : fail(`${method} ${path} → ${r.status}`, `expected ${expectStatus} (${label}): ${(await r.text().catch(()=>'')).slice(0,100)}`);
  } catch(e) { fail(`${method} ${path}`, e.message); }
}

await probeApi('POST', '/api/coach/aggregate',    401, 'no auth');
await probeApi('POST', '/api/checkins',            401, 'no auth');
await probeApi('DELETE','/api/account/delete',     401, 'no auth');
await probeApi('POST', '/api/consent',             401, 'no auth');
await probeApi('POST', '/api/psychiatrist/athlete',401, 'no auth');

// ── §9  Edge Function deployed? ───────────────────────────────────────────
sec('§9  Edge Function: send-alert-email');

try {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/send-alert-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer definitely_wrong' },
    body: JSON.stringify({ type: 'INSERT', table: 'alerts', record: {} }),
  });
  const body = await r.text().catch(() => '');
  if (r.status === 401) {
    ok('send-alert-email DEPLOYED — auth check working (401 on wrong secret)');
  } else if (r.status === 404) {
    fail('send-alert-email NOT DEPLOYED',
      'Deploy via Supabase Dashboard → Edge Functions → New Function\n' +
      '     or: brew install supabase/tap/supabase && supabase functions deploy send-alert-email --project-ref doeycpheigjihvfvupid');
  } else if (r.status === 500) {
    warn('send-alert-email deployed but 500', `Check: RESEND_API_KEY, WEBHOOK_SECRET, APP_URL secrets\n     body: ${body.slice(0,100)}`);
  } else {
    warn(`send-alert-email returned ${r.status}`, body.slice(0, 150));
  }
} catch(e) { fail('Edge Function fetch failed', e.message); }

// ── §10 Check SECURITY DEFINER fn revocation ──────────────────────────────
sec('§10 SECURITY DEFINER functions: anon revoked (migration 011 §8)');

// If anon can call get_my_profile_id(), it was not revoked
const { data: fnData, error: fnErr } = await anon.rpc('get_my_profile_id');
if (fnErr && (fnErr.message.includes('permission denied') || fnErr.code === '42501')) {
  ok('anon cannot call get_my_profile_id() — REVOKE applied');
} else if (fnData === null && !fnErr) {
  // Returns null (auth.uid() = null for anon) — function is callable but harmless
  warn('anon can CALL get_my_profile_id() but gets null', 'Migration 011 §8 REVOKE not applied — function executes but returns null (low risk)');
} else {
  warn('get_my_profile_id() check inconclusive', JSON.stringify({ data: fnData, error: fnErr?.message }));
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(62)}`);
console.log(`  RESULTS: ${passed} passed  |  ${failed} failed  |  ${warned} warnings`);
console.log(`${'═'.repeat(62)}`);

if (failed > 0) {
  console.log('\n📋 REQUIRED ACTIONS:');
  console.log('   1. Supabase Dashboard → SQL Editor → run migration 011:');
  console.log('      supabase/migrations/011_rls_security_hardening.sql');
  console.log('   2. Deploy Edge Function (see §9 output above)');
}
process.exit(failed > 0 ? 1 : 0);
