/**
 * JAAGO HUB v2.0 — Production Startup (CPanel / CWP)
 *
 * Single entry point that boots all three services:
 *   1. Next.js Web Frontend  (port from $PORT or 3000)
 *   2. NestJS API Backend    (port from $API_PORT or 3001)
 *   3. BullMQ Background Worker (no port, connects to Redis)
 *
 * Architecture Notes:
 *   - WEB: Runs in-process using Next.js programmatic API.
 *   - API: Runs as child process from compiled dist/ with a custom resolve
 *          hook (api-resolve-hook.js) to fix @jaago/* package resolution.
 *   - WORKER: Runs as child process via tsx (TypeScript runtime) since it
 *             doesn't use NestJS decorators and tsx handles it cleanly.
 *
 * Usage:
 *   NODE_ENV=production node index.js
 *
 * CPanel/CWP "Setup Node.js App":
 *   Application Root: /
 *   Application Startup File: index.js
 */

"use strict";

const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const url = require("url");
const fs = require("fs");

// ─── Configuration ──────────────────────────────────────────────────────────
const ROOT_DIR = __dirname;
const WEB_PORT = parseInt(process.env.PORT || "3000", 10); // CPanel assigns PORT
const API_PORT = parseInt(process.env.API_PORT || "3001", 10);

// Force production mode
process.env.NODE_ENV = "production";

// ─── Logging Helper ─────────────────────────────────────────────────────────
const LOG_DIR = path.join(ROOT_DIR, "logs");
try {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (_) {
  // Fall back to root dir for logs
}

const LOG_FILE = path.join(
  fs.existsSync(LOG_DIR) ? LOG_DIR : ROOT_DIR,
  "jaago-hub.log"
);

function log(service, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${service}] ${message}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch (_) {
    // Silently ignore log write failures
  }
}

// ─── Resolve tsx CLI module path ────────────────────────────────────────────
function resolveTsxCliPath() {
  try {
    return require.resolve("tsx/dist/cli.mjs", { paths: [ROOT_DIR] });
  } catch (_) {}
  try {
    return require.resolve("tsx/cli", { paths: [ROOT_DIR] });
  } catch (_) {}
  const manual = path.join(ROOT_DIR, "node_modules", "tsx", "dist", "cli.mjs");
  if (fs.existsSync(manual)) return manual;
  return null;
}

const TSX_CLI = resolveTsxCliPath();

// ─── Child Process Manager ──────────────────────────────────────────────────
const children = new Map(); // name → ChildProcess

function startService(name, { script, nodeArgs = [], env = {} }) {
  const fullPath = path.resolve(ROOT_DIR, script);

  if (!fs.existsSync(fullPath)) {
    log(name, `ERROR: Entry file not found at ${fullPath}`);
    log(name, `Skipping ${name} — file missing.`);
    return null;
  }

  const args = [...nodeArgs, fullPath];
  log(name, `Starting: node ${args.join(" ")}`);

  const child = spawn(process.execPath, args, {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      NODE_ENV: "production",
      ...env,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    data
      .toString()
      .split("\n")
      .filter(Boolean)
      .forEach((line) => log(name, line));
  });

  child.stderr.on("data", (data) => {
    data
      .toString()
      .split("\n")
      .filter(Boolean)
      .forEach((line) => log(name, `STDERR: ${line}`));
  });

  child.on("exit", (code, signal) => {
    log(name, `Process exited (code=${code}, signal=${signal}).`);
    children.delete(name);

    // Auto-restart after 5 seconds (max 10 retries)
    const retries = (child._restartCount || 0) + 1;
    if (retries <= 10) {
      log(name, `Restarting in 5s... (attempt ${retries}/10)`);
      setTimeout(() => {
        const newChild = startService(name, { script, nodeArgs, env });
        if (newChild) {
          newChild._restartCount = retries;
        }
      }, 5000);
    } else {
      log(name, `FATAL: Exceeded 10 restart attempts. Giving up.`);
    }
  });

  child.on("error", (err) => {
    log(name, `ERROR: ${err.message}`);
  });

  children.set(name, child);
  return child;
}

// ─── Next.js Web Server (Primary — runs in-process) ────────────────────────
async function startWebServer() {
  log("WEB", "Initializing Next.js web server...");

  try {
    const nextPath = require.resolve("next", {
      paths: [path.join(ROOT_DIR, "apps", "web")],
    });
    const next = require(nextPath);

    const app = next({
      dev: false,
      dir: path.join(ROOT_DIR, "apps", "web"),
      conf: { distDir: ".next" },
    });

    const handle = app.getRequestHandler();
    await app.prepare();
    log("WEB", "Next.js app prepared successfully.");

    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    server.listen(WEB_PORT, "0.0.0.0", () => {
      log("WEB", `Next.js web server running on http://0.0.0.0:${WEB_PORT}`);
    });

    server.on("error", (err) => {
      log("WEB", `Server error: ${err.message}`);
    });

    return server;
  } catch (err) {
    log("WEB", `FATAL: Failed to start Next.js server: ${err.message}`);
    log("WEB", err.stack || "");
  }
}

// ─── Boot Sequence ──────────────────────────────────────────────────────────
async function main() {
  log("MAIN", "╔══════════════════════════════════════════════════════════╗");
  log("MAIN", "║         JAAGO HUB v2.0 — Production Startup            ║");
  log("MAIN", "╚══════════════════════════════════════════════════════════╝");
  log("MAIN", `Root directory : ${ROOT_DIR}`);
  log("MAIN", `Node.js version: ${process.version}`);
  log("MAIN", `Web port       : ${WEB_PORT}`);
  log("MAIN", `API port       : ${API_PORT}`);
  log("MAIN", `Environment    : ${process.env.NODE_ENV}`);
  log("MAIN", `tsx runtime    : ${TSX_CLI || "NOT FOUND"}`);
  log("MAIN", "");

  // 1. Start API Backend (from compiled dist/ with resolve hook)
  //    Uses: node --require ./api-resolve-hook.js apps/api/dist/apps/api/src/main.js
  log("MAIN", "── Starting NestJS API Backend ──");
  const resolveHookPath = path.join(ROOT_DIR, "api-resolve-hook.js");
  if (!fs.existsSync(resolveHookPath)) {
    log("API", "ERROR: api-resolve-hook.js not found! API cannot start.");
  } else {
    startService("API", {
      script: "apps/api/dist/apps/api/src/main.js",
      nodeArgs: ["--require", resolveHookPath],
      env: { PORT: String(API_PORT) },
    });
  }

  // 2. Start Background Worker (via tsx, runs from TypeScript source)
  log("MAIN", "── Starting BullMQ Background Worker ──");
  if (TSX_CLI) {
    startService("WORKER", {
      script: "apps/worker/src/main.ts",
      nodeArgs: [TSX_CLI],
      env: {},
    });
  } else {
    log("WORKER", "ERROR: tsx not found! Worker cannot start from .ts source.");
  }

  // 3. Start Next.js Web Frontend (in-process, primary)
  log("MAIN", "── Starting Next.js Web Frontend ──");
  await startWebServer();

  log("MAIN", "");
  log("MAIN", "All services launched. JAAGO HUB is running.");
  log("MAIN", `  → Web    : http://0.0.0.0:${WEB_PORT}`);
  log("MAIN", `  → API    : http://0.0.0.0:${API_PORT}`);
  log("MAIN", `  → Worker : Running in background`);
  log("MAIN", `  → Logs   : ${LOG_FILE}`);
}

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
function shutdown(signal) {
  log("MAIN", `Received ${signal}. Shutting down gracefully...`);

  for (const [name, child] of children.entries()) {
    log("MAIN", `Stopping ${name} (PID: ${child.pid})...`);
    child.kill("SIGTERM");
  }

  setTimeout(() => {
    for (const [name, child] of children.entries()) {
      if (!child.killed) {
        log("MAIN", `Force killing ${name} (PID: ${child.pid})`);
        child.kill("SIGKILL");
      }
    }
    log("MAIN", "Shutdown complete.");
    process.exit(0);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  log("MAIN", `Uncaught Exception: ${err.message}`);
  log("MAIN", err.stack || "");
});

process.on("unhandledRejection", (reason) => {
  log("MAIN", `Unhandled Rejection: ${reason}`);
});

// ─── Start ──────────────────────────────────────────────────────────────────
main().catch((err) => {
  log("MAIN", `FATAL startup error: ${err.message}`);
  log("MAIN", err.stack || "");
  process.exit(1);
});
