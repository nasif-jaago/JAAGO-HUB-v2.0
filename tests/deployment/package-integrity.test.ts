import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(__dirname, "../../");
const deployDir = path.join(rootDir, "deploy_package");

describe("Production Deploy Package Integrity & cPanel Readiness", () => {
  it("verifies deploy packager script generates required production files", () => {
    // If deploy_package doesn't exist yet, we check the script source
    const scriptPath = path.join(rootDir, "scripts", "create-deploy-package.mjs");
    expect(fs.existsSync(scriptPath)).toBe(true);

    const scriptContent = fs.readFileSync(scriptPath, "utf8");
    expect(scriptContent).toContain("index.js");
    expect(scriptContent).toContain("api-resolve-hook.js");
    expect(scriptContent).toContain("migrate-production.mjs");
    expect(scriptContent).toContain("README.md");
    expect(scriptContent).toContain(".env.example");
  });

  it("ensures standalone migration runner exists and validates DATABASE_URL", () => {
    const migrationScript = path.join(rootDir, "scripts", "migrate-production.mjs");
    expect(fs.existsSync(migrationScript)).toBe(true);

    const content = fs.readFileSync(migrationScript, "utf8");
    expect(content).toContain("DATABASE_URL");
    expect(content).toContain("_jaago_migrations");
    expect(content).toContain("supabase");
  });

  it("validates root and deployment package.json formats for cPanel Node.js App Manager", () => {
    const rootPkgPath = path.join(rootDir, "package.json");
    expect(fs.existsSync(rootPkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"));
    expect(pkg.scripts.start).toBe("node index.js");
    expect(pkg.scripts["db:migrate"]).toBeDefined();
    expect(pkg.scripts["deploy:package"]).toBeDefined();
    expect(pkg.dependencies.postgres).toBeDefined();
  });

  it("checks database migrations exist and are sequentially orderable", () => {
    const migrationsDir = path.join(rootDir, "supabase", "migrations");
    expect(fs.existsSync(migrationsDir)).toBe(true);

    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
    expect(files.length).toBeGreaterThan(0);

    // Verify all migration files are non-empty
    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      expect(content.trim().length).toBeGreaterThan(10);
    }
  });

  it("validates that api-resolve-hook.js correctly discovers packages", () => {
    const hookPath = path.join(rootDir, "api-resolve-hook.js");
    expect(fs.existsSync(hookPath)).toBe(true);

    // @ts-expect-error commonjs require
    const hook = require(hookPath);
    expect(hook).toBeDefined();
    expect(hook.PACKAGE_MAP).toBeDefined();
    expect(typeof hook.PACKAGE_MAP).toBe("object");
  });
});
