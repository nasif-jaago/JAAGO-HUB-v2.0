/**
 * Custom module resolution hook for running the NestJS API from its compiled dist/.
 *
 * Problem: `nest build` compiles the API + workspace packages into apps/api/dist/,
 * but the compiled code still does `require("@jaago/logger")` which resolves via
 * node_modules symlinks to the raw TypeScript source (which Node.js can't run).
 *
 * Additionally, when loading compiled packages from dist/, their own dependencies
 * (like 'pino' for @jaago/logger) can't be found because pnpm's strict resolution
 * only allows resolution from the original package location.
 *
 * Solution: This hook:
 * 1. Redirects @jaago/* imports to compiled JS in dist/packages/
 * 2. When resolution fails from dist/, retries from the original package location
 */

"use strict";

const Module = require("module");
const path = require("path");
const fs = require("fs");

const ROOT_DIR = path.resolve(__dirname);
const DIST_ROOT = path.join(ROOT_DIR, "apps", "api", "dist");
const PACKAGES_ROOT = path.join(ROOT_DIR, "packages");

// Map of @jaago/* package names to their compiled locations in dist/
const PACKAGE_MAP = {};

// Auto-discover packages from dist/packages/
const distPkgDir = path.join(DIST_ROOT, "packages");
if (fs.existsSync(distPkgDir)) {
  for (const name of fs.readdirSync(distPkgDir)) {
    const indexPath = path.join(distPkgDir, name, "src", "index.js");
    if (fs.existsSync(indexPath)) {
      PACKAGE_MAP[`@jaago/${name}`] = indexPath;
    }
  }
}

// Monkey-patch Module._resolveFilename to intercept @jaago/* lookups
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  // 1. Redirect @jaago/* to compiled dist versions
  if (PACKAGE_MAP[request]) {
    return PACKAGE_MAP[request];
  }

  // Check subpath imports (e.g., "@jaago/logger/something")
  for (const [pkg, pkgPath] of Object.entries(PACKAGE_MAP)) {
    if (request.startsWith(pkg + "/")) {
      const subpath = request.slice(pkg.length + 1);
      const resolved = path.join(path.dirname(pkgPath), "..", subpath);
      try {
        return originalResolveFilename.call(this, resolved, parent, isMain, options);
      } catch (_) {
        // Fall through
      }
    }
  }

  // 2. If the requiring file is inside dist/packages/, and resolution fails,
  //    retry from the original package source location (for pnpm symlinked deps)
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (err) {
    if (parent && parent.filename && parent.filename.includes(path.join("dist", "packages"))) {
      // Extract the package name from the dist path
      // e.g., .../dist/packages/logger/src/logger.js → logger
      const distPkgsPrefix = path.join(DIST_ROOT, "packages") + path.sep;
      if (parent.filename.startsWith(distPkgsPrefix)) {
        const relative = parent.filename.slice(distPkgsPrefix.length);
        const pkgName = relative.split(path.sep)[0];
        const originalPkgDir = path.join(PACKAGES_ROOT, pkgName);

        if (fs.existsSync(originalPkgDir)) {
          // Create a fake parent pointing to the original package location
          const fakeParent = Object.create(parent);
          fakeParent.filename = path.join(originalPkgDir, "src", "index.ts");
          fakeParent.paths = Module._nodeModulePaths(originalPkgDir);

          try {
            return originalResolveFilename.call(this, request, fakeParent, isMain, options);
          } catch (_) {
            // Fall through to original error
          }
        }
      }
    }

    throw err;
  }
};
