/**
 * JAAGO HUB v2.0 — Universal Production Module Resolution Hook
 *
 * Resolves @jaago/* imports to compiled JavaScript in apps/api/dist/core/ or packages/
 * when running compiled Node.js processes (NestJS API, BullMQ Worker) in production (cPanel / VPS).
 */

"use strict";

const Module = require("module");
const path = require("path");
const fs = require("fs");

const ROOT_DIR = path.resolve(__dirname);
const DIST_API_CORE = path.join(ROOT_DIR, "apps", "api", "dist", "core");
const DIST_API_PACKAGES = path.join(ROOT_DIR, "apps", "api", "dist", "packages");
const SRC_CORE = path.join(ROOT_DIR, "apps", "api", "src", "core");
const PACKAGES_ROOT = path.join(ROOT_DIR, "packages");

// Map of @jaago/* package names to their compiled or source index files
const PACKAGE_MAP = {};

// 1. Auto-discover from apps/api/dist/core/ (Primary compiled location)
if (fs.existsSync(DIST_API_CORE)) {
  for (const name of fs.readdirSync(DIST_API_CORE)) {
    const corePkg = path.join(DIST_API_CORE, name);
    const candidates = [
      path.join(corePkg, "index.js"),
      path.join(corePkg, "src", "index.js"),
      path.join(corePkg, "dist", "index.js"),
    ];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        PACKAGE_MAP[`@jaago/${name}`] = cand;
        break;
      }
    }
  }
}

// 2. Auto-discover from apps/api/dist/packages/
if (fs.existsSync(DIST_API_PACKAGES)) {
  for (const name of fs.readdirSync(DIST_API_PACKAGES)) {
    const distPkg = path.join(DIST_API_PACKAGES, name);
    const candidates = [
      path.join(distPkg, "src", "index.js"),
      path.join(distPkg, "index.js"),
      path.join(distPkg, "dist", "index.js"),
    ];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        PACKAGE_MAP[`@jaago/${name}`] = cand;
        break;
      }
    }
  }
}

// 3. Fallback: discover from apps/api/src/core/ (for TypeScript/tsx runtime)
if (fs.existsSync(SRC_CORE)) {
  for (const name of fs.readdirSync(SRC_CORE)) {
    if (!PACKAGE_MAP[`@jaago/${name}`]) {
      const srcPkg = path.join(SRC_CORE, name);
      const candidates = [
        path.join(srcPkg, "index.ts"),
        path.join(srcPkg, "index.js"),
        path.join(srcPkg, "src", "index.ts"),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          PACKAGE_MAP[`@jaago/${name}`] = cand;
          break;
        }
      }
    }
  }
}

// 4. Fallback: discover from packages/*
if (fs.existsSync(PACKAGES_ROOT)) {
  for (const name of fs.readdirSync(PACKAGES_ROOT)) {
    if (!PACKAGE_MAP[`@jaago/${name}`]) {
      const pkgDir = path.join(PACKAGES_ROOT, name);
      const candidates = [
        path.join(pkgDir, "src", "index.ts"),
        path.join(pkgDir, "src", "index.js"),
        path.join(pkgDir, "dist", "index.js"),
        path.join(pkgDir, "index.ts"),
        path.join(pkgDir, "index.js"),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          PACKAGE_MAP[`@jaago/${name}`] = cand;
          break;
        }
      }
    }
  }
}

// Hook into Module._resolveFilename
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  // 1. Direct workspace package match (e.g. "@jaago/logger")
  if (PACKAGE_MAP[request]) {
    return PACKAGE_MAP[request];
  }

  // 2. Subpath imports (e.g. "@jaago/database/schema", "@jaago/security/env")
  for (const [pkg, pkgPath] of Object.entries(PACKAGE_MAP)) {
    if (request.startsWith(pkg + "/")) {
      const subpath = request.slice(pkg.length + 1);
      const baseDir = path.dirname(pkgPath);
      const candidates = [
        path.join(baseDir, `${subpath}.js`),
        path.join(baseDir, subpath, "index.js"),
        path.join(baseDir, `${subpath}.ts`),
        path.join(baseDir, subpath, "index.ts"),
        path.join(baseDir, "..", `${subpath}.js`),
        path.join(baseDir, "..", subpath, "index.js"),
        path.join(baseDir, "..", `${subpath}.ts`),
        path.join(baseDir, "..", subpath, "index.ts"),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          return cand;
        }
      }
    }
  }

  // 3. Fallback resolution for node_modules dependencies
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (err) {
    // If request fails from child dist, try resolving from root node_modules
    try {
      const rootCandidate = require.resolve(request, { paths: [ROOT_DIR, path.join(ROOT_DIR, "apps", "api")] });
      if (rootCandidate) return rootCandidate;
    } catch (_) {}

    throw err;
  }
};

module.exports = { PACKAGE_MAP };
