/**
 * JAAGO HUB v2.0 — Production Module Resolution Hook
 *
 * Resolves @jaago/* workspace packages and their dependencies when running
 * compiled JavaScript from dist/ on production servers (cPanel / VPS).
 */

"use strict";

const Module = require("module");
const path = require("path");
const fs = require("fs");

const ROOT_DIR = path.resolve(__dirname);
const DIST_API_ROOT = path.join(ROOT_DIR, "apps", "api", "dist");
const PACKAGES_ROOT = path.join(ROOT_DIR, "packages");

// Map of @jaago/* package names to their compiled or source index files
const PACKAGE_MAP = {};

// 1. Auto-discover from apps/api/dist/packages/
const distPkgDir = path.join(DIST_API_ROOT, "packages");
if (fs.existsSync(distPkgDir)) {
  for (const name of fs.readdirSync(distPkgDir)) {
    const candidates = [
      path.join(distPkgDir, name, "src", "index.js"),
      path.join(distPkgDir, name, "index.js"),
      path.join(distPkgDir, name, "dist", "index.js"),
    ];
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        PACKAGE_MAP[`@jaago/${name}`] = cand;
        break;
      }
    }
  }
}

// 2. Discover from packages/* for any packages not in dist/
if (fs.existsSync(PACKAGES_ROOT)) {
  for (const name of fs.readdirSync(PACKAGES_ROOT)) {
    if (!PACKAGE_MAP[`@jaago/${name}`]) {
      const candidates = [
        path.join(PACKAGES_ROOT, name, "dist", "index.js"),
        path.join(PACKAGES_ROOT, name, "src", "index.js"),
        path.join(PACKAGES_ROOT, name, "index.js"),
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
  // 1. Direct workspace package match
  if (PACKAGE_MAP[request]) {
    return PACKAGE_MAP[request];
  }

  // 2. Subpath imports (e.g. "@jaago/database/schema")
  for (const [pkg, pkgPath] of Object.entries(PACKAGE_MAP)) {
    if (request.startsWith(pkg + "/")) {
      const subpath = request.slice(pkg.length + 1);
      const candidates = [
        path.join(path.dirname(pkgPath), `${subpath}.js`),
        path.join(path.dirname(pkgPath), subpath, "index.js"),
        path.join(path.dirname(pkgPath), "..", `${subpath}.js`),
        path.join(path.dirname(pkgPath), "..", subpath, "index.js"),
      ];
      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          return cand;
        }
      }
    }
  }

  // 3. Fallback resolution for pnpm / npm symlinked dependencies
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (err) {
    if (parent && parent.filename && parent.filename.includes(path.join("dist", "packages"))) {
      const distPkgsPrefix = path.join(DIST_API_ROOT, "packages") + path.sep;
      if (parent.filename.startsWith(distPkgsPrefix)) {
        const relative = parent.filename.slice(distPkgsPrefix.length);
        const pkgName = relative.split(path.sep)[0];
        const originalPkgDir = path.join(PACKAGES_ROOT, pkgName);

        if (fs.existsSync(originalPkgDir)) {
          const fakeParent = Object.create(parent);
          fakeParent.filename = path.join(originalPkgDir, "src", "index.ts");
          fakeParent.paths = Module._nodeModulePaths(originalPkgDir);

          try {
            return originalResolveFilename.call(this, request, fakeParent, isMain, options);
          } catch (_) {
            // Fall through
          }
        }
      }
    }

    throw err;
  }
};

module.exports = { PACKAGE_MAP };
