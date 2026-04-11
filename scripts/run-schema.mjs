/**
 * Run schema SQL against Supabase using the Transaction API
 * This uses the Supabase Realtime/PG endpoint with service role key
 */
import { readFileSync } from "fs";

const SUPABASE_URL = "https://doeycpheigjihvfvupid.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZXljcGhlaWdqaWh2ZnZ1cGlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDY2NjIzNSwiZXhwIjoyMDkwMjQyMjM1fQ.6OnUth2brJjV37VrgDtXiWiXJJX5uHJD4ZBrigO4NtE";

// Try multiple SQL execution endpoints
async function tryExecuteSQL(sql) {
  const endpoints = [
    "/pg/query",
    "/sql",
    "/rest/v1/rpc/exec_sql",
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${SUPABASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "apikey": SERVICE_ROLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
      });

      if (res.ok) {
        console.log(`  ✅ SQL executed via ${endpoint}`);
        return true;
      }
      const text = await res.text();
      console.log(`  ${endpoint}: ${res.status} - ${text.substring(0, 100)}`);
    } catch (e) {
      console.log(`  ${endpoint}: Error - ${e.message}`);
    }
  }
  return false;
}

// Try using pg directly with various connection strings
async function tryPgDirect(sql) {
  try {
    const { default: pg } = await import("pg");
    const { Client } = pg;

    // Supabase connection pooler with service role JWT
    // Format: postgresql://postgres.[ref]:[password]@[pooler-host]:6543/postgres
    // Since we don't have the DB password, try using the JWT token directly

    // Try Supabase transaction mode pooler
    const connectionStrings = [
      `postgresql://postgres.doeycpheigjihvfvupid:${SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`,
      `postgresql://postgres.doeycpheigjihvfvupid:${SERVICE_ROLE_KEY}@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require`,
      `postgresql://postgres.doeycpheigjihvfvupid:${SERVICE_ROLE_KEY}@aws-0-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require`,
    ];

    for (const connStr of connectionStrings) {
      try {
        const client = new Client({ connectionString: connStr, connectionTimeoutMillis: 5000 });
        await client.connect();
        console.log(`  ✅ Connected to database!`);

        // Split SQL by semicolons but handle dollar-quoted strings
        await client.query(sql);
        console.log(`  ✅ Schema SQL executed successfully`);

        await client.end();
        return true;
      } catch (e) {
        // Try next connection string
        const region = connStr.match(/aws-0-([^.]+)/)?.[1] || "unknown";
        console.log(`  ⚠️  ${region}: ${e.message?.substring(0, 80)}`);
      }
    }
  } catch (e) {
    console.log(`  ⚠️  pg import failed: ${e.message}`);
  }
  return false;
}

async function main() {
  console.log("🔧 Running database schema...\n");

  const schemaSQL = readFileSync("supabase/schema.sql", "utf8");
  const rlsSQL = readFileSync("supabase/rls-policies.sql", "utf8");

  console.log("  Trying REST endpoints...");
  let success = await tryExecuteSQL(schemaSQL);

  if (!success) {
    console.log("\n  Trying direct PostgreSQL connection...");
    success = await tryPgDirect(schemaSQL);

    if (success) {
      console.log("\n  Running RLS policies...");
      await tryPgDirect(rlsSQL);
    }
  }

  if (!success) {
    console.log("\n  ❌ Could not execute SQL automatically.");
    console.log("\n  📋 Please run the schema manually:");
    console.log("     Go to: https://supabase.com/dashboard/project/doeycpheigjihvfvupid/sql/new");
    console.log("     Then paste and run the SQL below.\n");
    console.log("  Or give me your database password (Settings → Database → Connection string)");
  }
}

main().catch(console.error);
