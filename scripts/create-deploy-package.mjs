import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const rootDir = process.cwd();
const deployDir = path.join(rootDir, "deploy_package");

console.log("🚀 Preparing production cPanel deploy package...");

// Clean existing deploy_package directory
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true, force: true });
}
fs.mkdirSync(deployDir, { recursive: true });

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      if (
        file === "node_modules" ||
        file === ".turbo" ||
        file === ".git" ||
        file === "cache" ||
        file === ".next-dev" ||
        file === "coverage" ||
        file.endsWith(".tsbuildinfo")
      ) {
        continue;
      }
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 1. Root configuration & startup entrypoints
console.log("1. Copying root configuration, launcher, and entrypoint files...");
const rootFiles = [
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "turbo.json",
  "index.js",
  "api-resolve-hook.js",
  "tsconfig.json",
  ".npmrc",
];
for (const file of rootFiles) {
  const src = path.join(rootDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(deployDir, file));
    console.log(`   ✓ ${file}`);
  }
}

// 2. Packages (shared libraries & utilities)
console.log("2. Copying packages/ (shared workspace libraries)...");
copyRecursive(path.join(rootDir, "packages"), path.join(deployDir, "packages"));

// 3. Modules (domain modules)
if (fs.existsSync(path.join(rootDir, "modules"))) {
  console.log("3. Copying modules/ (domain modules)...");
  copyRecursive(path.join(rootDir, "modules"), path.join(deployDir, "modules"));
}

// 4. API App (NestJS / Fastify backend)
console.log("4. Copying apps/api/ (compiled dist + source + config)...");
fs.mkdirSync(path.join(deployDir, "apps", "api"), { recursive: true });
copyRecursive(path.join(rootDir, "apps", "api", "dist"), path.join(deployDir, "apps", "api", "dist"));
copyRecursive(path.join(rootDir, "apps", "api", "src"), path.join(deployDir, "apps", "api", "src"));
for (const file of ["package.json", "tsconfig.json", "nest-cli.json"]) {
  const src = path.join(rootDir, "apps", "api", file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(deployDir, "apps", "api", file));
  }
}

// 5. Web App (Next.js frontend)
console.log("5. Copying apps/web/ (.next production build + public + config)...");
fs.mkdirSync(path.join(deployDir, "apps", "web"), { recursive: true });
copyRecursive(path.join(rootDir, "apps", "web", ".next"), path.join(deployDir, "apps", "web", ".next"));
if (fs.existsSync(path.join(rootDir, "apps", "web", "public"))) {
  copyRecursive(path.join(rootDir, "apps", "web", "public"), path.join(deployDir, "apps", "web", "public"));
}
for (const file of [
  "package.json",
  "next.config.mjs",
  "tsconfig.json",
  "tailwind.config.ts",
  "postcss.config.mjs",
]) {
  const src = path.join(rootDir, "apps", "web", file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(deployDir, "apps", "web", file));
  }
}

// 6. Worker App (BullMQ background worker)
console.log("6. Copying apps/worker/ (compiled dist + source + config)...");
fs.mkdirSync(path.join(deployDir, "apps", "worker"), { recursive: true });
copyRecursive(path.join(rootDir, "apps", "worker", "dist"), path.join(deployDir, "apps", "worker", "dist"));
copyRecursive(path.join(rootDir, "apps", "worker", "src"), path.join(deployDir, "apps", "worker", "src"));
for (const file of ["package.json", "tsconfig.json"]) {
  const src = path.join(rootDir, "apps", "worker", file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(deployDir, "apps", "worker", file));
  }
}

// 7. Supabase / Database migrations & seeds
if (fs.existsSync(path.join(rootDir, "supabase"))) {
  console.log("7. Copying supabase/ (database migrations, seeds, configs)...");
  copyRecursive(path.join(rootDir, "supabase"), path.join(deployDir, "supabase"));
}

// 8. Copy Migration Runner Script
fs.mkdirSync(path.join(deployDir, "scripts"), { recursive: true });
const migrationScript = path.join(rootDir, "scripts", "migrate-production.mjs");
if (fs.existsSync(migrationScript)) {
  fs.copyFileSync(migrationScript, path.join(deployDir, "scripts", "migrate-production.mjs"));
  console.log("8. Copied standalone database migration runner.");
}

// 9. Collect and Aggregate all production dependencies from all workspace apps & packages
console.log("9. Collecting and aggregating all production dependencies for cPanel...");
const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
const aggregatedDeps = {};

function collectDependenciesFrom(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const item of fs.readdirSync(dirPath)) {
    const pkgJsonPath = path.join(dirPath, item, "package.json");
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const rawContent = fs.readFileSync(pkgJsonPath, "utf8").replace(/^\uFEFF/, "");
        const pkgData = JSON.parse(rawContent);
        if (pkgData.dependencies) {
          for (const [dep, version] of Object.entries(pkgData.dependencies)) {
            // Exclude workspace:* packages
            if (version.startsWith("workspace:") || dep.startsWith("@jaago/")) {
              continue;
            }
            aggregatedDeps[dep] = version;
          }
        }
      } catch (err) {
        console.warn(`Could not read ${pkgJsonPath}:`, err.message);
      }
    }
  }
}

collectDependenciesFrom(path.join(rootDir, "apps"));
collectDependenciesFrom(path.join(rootDir, "packages"));
collectDependenciesFrom(path.join(rootDir, "modules"));

if (rootPkg.dependencies) {
  for (const [dep, version] of Object.entries(rootPkg.dependencies)) {
    if (!version.startsWith("workspace:") && !dep.startsWith("@jaago/")) {
      aggregatedDeps[dep] = version;
    }
  }
}

// Sort dependencies alphabetically
const sortedDeps = Object.keys(aggregatedDeps)
  .sort()
  .reduce((acc, key) => {
    acc[key] = aggregatedDeps[key];
    return acc;
  }, {});

const productionPkg = {
  name: rootPkg.name || "jaago-erp",
  version: rootPkg.version || "2.0.0",
  private: true,
  description: "JAAGO HUB v2.0 — Production Server Deployment Package (All Subsystems Aggregated)",
  main: "index.js",
  scripts: {
    start: "node index.js",
    migrate: "node scripts/migrate-production.mjs",
    health: "node -e \"const http=require('http'); http.get('http://127.0.0.1:'+(process.env.PORT||3000)+'/health', res => { console.log('HTTP', res.statusCode); process.exit(res.statusCode===200?0:1); });\"",
  },
  dependencies: sortedDeps,
  engines: rootPkg.engines || {
    node: ">=20.0.0",
    npm: ">=9.0.0",
    pnpm: ">=9.0.0",
  },
};

fs.writeFileSync(
  path.join(deployDir, "package.json"),
  JSON.stringify(productionPkg, null, 2),
  "utf8"
);
console.log(`   ✓ Aggregated ${Object.keys(sortedDeps).length} production dependencies into deploy_package/package.json`);

// 10. Generate Production .env and .env.example
console.log("10. Generating and copying production .env and .env.example...");
const envExample = `# ==============================================================================
# JAAGO HUB v2.0 — Production Environment Configuration
# ==============================================================================
# Configure these variables in your cPanel "Setup Node.js App" Environment Variables
# or in this .env file located at the application root.

NODE_ENV=production
PORT=3000
API_PORT=3001

# --- PostgreSQL / Supabase Database ---
DATABASE_URL=postgresql://user:password@host:5432/jaago_erp
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# --- Redis (Queues, Locks, Caching) ---
REDIS_URL=redis://127.0.0.1:6379

# --- Security & Cryptography ---
JWT_SECRET=super_secure_jwt_secret_change_me_in_production
ENCRYPTION_KEK=32_character_min_encryption_master_key_jaago_2026

# --- URLs & Reverse Proxy ---
NEXT_PUBLIC_APP_URL=https://hub.jaago.com.bd
NEXT_PUBLIC_API_URL=https://hub.jaago.com.bd/api
API_INTERNAL_URL=http://127.0.0.1:3001
CORS_ORIGIN=https://hub.jaago.com.bd
`;
fs.writeFileSync(path.join(deployDir, ".env.example"), envExample, "utf8");

// Always ensure .env exists in deploy_package
const rootEnvPath = path.join(rootDir, ".env");
if (fs.existsSync(rootEnvPath)) {
  fs.copyFileSync(rootEnvPath, path.join(deployDir, ".env"));
  console.log("   ✓ Copied .env from root into deploy_package/.env");
} else {
  fs.writeFileSync(path.join(deployDir, ".env"), envExample, "utf8");
  console.log("   ✓ Created default .env in deploy_package/.env");
}

// 11. Generate .htaccess for optional Apache/Passenger optimizations
const htaccess = `# JAAGO HUB v2.0 — Apache / Phusion Passenger Configuration
<IfModule mod_passenger.c>
  PassengerAppRoot "/"
  PassengerAppType node
  PassengerStartupFile index.js
</IfModule>

# Optional Gzip & Cache headers for Next.js static assets
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
`;
fs.writeFileSync(path.join(deployDir, ".htaccess"), htaccess, "utf8");

// 12. Create README and Deployment Runbook
const readme = `# JAAGO HUB v2.0 — Production Deployment Package

This package contains everything required to deploy **JAAGO HUB v2.0** on **cPanel Node.js App Manager** or any Linux server without Docker.

---

## 🚀 Quick Start on cPanel (5 Steps)

### Step 1: Upload Files
Upload \`deploy_package.zip\` to your server directory (e.g. \`/home/username/jaagohub\`) via cPanel **File Manager** and extract it.

### Step 2: Configure cPanel Node.js App Manager
1. Open cPanel > **Setup Node.js App** > **Create Application**.
2. Set:
   - **Node.js version**: 20.x or 22.x
   - **Application mode**: Production
   - **Application root**: \`jaagohub\` (or your folder name)
   - **Application startup file**: \`index.js\`
3. Click **Create**.

### Step 3: Set Environment Variables
In the cPanel Node.js App Manager screen, under **Environment variables**, add:
- \`DATABASE_URL\` = Your PostgreSQL connection string
- \`SUPABASE_URL\` = Your Supabase project URL
- \`SUPABASE_ANON_KEY\` = Your Supabase anon key
- \`SUPABASE_SERVICE_ROLE_KEY\` = Your Supabase service role key
- \`REDIS_URL\` = \`redis://127.0.0.1:6379\` (or managed Redis URL)
- \`ENCRYPTION_KEK\` = 32-character encryption key
- \`JWT_SECRET\` = Your JWT secret
- \`NEXT_PUBLIC_APP_URL\` = \`https://yourdomain.com\`
- \`NEXT_PUBLIC_API_URL\` = \`https://yourdomain.com/api\`
- \`API_INTERNAL_URL\` = \`http://127.0.0.1:3001\`

### Step 4: Install Dependencies & Run Migrations
Click **Run NPM Install** in cPanel (or open cPanel **Terminal**):
\`\`\`bash
# Enter the virtual environment indicated at the top of your cPanel app screen:
source /home/username/nodevenv/jaagohub/22/bin/activate
npm install --omit=dev  # or pnpm install --prod

# Run database migrations:
node scripts/migrate-production.mjs
\`\`\`

### Step 5: Start / Restart Application
Click **Restart Application** in cPanel.

Verify by visiting:
- Frontend: \`https://yourdomain.com\`
- Health check: \`https://yourdomain.com/health\`
- API documentation: \`https://yourdomain.com/api/docs\`
`;
fs.writeFileSync(path.join(deployDir, "README.md"), readme, "utf8");

// 13. Create deploy_package.zip
console.log("13. Compressing deploy package to deploy_package.zip...");
try {
  if (process.platform === "win32") {
    const zipPath = path.join(rootDir, "deploy_package.zip");
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    execSync(
      `powershell -Command "Compress-Archive -Path '${deployDir}/*' -DestinationPath '${zipPath}' -Force"`,
      { stdio: "ignore" }
    );
    console.log("   ✓ Generated deploy_package.zip");
  } else {
    execSync(`zip -r deploy_package.zip deploy_package`, { stdio: "ignore" });
    console.log("   ✓ Generated deploy_package.zip");
  }
} catch (_) {
  console.log("   (Note: Zip command skipped, deploy_package directory is fully available)");
}

console.log("\n✅ Production deployment package successfully generated at:");
console.log(`   ${deployDir}`);
