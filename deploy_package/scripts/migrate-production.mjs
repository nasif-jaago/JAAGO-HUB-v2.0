/**
 * JAAGO HUB v2.0 — Standalone Database Migration Runner
 *
 * Runs all SQL migrations in supabase/migrations/ against PostgreSQL without Docker.
 * Usage:
 *   DATABASE_URL="postgresql://user:pass@host:5432/dbname" node scripts/migrate-production.mjs
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rootDir = process.cwd();

// Try to resolve postgres client
let postgres;
try {
  postgres = require("postgres");
} catch (_) {
  try {
    postgres = require(path.join(rootDir, "packages", "database", "node_modules", "postgres"));
  } catch (_) {
    try {
      postgres = require(path.join(rootDir, "node_modules", "postgres"));
    } catch (err) {
      console.error("❌ ERROR: 'postgres' client package not found. Please run pnpm install or npm install.");
      process.exit(1);
    }
  }
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL environment variable is required.");
  console.error("   Example: DATABASE_URL=\"postgresql://postgres:password@localhost:5432/jaago_erp\"");
  process.exit(1);
}

const migrationsDir = path.join(rootDir, "supabase", "migrations");

if (!fs.existsSync(migrationsDir)) {
  console.error(`❌ ERROR: Migrations folder not found at ${migrationsDir}`);
  process.exit(1);
}

async function runMigrations() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║     JAAGO HUB v2.0 — Production Database Migration Runner   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`Connecting to: ${DATABASE_URL.replace(/:([^:@]+)@/, ":****@")}`);

  const sql = postgres(DATABASE_URL, {
    max: 1,
    connect_timeout: 15,
  });

  try {
    // 1. Create migrations tracking table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS _jaago_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // 2. Fetch already executed migrations
    const executedRows = await sql`SELECT name FROM _jaago_migrations ORDER BY id ASC`;
    const executedSet = new Set(executedRows.map((r) => r.name));

    // 3. Scan and sort migration files
    const allFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    console.log(`Found ${allFiles.length} migration file(s) in supabase/migrations/`);

    let appliedCount = 0;

    for (const file of allFiles) {
      if (executedSet.has(file)) {
        console.log(`  [ALREADY APPLIED] ${file}`);
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, "utf8");
      const checksum = crypto.createHash("sha256").update(content).digest("hex");

      console.log(`  --> Applying: ${file}...`);
      const startTime = Date.now();

      // Execute migration in a single transaction
      await sql.begin(async (tx) => {
        await tx.unsafe(content);
        await tx`
          INSERT INTO _jaago_migrations (name, checksum, executed_at)
          VALUES (${file}, ${checksum}, NOW())
        `;
      });

      const elapsed = Date.now() - startTime;
      console.log(`  ✓ Applied ${file} (${elapsed}ms)`);
      appliedCount++;
    }

    if (appliedCount === 0) {
      console.log("\n✅ Database is up to date. No pending migrations.");
    } else {
      console.log(`\n✅ Successfully applied ${appliedCount} migration(s).`);
    }

    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ MIGRATION FAILED:");
    console.error(err.message || err);
    await sql.end({ timeout: 2 }).catch(() => {});
    process.exit(1);
  }
}

runMigrations();
