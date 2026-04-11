/**
 * Check-In Setup Script
 * Creates auth users, database schema, RLS policies, and seed data
 * Run with: node scripts/setup.mjs
 */

const SUPABASE_URL = "https://doeycpheigjihvfvupid.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZXljcGhlaWdqaWh2ZnZ1cGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjIzNSwiZXhwIjoyMDkwMjQyMjM1fQ.6OnUth2brJjV37VrgDtXiWiXJJX5uHJD4ZBrigO4NtE";

const headers = {
  "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  "apikey": SERVICE_ROLE_KEY,
  "Content-Type": "application/json",
};

const PASSWORD = "CheckIn2024!";

// Users to create
const USERS = [
  { email: "admin@checkin.demo", name: "Alex Director", role: "admin" },
  { email: "support@checkin.demo", name: "Dr. Sarah Wellness", role: "support" },
  { email: "coach.mike@checkin.demo", name: "Coach Mike Johnson", role: "coach", team: "basketball" },
  { email: "coach.lisa@checkin.demo", name: "Coach Lisa Chen", role: "coach", team: "soccer" },
  { email: "jordan@checkin.demo", name: "Jordan Williams", role: "athlete", team: "basketball" },
  { email: "marcus@checkin.demo", name: "Marcus Davis", role: "athlete", team: "basketball" },
  { email: "tyler@checkin.demo", name: "Tyler Brown", role: "athlete", team: "basketball" },
  { email: "chris@checkin.demo", name: "Chris Thompson", role: "athlete", team: "basketball" },
  { email: "emma@checkin.demo", name: "Emma Rodriguez", role: "athlete", team: "soccer" },
  { email: "sofia@checkin.demo", name: "Sofia Patel", role: "athlete", team: "soccer" },
  { email: "maya@checkin.demo", name: "Maya Johnson", role: "athlete", team: "soccer" },
  { email: "ava@checkin.demo", name: "Ava Kim", role: "athlete", team: "soccer" },
];

async function apiCall(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, { headers, ...options });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

async function runSQL(sql) {
  // Use the Supabase SQL endpoint
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

// Step 1: Create auth users
async function createAuthUsers() {
  console.log("\n📋 STEP 1: Creating auth users...\n");
  const userIds = {};

  for (const user of USERS) {
    const res = await apiCall("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: user.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: user.name },
      }),
    });

    if (res.status === 200 || res.status === 201) {
      userIds[user.email] = res.data.id;
      console.log(`  ✅ ${user.role.padEnd(8)} | ${user.email.padEnd(28)} | ${user.name}`);
    } else if (res.data?.msg?.includes("already been registered") || res.data?.message?.includes("already been registered")) {
      // User exists, get their ID
      const listRes = await apiCall(`/auth/v1/admin/users?page=1&per_page=50`);
      if (listRes.status === 200) {
        const existing = listRes.data.users?.find(u => u.email === user.email);
        if (existing) {
          userIds[user.email] = existing.id;
          console.log(`  ⏭️  ${user.role.padEnd(8)} | ${user.email.padEnd(28)} | Already exists`);
        }
      }
    } else {
      console.log(`  ❌ ${user.email}: ${JSON.stringify(res.data)}`);
    }
  }

  return userIds;
}

// Step 2: Create schema via PostgREST (we'll create a helper function first)
async function setupSchema() {
  console.log("\n📋 STEP 2: Setting up database schema...\n");

  // First, let's try to create an exec_sql function using the SQL endpoint
  // Supabase exposes a /pg endpoint for direct SQL in newer versions
  // Try multiple approaches

  // Approach: Use the database REST API with service role
  // We need to create the schema. Let's try the /sql endpoint
  const sqlRes = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "SELECT 1 as test" }),
  });

  if (sqlRes.ok) {
    console.log("  ✅ Direct SQL access available via /pg/query");
    return "pg_query";
  }

  // Try /sql endpoint
  const sqlRes2 = await fetch(`${SUPABASE_URL}/sql`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query: "SELECT 1 as test" }),
  });

  if (sqlRes2.ok) {
    console.log("  ✅ Direct SQL access available via /sql");
    return "sql";
  }

  // Try the management API approach
  console.log("  ⚠️  Direct SQL not available via REST. Will use PostgREST approach.");
  return "postgrest";
}

async function executeSQLViaEndpoint(endpoint, sql) {
  const url = endpoint === "pg_query" ? `${SUPABASE_URL}/pg/query` : `${SUPABASE_URL}/sql`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql }),
  });
  return { ok: res.ok, status: res.status, data: await res.text() };
}

// Step 3: Insert data via PostgREST (works with service role key)
async function insertData(userIds) {
  console.log("\n📋 STEP 3: Inserting data via API...\n");

  const teamMapping = {};
  const profileMapping = {};

  // Create organization
  console.log("  Creating organization...");
  const orgRes = await apiCall("/rest/v1/organizations", {
    method: "POST",
    body: JSON.stringify({
      name: "State University Athletics",
      type: "university",
      reminder_day: 1,
    }),
    headers: { ...headers, "Prefer": "return=representation" },
  });

  let orgId;
  if (orgRes.status === 201 && orgRes.data?.[0]) {
    orgId = orgRes.data[0].id;
    console.log(`  ✅ Organization: ${orgId}`);
  } else {
    // Maybe already exists, try to get it
    const getOrg = await apiCall("/rest/v1/organizations?name=eq.State%20University%20Athletics&select=id");
    if (getOrg.data?.[0]) {
      orgId = getOrg.data[0].id;
      console.log(`  ⏭️  Organization exists: ${orgId}`);
    } else {
      console.log(`  ❌ Org creation failed: ${JSON.stringify(orgRes.data)}`);
      return;
    }
  }

  // Create teams
  console.log("  Creating teams...");
  for (const team of [
    { name: "Men's Basketball", sport: "Basketball", key: "basketball" },
    { name: "Women's Soccer", sport: "Soccer", key: "soccer" },
  ]) {
    const teamRes = await apiCall("/rest/v1/teams", {
      method: "POST",
      body: JSON.stringify({
        organization_id: orgId,
        name: team.name,
        sport: team.sport,
      }),
      headers: { ...headers, "Prefer": "return=representation" },
    });

    if (teamRes.status === 201 && teamRes.data?.[0]) {
      teamMapping[team.key] = teamRes.data[0].id;
      console.log(`  ✅ Team: ${team.name} → ${teamRes.data[0].id}`);
    } else {
      const getTeam = await apiCall(`/rest/v1/teams?name=eq.${encodeURIComponent(team.name)}&select=id`);
      if (getTeam.data?.[0]) {
        teamMapping[team.key] = getTeam.data[0].id;
        console.log(`  ⏭️  Team exists: ${team.name}`);
      } else {
        console.log(`  ❌ Team "${team.name}" failed: ${JSON.stringify(teamRes.data)}`);
      }
    }
  }

  // Create profiles
  console.log("  Creating profiles...");
  for (const user of USERS) {
    const authUserId = userIds[user.email];
    if (!authUserId) {
      console.log(`  ❌ No auth ID for ${user.email}, skipping`);
      continue;
    }

    const profileData = {
      auth_user_id: authUserId,
      full_name: user.name,
      email: user.email,
      role: user.role,
      organization_id: orgId,
      team_id: user.team ? teamMapping[user.team] : null,
      onboarded: true,
    };

    const profRes = await apiCall("/rest/v1/profiles", {
      method: "POST",
      body: JSON.stringify(profileData),
      headers: { ...headers, "Prefer": "return=representation" },
    });

    if (profRes.status === 201 && profRes.data?.[0]) {
      profileMapping[user.email] = profRes.data[0].id;
      console.log(`  ✅ Profile: ${user.name} (${user.role})`);
    } else {
      const getProf = await apiCall(`/rest/v1/profiles?auth_user_id=eq.${authUserId}&select=id`);
      if (getProf.data?.[0]) {
        profileMapping[user.email] = getProf.data[0].id;
        console.log(`  ⏭️  Profile exists: ${user.name}`);
      } else {
        console.log(`  ❌ Profile "${user.name}" failed: ${JSON.stringify(profRes.data)}`);
      }
    }
  }

  // Create invite codes
  console.log("  Creating invite codes...");
  const inviteCodes = [
    { team_id: teamMapping.basketball, code: "BBALL1", role: "athlete" },
    { team_id: teamMapping.soccer, code: "SOCCER1", role: "athlete" },
    { team_id: null, code: "STAFF01", role: "coach" },
    { team_id: null, code: "SUPPORT1", role: "support" },
  ];

  for (const invite of inviteCodes) {
    const res = await apiCall("/rest/v1/invite_codes", {
      method: "POST",
      body: JSON.stringify({
        organization_id: orgId,
        team_id: invite.team_id,
        code: invite.code,
        role: invite.role,
        created_by: profileMapping["admin@checkin.demo"],
      }),
      headers: { ...headers, "Prefer": "return=representation" },
    });
    if (res.status === 201) {
      console.log(`  ✅ Invite code: ${invite.code} (${invite.role})`);
    } else {
      console.log(`  ⏭️  Invite code ${invite.code}: ${res.status}`);
    }
  }

  // Create check-ins
  console.log("  Creating sample check-ins...");
  const checkinData = [
    // Jordan - healthy green
    { athlete: "jordan@checkin.demo", team: "basketball", scores: [
      { mood: 8, stress: 3, sleep: 7, support: 8, risk: "green", days_ago: 21 },
      { mood: 7, stress: 4, sleep: 8, support: 9, risk: "green", days_ago: 14 },
      { mood: 8, stress: 3, sleep: 7, support: 8, risk: "green", days_ago: 7 },
      { mood: 9, stress: 2, sleep: 8, support: 9, risk: "green", days_ago: 1 },
    ]},
    // Marcus - declining to yellow
    { athlete: "marcus@checkin.demo", team: "basketball", scores: [
      { mood: 7, stress: 4, sleep: 7, support: 7, risk: "green", days_ago: 21 },
      { mood: 5, stress: 6, sleep: 5, support: 6, risk: "green", days_ago: 14 },
      { mood: 4, stress: 7, sleep: 4, support: 5, risk: "green", days_ago: 7 },
      { mood: 3, stress: 8, sleep: 4, support: 4, risk: "yellow", days_ago: 1 },
    ]},
    // Tyler - struggling, red
    { athlete: "tyler@checkin.demo", team: "basketball", scores: [
      { mood: 6, stress: 5, sleep: 6, support: 7, risk: "green", days_ago: 21 },
      { mood: 4, stress: 7, sleep: 4, support: 5, risk: "green", days_ago: 14 },
      { mood: 3, stress: 8, sleep: 3, support: 3, risk: "red", days_ago: 7 },
      { mood: 2, stress: 9, sleep: 2, support: 3, risk: "red", days_ago: 1, wants_followup: true },
    ]},
    // Chris - hasn't checked in this week
    { athlete: "chris@checkin.demo", team: "basketball", scores: [
      { mood: 7, stress: 4, sleep: 7, support: 8, risk: "green", days_ago: 14 },
    ]},
    // Emma - consistently good
    { athlete: "emma@checkin.demo", team: "soccer", scores: [
      { mood: 8, stress: 3, sleep: 8, support: 9, risk: "green", days_ago: 21 },
      { mood: 9, stress: 2, sleep: 9, support: 9, risk: "green", days_ago: 14 },
      { mood: 8, stress: 3, sleep: 8, support: 8, risk: "green", days_ago: 7 },
      { mood: 8, stress: 2, sleep: 9, support: 9, risk: "green", days_ago: 1 },
    ]},
    // Sofia - yellow
    { athlete: "sofia@checkin.demo", team: "soccer", scores: [
      { mood: 6, stress: 5, sleep: 6, support: 7, risk: "green", days_ago: 14 },
      { mood: 4, stress: 8, sleep: 5, support: 3, risk: "yellow", days_ago: 2 },
    ]},
    // Maya - green
    { athlete: "maya@checkin.demo", team: "soccer", scores: [
      { mood: 7, stress: 4, sleep: 7, support: 8, risk: "green", days_ago: 3 },
    ]},
  ];

  const checkinIds = {};

  for (const athlete of checkinData) {
    const athleteProfileId = profileMapping[athlete.athlete];
    const teamId = teamMapping[athlete.team];
    if (!athleteProfileId) continue;

    for (const score of athlete.scores) {
      const completedAt = new Date(Date.now() - score.days_ago * 24 * 60 * 60 * 1000).toISOString();
      const res = await apiCall("/rest/v1/checkins", {
        method: "POST",
        body: JSON.stringify({
          athlete_id: athleteProfileId,
          team_id: teamId,
          mood_score: score.mood,
          stress_score: score.stress,
          sleep_score: score.sleep,
          support_score: score.support,
          risk_level: score.risk,
          wants_followup: score.wants_followup || false,
          completed_at: completedAt,
        }),
        headers: { ...headers, "Prefer": "return=representation" },
      });

      if (res.status === 201 && res.data?.[0]) {
        // Store last checkin id per athlete for alerts
        checkinIds[athlete.athlete] = res.data[0].id;
      }
    }
    console.log(`  ✅ Check-ins for ${athlete.athlete.split("@")[0]}`);
  }

  // Create alerts
  console.log("  Creating alerts...");
  const alertsToCreate = [
    { athlete: "marcus@checkin.demo", severity: "yellow", trigger: "risk_score", status: "open" },
    { athlete: "tyler@checkin.demo", severity: "red", trigger: "wants_followup", status: "open" },
    { athlete: "sofia@checkin.demo", severity: "yellow", trigger: "risk_score", status: "open" },
  ];

  const alertIds = {};
  for (const alert of alertsToCreate) {
    const res = await apiCall("/rest/v1/alerts", {
      method: "POST",
      body: JSON.stringify({
        athlete_id: profileMapping[alert.athlete],
        checkin_id: checkinIds[alert.athlete],
        severity: alert.severity,
        trigger_type: alert.trigger,
        status: alert.status,
      }),
      headers: { ...headers, "Prefer": "return=representation" },
    });
    if (res.status === 201 && res.data?.[0]) {
      alertIds[alert.athlete] = res.data[0].id;
      console.log(`  ✅ Alert: ${alert.athlete.split("@")[0]} (${alert.severity})`);
    } else {
      console.log(`  ⚠️  Alert for ${alert.athlete.split("@")[0]}: ${JSON.stringify(res.data)}`);
    }
  }

  // Create a follow-up
  console.log("  Creating follow-up...");
  if (alertIds["tyler@checkin.demo"]) {
    const res = await apiCall("/rest/v1/followups", {
      method: "POST",
      body: JSON.stringify({
        athlete_id: profileMapping["tyler@checkin.demo"],
        alert_id: alertIds["tyler@checkin.demo"],
        assigned_to_profile_id: profileMapping["coach.mike@checkin.demo"],
        assigned_by_profile_id: profileMapping["support@checkin.demo"],
        reason: "Athlete has shown declining scores over 3 weeks. Please check in during practice.",
        status: "in_progress",
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      }),
      headers: { ...headers, "Prefer": "return=representation" },
    });
    if (res.status === 201) {
      console.log(`  ✅ Follow-up for Tyler → Coach Mike`);
    } else {
      console.log(`  ⚠️  Follow-up: ${JSON.stringify(res.data)}`);
    }
  }

  // Create resources
  console.log("  Creating resources...");
  const resources = [
    { title: "988 Suicide & Crisis Lifeline", description: "Free, confidential support 24/7. Call or text 988.", category: "crisis", url: "https://988lifeline.org/" },
    { title: "Crisis Text Line", description: "Text HOME to 741741 to connect with a crisis counselor.", category: "crisis", url: "https://www.crisistextline.org/" },
    { title: "University Counseling Center", description: "Free confidential counseling for all students.", category: "counseling", url: "https://stateuniv.edu/counseling" },
    { title: "NCAA Mental Health Guide", description: "Mental health resources and best practices for student-athletes.", category: "wellness", url: "https://www.ncaa.org/sports/2022/3/10/mental-health-best-practices.aspx" },
    { title: "Academic Advising Portal", description: "Schedule appointments with your academic advisor.", category: "academic", url: "https://stateuniv.edu/advising" },
    { title: "Headspace for Students", description: "Free meditation and mindfulness app for university students.", category: "wellness", url: "https://www.headspace.com/studentplan" },
  ];

  for (const resource of resources) {
    const res = await apiCall("/rest/v1/resources", {
      method: "POST",
      body: JSON.stringify({
        organization_id: orgId,
        ...resource,
        created_by: profileMapping["admin@checkin.demo"],
      }),
    });
    if (res.status === 201) {
      console.log(`  ✅ Resource: ${resource.title}`);
    } else {
      console.log(`  ⏭️  Resource: ${resource.title} (${res.status})`);
    }
  }

  // Create athlete preferences
  console.log("  Creating preferences...");
  const prefsData = [
    { athlete: "jordan@checkin.demo", faith: false, family: true, peer: false, opt_out: false },
    { athlete: "tyler@checkin.demo", faith: true, family: true, peer: true, opt_out: false },
    { athlete: "emma@checkin.demo", faith: false, family: false, peer: true, opt_out: false },
  ];

  for (const pref of prefsData) {
    const res = await apiCall("/rest/v1/athlete_preferences", {
      method: "POST",
      body: JSON.stringify({
        athlete_id: profileMapping[pref.athlete],
        wants_faith_support: pref.faith,
        wants_family_checkins: pref.family,
        wants_peer_support: pref.peer,
        opt_out_reminders: pref.opt_out,
      }),
    });
    if (res.status === 201) {
      console.log(`  ✅ Preferences: ${pref.athlete.split("@")[0]}`);
    }
  }

  return { orgId, teamMapping, profileMapping };
}

// Main
async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║     Check-In by Athlete Anchor — Setup      ║");
  console.log("╚══════════════════════════════════════════════╝");

  // Step 1: Create auth users
  const userIds = await createAuthUsers();

  // Step 2: Check schema access
  const sqlMethod = await setupSchema();

  if (sqlMethod === "pg_query" || sqlMethod === "sql") {
    console.log("  Running schema SQL...");
    const { readFileSync } = await import("fs");
    const schemaSQL = readFileSync("supabase/schema.sql", "utf8");
    const rlsSQL = readFileSync("supabase/rls-policies.sql", "utf8");

    let res = await executeSQLViaEndpoint(sqlMethod, schemaSQL);
    console.log(`  Schema: ${res.ok ? "✅" : "❌"} (${res.status})`);

    res = await executeSQLViaEndpoint(sqlMethod, rlsSQL);
    console.log(`  RLS: ${res.ok ? "✅" : "❌"} (${res.status})`);
  } else {
    console.log("\n  ⚠️  Cannot run DDL SQL via REST API.");
    console.log("  📋 You need to run the schema manually:");
    console.log("     1. Go to: https://supabase.com/dashboard/project/doeycpheigjihvfvupid/sql");
    console.log("     2. Paste contents of: supabase/schema.sql → Run");
    console.log("     3. Paste contents of: supabase/rls-policies.sql → Run");
    console.log("\n  ⏳ After running schema, re-run this script to seed data.");

    // Check if tables exist by trying to read from profiles
    const testRes = await apiCall("/rest/v1/profiles?select=id&limit=1");
    if (testRes.status === 200) {
      console.log("\n  ✅ Tables detected! Proceeding with data seeding...");
    } else {
      console.log(`\n  ❌ Tables not found (${testRes.status}). Run schema SQL first.`);
      console.log("\n  Schema SQL has been printed to console for you to copy.\n");

      const { readFileSync } = await import("fs");
      console.log("=== SCHEMA SQL (copy and run in Supabase SQL Editor) ===\n");
      console.log(readFileSync("supabase/schema.sql", "utf8"));
      console.log("\n=== RLS POLICIES SQL ===\n");
      console.log(readFileSync("supabase/rls-policies.sql", "utf8"));
      return;
    }
  }

  // Step 3: Insert seed data
  await insertData(userIds);

  // Print login credentials
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                    LOGIN CREDENTIALS                        ║");
  console.log("║                 Password: CheckIn2024!                      ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║ ROLE      │ EMAIL                        │ NAME             ║");
  console.log("╠═══════════╪══════════════════════════════╪══════════════════╣");
  console.log("║ Admin     │ admin@checkin.demo            │ Alex Director    ║");
  console.log("║ Support   │ support@checkin.demo          │ Dr. Sarah W.     ║");
  console.log("║ Coach     │ coach.mike@checkin.demo       │ Coach Mike       ║");
  console.log("║ Coach     │ coach.lisa@checkin.demo       │ Coach Lisa       ║");
  console.log("║ Athlete   │ jordan@checkin.demo           │ Jordan Williams  ║");
  console.log("║ Athlete   │ tyler@checkin.demo            │ Tyler Brown      ║");
  console.log("║ Athlete   │ emma@checkin.demo             │ Emma Rodriguez   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("\n🌐 Open http://localhost:3000 and log in with any account above.\n");
}

main().catch(console.error);
