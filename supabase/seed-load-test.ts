#!/usr/bin/env bun
/**
 * Load-test seed: 100 orgs × 100 teams × 100 athletes = 1,000,000 athletes
 * Uses Supabase REST API (service role) with parallel batch inserts.
 * No SQL statement timeout — each HTTP call is small and fast.
 *
 * Usage:
 *   bun supabase/seed-load-test.ts           # seed
 *   bun supabase/seed-load-test.ts --wipe    # wipe all load-test data
 *   bun supabase/seed-load-test.ts --verify  # just print counts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://doeycpheigjihvfvupid.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZXljcGhlaWdqaWh2ZnZ1cGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjIzNSwiZXhwIjoyMDkwMjQyMjM1fQ.6OnUth2brJjV37VrgDtXiWiXJJX5uHJD4ZBrigO4NtE";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Config ────────────────────────────────────────────────────────────────────
const N_ORGS   = 100;
const N_TEAMS  = 100;
const N_ATH    = 100;
const BATCH    = 100;   // rows per insert call (keep small — triggers slow upserts)
const PARALLEL = 20;    // concurrent insert calls

// ── UUID helpers ──────────────────────────────────────────────────────────────
const pad  = (n: number, len = 4) => String(n).padStart(len, "0");
const pad12 = (n: number)          => String(n).padStart(12, "0");

const orgId   = (o: number) => `aaaaaaaa-0000-0000-0000-${pad12(o)}`;
const teamId  = (o: number, t: number) => `bbbbbbbb-${pad(o)}-0000-${pad(t)}-000000000001`;
const coachId = (o: number, t: number) => `cccccccc-${pad(o)}-0000-${pad(t)}-000000000001`;
const athId   = (o: number, t: number, a: number) => `dddddddd-${pad(o)}-${pad(t)}-${pad(a)}-000000000001`;
const adminId = (o: number) => `eeeeeeee-0000-0000-0000-${pad12(o)}`;

// ── Name arrays ───────────────────────────────────────────────────────────────
const ORG_NAMES = [
  "State University","Pacific University","Atlantic College","Mountain State U",
  "Central University","Northern College","Southern University","Eastern State U",
  "Western College","Lakeside University","Riverside Athletics","Hillcrest U",
  "Valley College","Coastal University","Midland State","Pinewood U",
  "Oakwood College","Maplewood University","Cedar State","Birch College",
  "Elmwood University","Aspen Athletics","Redwood State","Sequoia U",
  "Horizon University","Summit College","Crestview State","Ridgeline U",
  "Brookfield College","Clearwater University","Stonebridge State","Ironwood U",
  "Harborview College","Bayshore University","Lakeview State","Bluewater U",
  "Greenfield College","Meadowbrook University","Springdale State","Autumnfield U",
  "Winterhaven College","Sunnyside University","Ravenwood State","Thornberry U",
  "Foxwood College","Pinecrest University","Willowbrook State","Cedarwood U",
  "Hawthorn College","Juniper University","Sycamore State","Magnolia U",
  "Cypress College","Dogwood University","Hickory State","Chestnut U",
  "Walnut College","Hazel University","Alder State","Cottonwood U",
  "Poplar College","Spruce University","Fir State","Larch U",
  "Hemlock College","Tamarack University","Buckeye State","Buckthorn U",
  "Ironbark College","Silkwood University","Stonewood State","Ashwood U",
  "Briarwood College","Thornwood University","Driftwood State","Firewood U",
  "Harewood College","Lakewood University","Crestwood State","Northwood U",
  "Southwood College","Eastwood University","Westwood State","Midwood U",
  "Bridgewater College","Stonewater University","Clearstone State","Ironstone U",
  "Goldfields College","Silverbrook University","Copperdale State","Bronzewood U",
  "Titanium College","Sterling University","Platinum State","Diamond U",
  "Sapphire College","Ruby University","Emerald State","Topaz U",
  "Opal College","Garnet University","Onyx State","Obsidian U",
];

const SPORTS = [
  "Football","Basketball","Soccer","Volleyball","Swimming",
  "Track & Field","Tennis","Golf","Cross Country","Wrestling",
  "Baseball","Softball","Lacrosse","Field Hockey","Gymnastics",
  "Rowing","Water Polo","Ice Hockey","Rugby","Fencing",
  "Archery","Cycling","Equestrian","Sailing","Skiing",
  "Squash","Table Tennis","Triathlon","Ultimate Frisbee","Weightlifting",
  "Badminton","Boxing","Canoe","Climbing","Diving",
  "Handball","Judo","Karate","Kickboxing","Marathon",
  "Mixed Martial Arts","Polo","Powerlifting","Racquetball","Shooting",
  "Skateboarding","Surfing","Taekwondo","Beach Volleyball","Wheelchair Basketball",
  "Football B","Basketball B","Soccer B","Volleyball B","Swimming B",
  "Track B","Tennis B","Golf B","Cross Country B","Wrestling B",
  "Baseball B","Softball B","Lacrosse B","Field Hockey B","Gymnastics B",
  "Rowing B","Water Polo B","Ice Hockey B","Rugby B","Fencing B",
  "Archery B","Cycling B","Equestrian B","Sailing B","Skiing B",
  "Squash B","Table Tennis B","Triathlon B","Ultimate Frisbee B","Weightlifting B",
  "Badminton B","Boxing B","Canoe B","Climbing B","Diving B",
  "Handball B","Judo B","Karate B","Kickboxing B","Marathon B",
  "Football C","Basketball C","Soccer C","Volleyball C","Swimming C",
  "Track C","Tennis C","Golf C","Cross Country C","Wrestling C",
];

const FIRST_NAMES = [
  "Jordan","Alex","Morgan","Taylor","Casey","Riley","Jamie","Drew",
  "Quinn","Blake","Avery","Parker","Hayden","Cameron","Reagan","Logan",
  "Skylar","Peyton","Reese","Kendall","Charlie","Finley","Rowan","Emery",
  "River","Phoenix","Sage","Remi","Kai","Dakota","Indigo","Shiloh",
  "Eden","Lane","Robin","Wren","Spencer","Lennon","Harper","Emerson",
  "Sloane","Paige","Briar","Sutton","Marlowe","Ellis","Harlow","Demi",
  "Jess","Lee","Ren","Bex","Kit","Ari","Ray","Skye","Cas","Noel",
  "Paz","Sol","Ira","Bay","Rue","Roy","Jan","Max","Kim","Pat",
  "Cam","Sky","Sam","Ash","Bly","Frey","Soren","Tal","Cyan","Jory",
  "Rook","Sable","Teal","Umber","Vance","Wynn","Zeal","Acer","Bard","Crest",
  "Dell","Echo","Flint","Gale","Heath","Isle","Jade","Kern","Lark","Marsh",
  "Nova","Onyx",
];

const LAST_NAMES = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis",
  "Wilson","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin",
  "Thompson","Moore","Young","Allen","King","Wright","Scott","Torres",
  "Hill","Green","Adams","Baker","Nelson","Carter","Mitchell","Perez",
  "Roberts","Turner","Phillips","Campbell","Parker","Evans","Edwards","Collins",
  "Stewart","Morris","Rogers","Reed","Cook","Morgan","Bell","Murphy",
  "Bailey","Rivera","Cooper","Richardson","Cox","Howard","Ward","Peterson",
  "Gray","Ramirez","James","Watson","Brooks","Kelly","Sanders","Price",
  "Bennett","Wood","Barnes","Ross","Henderson","Coleman","Jenkins","Perry",
  "Powell","Long","Patterson","Hughes","Flores","Washington","Butler","Simmons",
  "Foster","Gonzales","Bryant","Alexander","Russell","Griffin","Diaz","Hayes",
  "Myers","Ford","Hamilton","Graham","Sullivan","Wallace","Woods","Cole",
  "West","Jordan","Owens","Reynolds","Fisher","Ellis",
];

const COACH_NAMES = [
  "Alex","Blake","Casey","Dana","Evan","Fran","Glen","Hana",
  "Ivan","Jane","Kyle","Lena","Mike","Nina","Omar","Pam",
  "Quinn","Rosa","Sam","Tara","Ursa","Vera","Will","Xena",
  "Yale","Zoe","Arlo","Bree","Colt","Dune","Eric","Faye",
  "Greg","Hope","Iris","Jake","Kara","Luke","Mara","Nash",
  "Opal","Pete","Reba","Seth","Tess","Una","Vince","Wren",
  "Xyla","York","Zara","Adam","Beth","Cole","Dawn","Earl",
  "Fern","Gale","Holt","Isla","Joel","Kim","Lars","Milo",
  "Nora","Owen","Prue","Reid","Sara","Troy","Uma","Val",
  "Wade","Xan","Yara","Zeb","Abel","Blythe","Cruz","Dell",
  "Eben","Fox","Gray","Hayes","Ike","Jean","Knox","Lane",
  "Moss","Nell","Otto","Penn","Rex","Shaw","Ty","Upton",
  "Vail","West","Xio","Yul","Zola","Ace","Bay","Clay",
];

const ORG_TYPES = ["university","high_school","club","professional"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
async function batchInsert<T extends object>(
  table: string,
  rows: T[],
  label: string,
  opts: { upsert?: boolean; parallel?: number; batchSize?: number } = {},
) {
  const batchSize  = opts.batchSize  ?? BATCH;
  const concurrent = opts.parallel   ?? PARALLEL;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize * concurrent) {
    const window = rows.slice(i, i + batchSize * concurrent);
    const chunks: T[][] = [];
    for (let j = 0; j < window.length; j += batchSize) {
      chunks.push(window.slice(j, j + batchSize));
    }
    const results = await Promise.all(
      chunks.map((chunk) => {
        if (opts.upsert) {
          return supabase.from(table).upsert(chunk, { onConflict: "id", ignoreDuplicates: true });
        }
        return supabase.from(table).insert(chunk);
      }),
    );
    for (const { error } of results) {
      if (error) throw new Error(`${table} insert error: ${error.message}`);
    }
    inserted += window.length;
    process.stdout.write(`\r  ${label}: ${inserted.toLocaleString()} / ${rows.length.toLocaleString()}`);
  }
  console.log(`\r  ${label}: ${rows.length.toLocaleString()} rows done         `);
}

// ── Wipe ─────────────────────────────────────────────────────────────────────
async function wipe() {
  console.log("Wiping load-test data...");

  // Null out FK refs that would block profile deletes
  console.log("  Nulling linked_athlete_id references...");
  const { error: e0 } = await supabase
    .from("profiles")
    .update({ linked_athlete_id: null } as any)
    .like("linked_athlete_id::text", "dddddddd-%");
  if (e0) console.warn("  linked_athlete_id clear:", e0.message);

  // Delete in FK-safe order using range deletes (no timeout — REST, not SQL)
  // Use col::text cast so LIKE works on UUID columns via PostgREST
  const steps: { table: string; col: string; pattern: string }[] = [
    { table: "alerts",        col: "organization_id", pattern: "aaaaaaaa-%" },
    { table: "checkins",      col: "athlete_id",      pattern: "dddddddd-%" },
    { table: "profiles",      col: "id",              pattern: "dddddddd-%" },
    { table: "profiles",      col: "id",              pattern: "cccccccc-%" },
    { table: "profiles",      col: "id",              pattern: "eeeeeeee-%" },
    { table: "teams",         col: "id",              pattern: "bbbbbbbb-%" },
    { table: "organizations", col: "id",              pattern: "aaaaaaaa-0000-0000-0000-%" },
  ];

  for (const { table, col, pattern } of steps) {
    process.stdout.write(`  DELETE ${table} WHERE ${col} LIKE '${pattern}'... `);
    const { error } = await (supabase.from(table) as any)
      .delete()
      .filter(`${col}::text`, "like", pattern);
    if (error) {
      console.log(`WARN: ${error.message}`);
    } else {
      console.log("ok");
    }
  }
  console.log("Wipe complete.");
}

// ── Verify ────────────────────────────────────────────────────────────────────
async function verify() {
  // Use RPC to run raw SQL counts — JS client .filter('col::text','like',...) doesn't
  // work in count-only mode; the cast syntax is rejected by PostgREST.
  const { data, error } = await supabase.rpc("load_test_counts" as any);
  if (error || !data) {
    // Fallback: fetch first row of each table filtered by known UUID ranges
    // UUID sort order: aaaaaaaa-... is between aaaaaaaa-0000... and aaaaaaab-...
    const [orgs, teams, ath, coaches, admins, checkins, alerts] = await Promise.all([
      supabase.from("organizations").select("id", { count: "exact", head: true })
        .gte("id", "aaaaaaaa-0000-0000-0000-000000000001").lte("id", "aaaaaaaa-ffff-ffff-ffff-ffffffffffff"),
      supabase.from("teams").select("id", { count: "exact", head: true })
        .gte("id", "bbbbbbbb-0000-0000-0000-000000000000").lte("id", "bbbbbbbb-ffff-ffff-ffff-ffffffffffff"),
      supabase.from("profiles").select("id", { count: "exact", head: true })
        .gte("id", "dddddddd-0000-0000-0000-000000000000").lte("id", "dddddddd-ffff-ffff-ffff-ffffffffffff"),
      supabase.from("profiles").select("id", { count: "exact", head: true })
        .gte("id", "cccccccc-0000-0000-0000-000000000000").lte("id", "cccccccc-ffff-ffff-ffff-ffffffffffff"),
      supabase.from("profiles").select("id", { count: "exact", head: true })
        .gte("id", "eeeeeeee-0000-0000-0000-000000000000").lte("id", "eeeeeeee-ffff-ffff-ffff-ffffffffffff"),
      supabase.from("checkins").select("id", { count: "exact", head: true })
        .gte("athlete_id", "dddddddd-0000-0000-0000-000000000000").lte("athlete_id", "dddddddd-ffff-ffff-ffff-ffffffffffff"),
      supabase.from("alerts").select("id", { count: "exact", head: true })
        .gte("organization_id", "aaaaaaaa-0000-0000-0000-000000000001").lte("organization_id", "aaaaaaaa-ffff-ffff-ffff-ffffffffffff"),
    ]);
    console.log("\n=== Load-test counts ===");
    console.log(`  orgs:     ${(orgs.count ?? 0).toLocaleString()}`);
    console.log(`  teams:    ${(teams.count ?? 0).toLocaleString()}`);
    console.log(`  athletes: ${(ath.count ?? 0).toLocaleString()}`);
    console.log(`  coaches:  ${(coaches.count ?? 0).toLocaleString()}`);
    console.log(`  admins:   ${(admins.count ?? 0).toLocaleString()}`);
    console.log(`  checkins: ${(checkins.count ?? 0).toLocaleString()}`);
    console.log(`  alerts:   ${(alerts.count ?? 0).toLocaleString()}`);
    return;
  }
  const r = data[0] ?? data;
  console.log("\n=== Load-test counts ===");
  for (const [k, v] of Object.entries(r)) {
    console.log(`  ${k.padEnd(10)}: ${Number(v).toLocaleString()}`);
  }
}

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
  const start = Date.now();
  console.log(`\n=== Seeding ${N_ORGS} orgs × ${N_TEAMS} teams × ${N_ATH} athletes ===\n`);

  // 1. Organizations (100)
  const orgs = Array.from({ length: N_ORGS }, (_, i) => ({
    id:           orgId(i + 1),
    name:         `${ORG_NAMES[i]} Athletics (Load Test)`,
    type:         ORG_TYPES[i % 4],
    reminder_day: (i + 1) % 7,
  }));
  await batchInsert("organizations", orgs, "orgs", { upsert: true });

  // 2. Teams (10,000)
  const teams = [];
  for (let o = 1; o <= N_ORGS; o++) {
    for (let t = 1; t <= N_TEAMS; t++) {
      teams.push({
        id:              teamId(o, t),
        organization_id: orgId(o),
        name:            `${SPORTS[t - 1]} Team`,
        sport:           SPORTS[t - 1],
        active:          true,
      });
    }
  }
  await batchInsert("teams", teams, "teams", { upsert: true });

  // 3. Coaches (10,000)
  const coaches = [];
  for (let o = 1; o <= N_ORGS; o++) {
    for (let t = 1; t <= N_TEAMS; t++) {
      coaches.push({
        id:              coachId(o, t),
        auth_user_id:    `cccccccc-${pad(o)}-aaaa-${pad(t)}-000000000001`,
        full_name:       `${COACH_NAMES[(t - 1) % COACH_NAMES.length]} Coach`,
        email:           `coach_o${o}_t${t}@loadtest.edu`,
        role:            "coach",
        organization_id: orgId(o),
        team_id:         teamId(o, t),
        onboarded:       true,
      });
    }
  }
  await batchInsert("profiles", coaches, "coaches", { upsert: true });

  // 4. Admins (100)
  //    Org 1 uses eeeeeeee-... as a load-test placeholder; the real sjs25h@fsu.edu
  //    user (profile b4baa206, auth_user_id 82df981e) is patched separately below
  //    so their existing profile points at load-test org 1.
  const admins = Array.from({ length: N_ORGS }, (_, i) => ({
    id:              adminId(i + 1),
    auth_user_id:    `eeeeeeee-${pad(i + 1)}-aaaa-0000-000000000001`,
    full_name:       i === 0 ? "Load Test Admin" : `Admin Org ${i + 1}`,
    email:           i === 0 ? "admin@loadtest.edu" : `admin_o${i + 1}@loadtest.edu`,
    role:            "admin",
    organization_id: orgId(i + 1),
    team_id:         null,
    onboarded:       true,
  }));
  await batchInsert("profiles", admins, "admins", { upsert: true });

  // Patch the real sjs25h@fsu.edu profile (id b4baa206, auth_user_id 82df981e)
  // to point at load-test org 1 so RLS works when signing in via the app/audit.
  await supabase
    .from("profiles")
    .update({ organization_id: orgId(1), onboarded: true })
    .eq("id", "b4baa206-3548-4e76-8e2c-f9ab733f2b22");
  console.log("  ↳ patched sjs25h@fsu.edu profile → org 1");

  // 5. Athletes (1,000,000)
  const athletes = [];
  for (let o = 1; o <= N_ORGS; o++) {
    for (let t = 1; t <= N_TEAMS; t++) {
      for (let a = 1; a <= N_ATH; a++) {
        athletes.push({
          id:              athId(o, t, a),
          auth_user_id:    `dddddddd-${pad(o)}-${pad(t)}-${pad(a)}-aaaaaaaaaaaa`,
          full_name:       `${FIRST_NAMES[(a - 1) % FIRST_NAMES.length]} ${LAST_NAMES[(a - 1) % LAST_NAMES.length]}`,
          email:           `athlete_o${o}_t${t}_a${a}@loadtest.edu`,
          role:            "athlete",
          organization_id: orgId(o),
          team_id:         teamId(o, t),
          onboarded:       true,
        });
      }
    }
  }
  await batchInsert("profiles", athletes, "athletes", { upsert: true });

  // 6. Checkins (2,000,000) — 2 per athlete
  const checkins = [];
  const now = Date.now();
  for (let o = 1; o <= N_ORGS; o++) {
    for (let t = 1; t <= N_TEAMS; t++) {
      for (let a = 1; a <= N_ATH; a++) {
        const base = 4.0 + (((o * 7 + t * 17 + a * 31) % 60) / 10.0);
        for (let wk = 0; wk <= 1; wk++) {
          const e  = Math.max(1, Math.min(10, Math.round(base + ((o + t + a + wk)     % 30 - 15) / 10)));
          const r  = Math.max(1, Math.min(10, Math.round(base + ((o * 2 + t + a + wk) % 28 - 14) / 10)));
          const rc = Math.max(1, Math.min(10, Math.round(base + ((a * 3 + t + o + wk) % 26 - 13) / 10)));
          const s  = Math.max(1, Math.min(10, Math.round(base + ((t + a * 2 + o + wk) % 24 - 12) / 10)));
          const minScore = Math.min(e, r, rc, s);
          const risk = minScore < 3 ? "red" : minScore < 5 ? "yellow" : "green";
          const msAgo = ((wk * 7 + (a % 7)) * 86400 + ((t * 3 + a) % 12) * 3600) * 1000;
          checkins.push({
            athlete_id:       athId(o, t, a),
            team_id:          teamId(o, t),
            mode:             "weekly",
            emotional_score:  e,
            resilience_score: r,
            recovery_score:   rc,
            support_score:    s,
            risk_level:       risk,
            is_private:       true,
            wants_followup:   false,
            completed_at:     new Date(now - msAgo).toISOString(),
          });
        }
      }
    }
  }
  await batchInsert("checkins", checkins, "checkins");

  // 7. Alerts (~50,000 — every 20th athlete)
  const alerts = [];
  for (let o = 1; o <= N_ORGS; o++) {
    for (let t = 1; t <= N_TEAMS; t++) {
      for (let a = 1; a <= N_ATH; a++) {
        if ((o * 10000 + t * 100 + a) % 20 === 0) {
          alerts.push({
            athlete_id:      athId(o, t, a),
            team_id:         teamId(o, t),
            organization_id: orgId(o),
            severity:        a % 3 === 0 ? "red" : "yellow",
            trigger_type:    "risk_score",
            status:          "open",
            created_at:      new Date(now - ((o + t + a) % 72) * 3600000).toISOString(),
          });
        }
      }
    }
  }
  await batchInsert("alerts", alerts, "alerts");

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s`);
  await verify();
}

// ── Checkins + alerts for a single org (fast — use for dashboard testing) ────
async function seedOneOrgCheckins(targetOrg = 1) {
  const start = Date.now();
  console.log(`\n=== Seeding checkins + alerts for org ${targetOrg} only ===\n`);
  const now = Date.now();

  const checkins = [];
  for (let t = 1; t <= N_TEAMS; t++) {
    for (let a = 1; a <= N_ATH; a++) {
      const base = 4.0 + (((targetOrg * 7 + t * 17 + a * 31) % 60) / 10.0);
      for (let wk = 0; wk <= 1; wk++) {
        const e  = Math.max(1, Math.min(10, Math.round(base + ((targetOrg + t + a + wk)     % 30 - 15) / 10)));
        const r  = Math.max(1, Math.min(10, Math.round(base + ((targetOrg * 2 + t + a + wk) % 28 - 14) / 10)));
        const rc = Math.max(1, Math.min(10, Math.round(base + ((a * 3 + t + targetOrg + wk) % 26 - 13) / 10)));
        const s  = Math.max(1, Math.min(10, Math.round(base + ((t + a * 2 + targetOrg + wk) % 24 - 12) / 10)));
        const minScore = Math.min(e, r, rc, s);
        const risk = minScore < 3 ? "red" : minScore < 5 ? "yellow" : "green";
        const msAgo = ((wk * 7 + (a % 7)) * 86400 + ((t * 3 + a) % 12) * 3600) * 1000;
        checkins.push({
          athlete_id: athId(targetOrg, t, a), team_id: teamId(targetOrg, t), mode: "weekly",
          emotional_score: e, resilience_score: r, recovery_score: rc, support_score: s,
          risk_level: risk, is_private: true, wants_followup: false,
          completed_at: new Date(now - msAgo).toISOString(),
        });
      }
    }
  }
  // Serial inserts with tiny batches — checkins have 3 composite indexes + FK checks
  // so concurrent inserts cause lock contention and statement timeouts.
  await batchInsert("checkins", checkins, `checkins (org ${targetOrg})`, { batchSize: 25, parallel: 1 });

  const alerts = [];
  for (let t = 1; t <= N_TEAMS; t++) {
    for (let a = 1; a <= N_ATH; a++) {
      if ((targetOrg * 10000 + t * 100 + a) % 20 === 0) {
        alerts.push({
          athlete_id: athId(targetOrg, t, a), team_id: teamId(targetOrg, t),
          organization_id: orgId(targetOrg),
          severity: a % 3 === 0 ? "red" : "yellow", trigger_type: "risk_score",
          status: "open", created_at: new Date(now - ((targetOrg + t + a) % 72) * 3600000).toISOString(),
        });
      }
    }
  }
  await batchInsert("alerts", alerts, `alerts (org ${targetOrg})`, { batchSize: 100, parallel: 5 });

  console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  await verify();
}

// ── Main ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const orgArg = args.find(a => a.startsWith("--org="));
const targetOrg = orgArg ? parseInt(orgArg.split("=")[1]) : 1;

if (args.includes("--wipe")) {
  wipe().then(() => verify()).catch(console.error);
} else if (args.includes("--verify")) {
  verify().catch(console.error);
} else if (args.includes("--checkins-one-org")) {
  // Seed checkins + alerts for one org only (20K checkins, ~500 alerts)
  // Use --org=N to target a specific org (default: 1)
  seedOneOrgCheckins(targetOrg).catch(console.error);
} else {
  seed().catch(console.error);
}
