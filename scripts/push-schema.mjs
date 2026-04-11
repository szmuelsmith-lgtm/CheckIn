import { readFileSync } from "fs";
import pg from "pg";
const { Client } = pg;

const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZXljcGhlaWdqaWh2ZnZ1cGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjIzNSwiZXhwIjoyMDkwMjQyMjM1fQ.6OnUth2brJjV37VrgDtXiWiXJJX5uHJD4ZBrigO4NtE";

const REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-west-2", "eu-central-1",
  "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
  "sa-east-1", "ca-central-1",
];

async function tryConnect(region) {
  const client = new Client({
    host: `aws-0-${region}.pooler.supabase.com`,
    port: 6543,
    database: "postgres",
    user: "postgres.doeycpheigjihvfvupid",
    password: SERVICE_ROLE_KEY,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  await client.connect();
  return client;
}

async function main() {
  console.log("🔧 Connecting to Supabase PostgreSQL...\n");

  let client = null;
  for (const region of REGIONS) {
    try {
      process.stdout.write(`  Trying ${region}...`);
      client = await tryConnect(region);
      console.log(` ✅ Connected!`);
      break;
    } catch (e) {
      console.log(` ❌ ${e.message?.substring(0, 60)}`);
    }
  }

  if (!client) {
    // Also try the direct connection (not pooler)
    try {
      process.stdout.write("  Trying direct db connection...");
      const directClient = new Client({
        host: "db.doeycpheigjihvfvupid.supabase.co",
        port: 5432,
        database: "postgres",
        user: "postgres",
        password: SERVICE_ROLE_KEY,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 8000,
      });
      await directClient.connect();
      client = directClient;
      console.log(" ✅ Connected!");
    } catch (e) {
      console.log(` ❌ ${e.message?.substring(0, 60)}`);
    }
  }

  if (!client) {
    console.log("\n❌ Could not connect to database.");
    console.log("   I need the database password from Settings → Database.\n");
    process.exit(1);
  }

  // Test connection
  const testRes = await client.query("SELECT current_database(), current_user");
  console.log(`  Database: ${testRes.rows[0].current_database}, User: ${testRes.rows[0].current_user}\n`);

  // Run schema
  console.log("📋 Running schema.sql...");
  const schemaSQL = readFileSync("supabase/schema.sql", "utf8");
  try {
    await client.query(schemaSQL);
    console.log("  ✅ Schema created!\n");
  } catch (e) {
    if (e.message.includes("already exists")) {
      console.log("  ⏭️  Schema already exists (skipping)\n");
    } else {
      console.log(`  ❌ Schema error: ${e.message}\n`);
    }
  }

  // Run RLS policies
  console.log("📋 Running rls-policies.sql...");
  const rlsSQL = readFileSync("supabase/rls-policies.sql", "utf8");
  try {
    await client.query(rlsSQL);
    console.log("  ✅ RLS policies applied!\n");
  } catch (e) {
    if (e.message.includes("already exists")) {
      console.log("  ⏭️  RLS policies already exist (skipping)\n");
    } else {
      console.log(`  ❌ RLS error: ${e.message}\n`);
    }
  }

  // Verify tables
  console.log("📋 Verifying tables...");
  const tablesRes = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  console.log(`  ✅ ${tablesRes.rows.length} tables found:`);
  tablesRes.rows.forEach(r => console.log(`     - ${r.table_name}`));

  await client.end();
  console.log("\n✅ Database setup complete!");
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
