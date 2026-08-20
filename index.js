/**
 * JAAGO HUB v2.0 — Unified Production Startup (cPanel / CloudLinux / Phusion Passenger / VPS)
 *
 * Single master entry point that boots and supervises all three subsystems:
 *   1. Next.js Web Frontend  (Binds to cPanel assigned $PORT or 3000)
 *   2. NestJS Fastify API    (Runs isolated on 127.0.0.1:$API_PORT or 3001)
 *   3. BullMQ Worker         (Runs as background supervisor connected to Redis/Postgres)
 *
 * Architecture for cPanel Node.js App Manager:
 *   - Application Root: / (or deploy_package folder)
 *   - Application Startup File: index.js
 *   - Application Mode: Production
 *
 * Usage:
 *   NODE_ENV=production node index.js
 */

"use strict";

const { spawn } = require("child_process");
const path = require("path");
const http = require("http");
const url = require("url");
const fs = require("fs");

// ─── Configuration ──────────────────────────────────────────────────────────
const ROOT_DIR = path.resolve(__dirname);
const RAW_PORT = process.env.PORT || "3000";
// cPanel Passenger may pass a named pipe/socket or a numeric port
const WEB_PORT = isNaN(Number(RAW_PORT)) ? RAW_PORT : parseInt(RAW_PORT, 10);
const API_PORT = parseInt(process.env.API_PORT || "3001", 10);

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "production";
}

// ─── Logging Helper with Disk-Safe Rotation ──────────────────────────────────
const LOG_DIR = path.join(ROOT_DIR, "logs");
try {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (_) {
  // Fall back to root dir
}

const LOG_FILE = path.join(
  fs.existsSync(LOG_DIR) ? LOG_DIR : ROOT_DIR,
  "jaago-hub.log"
);
const MAX_LOG_BYTES = 10 * 1024 * 1024; // 10MB log rotation threshold

function log(service, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${service}] ${message}`;
  console.log(line);
  try {
    // Check log file size and rotate if necessary
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > MAX_LOG_BYTES) {
        const backupFile = `${LOG_FILE}.1`;
        if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile);
        fs.renameSync(LOG_FILE, backupFile);
      }
    }
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch (_) {
    // Fail silently on log write
  }
}

// ─── Resolve tsx CLI runtime if needed ─────────────────────────────────────
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

// ─── Child Process Supervisor ───────────────────────────────────────────────
const children = new Map(); // name -> { child, restartCount, exiting }

function startService(name, { script, nodeArgs = [], env = {} }) {
  const fullPath = path.resolve(ROOT_DIR, script);

  if (!fs.existsSync(fullPath)) {
    log(name, `WARN: Entry file not found at ${fullPath}`);
    return null;
  }

  const args = [...nodeArgs, fullPath];
  log(name, `Starting process: node ${args.join(" ")}`);

  const child = spawn(process.execPath, args, {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || "production",
      ...env,
    },
    stdio: ["pipe", "pipe", "pipe"],
  });

  child._serviceName = name;

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
    const record = children.get(name);
    if (record && record.exiting) {
      children.delete(name);
      return;
    }
    children.delete(name);

    // Auto-restart with exponential backoff (max 10 retries)
    const retries = ((record && record.restartCount) || 0) + 1;
    if (retries <= 10) {
      const delay = Math.min(30000, 2000 * Math.pow(1.5, retries - 1));
      log(name, `Restarting in ${(delay / 1000).toFixed(1)}s... (attempt ${retries}/10)`);
      setTimeout(() => {
        const newChild = startService(name, { script, nodeArgs, env });
        if (newChild) {
          children.set(name, { child: newChild, restartCount: retries, exiting: false });
        }
      }, delay);
    } else {
      log(name, `FATAL: Exceeded maximum 10 restart attempts for ${name}.`);
    }
  });

  child.on("error", (err) => {
    log(name, `ERROR: ${err.message}`);
  });

  children.set(name, { child, restartCount: 0, exiting: false });
  return child;
}

// ─── Find Valid Entry Point Candidates ──────────────────────────────────────
function findCandidateFile(candidates) {
  for (const rel of candidates) {
    const full = path.join(ROOT_DIR, rel);
    if (fs.existsSync(full)) return rel;
  }
  return null;
}

// ─── Next.js Web Server (Primary In-Process Server) ─────────────────────────
async function startWebServer() {
  log("WEB", "Initializing Next.js web application...");

  try {
    const webDir = path.join(ROOT_DIR, "apps", "web");
    const nextPath = require.resolve("next", {
      paths: [webDir, ROOT_DIR],
    });
    const next = require(nextPath);

    const app = next({
      dev: false,
      dir: fs.existsSync(webDir) ? webDir : ROOT_DIR,
      conf: { distDir: ".next" },
    });

    const handle = app.getRequestHandler();
    await app.prepare();
    log("WEB", "Next.js application prepared successfully.");

    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);

      // Top-level Master Health Probe
      if (parsedUrl.pathname === "/health" || parsedUrl.pathname === "/system/health") {
        const apiChild = children.get("API");
        const workerChild = children.get("WORKER");
        const status = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: "2.0.0",
          services: {
            web: "running (in-process)",
            api: apiChild && apiChild.child.exitCode === null ? "running" : "offline",
            worker: workerChild && workerChild.child.exitCode === null ? "running" : "idle",
          },
        };
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(status, null, 2));
        return;
      }

      handle(req, res, parsedUrl);
    });

    server.listen(WEB_PORT, () => {
      log("WEB", `Master Web Server listening on ${typeof WEB_PORT === "number" ? `http://0.0.0.0:${WEB_PORT}` : WEB_PORT}`);
    });

    server.on("error", (err) => {
      log("WEB", `Master Web Server error: ${err.message}`);
    });

    return server;
  } catch (err) {
    log("WEB", `FATAL: Failed to start Next.js server: ${err.message}`);
    log("WEB", err.stack || "");
    throw err;
  }
}

// ─── Boot Master Sequence ───────────────────────────────────────────────────
async function main() {
  log("MAIN", "==========================================================");
  log("MAIN", "  JAAGO HUB v2.0 — Production Server Manager (cPanel/Node)");
  log("MAIN", "==========================================================");
  log("MAIN", `Root Directory : ${ROOT_DIR}`);
  log("MAIN", `Node Version   : ${process.version}`);
  log("MAIN", `Web Binding    : ${WEB_PORT}`);
  log("MAIN", `API Loopback   : 127.0.0.1:${API_PORT}`);
  log("MAIN", `Environment    : ${process.env.NODE_ENV}`);
  log("MAIN", `Logs Destination: ${LOG_FILE}`);

  const resolveHookPath = path.join(ROOT_DIR, "api-resolve-hook.js");
  const hasResolveHook = fs.existsSync(resolveHookPath);

  // 1. Boot NestJS Fastify API Backend
  log("MAIN", "--> Booting API Backend Subsystem");
  const apiEntry = findCandidateFile([
    "apps/api/dist/apps/api/src/main.js",
    "apps/api/dist/src/main.js",
    "apps/api/dist/main.js",
    "apps/api/src/main.ts",
  ]);

  if (apiEntry) {
    const isTs = apiEntry.endsWith(".ts");
    const nodeArgs = [];
    if (hasResolveHook && !isTs) {
      nodeArgs.push("--require", resolveHookPath);
    } else if (isTs && TSX_CLI) {
      nodeArgs.push(TSX_CLI);
    }

    startService("API", {
      script: apiEntry,
      nodeArgs,
      env: {
        PORT: String(API_PORT),
        API_PORT: String(API_PORT),
      },
    });
  } else {
    log("API", "WARN: No compiled API entry point found in apps/api/dist.");
  }

  // 2. Boot BullMQ Background Worker
  log("MAIN", "--> Booting Background Worker Subsystem");
  const workerEntry = findCandidateFile([
    "apps/worker/dist/apps/worker/src/main.js",
    "apps/worker/dist/src/main.js",
    "apps/worker/dist/main.js",
    "apps/worker/src/main.ts",
  ]);

  if (workerEntry) {
    const isTs = workerEntry.endsWith(".ts");
    const nodeArgs = [];
    if (hasResolveHook && !isTs) {
      nodeArgs.push("--require", resolveHookPath);
    } else if (isTs && TSX_CLI) {
      nodeArgs.push(TSX_CLI);
    }

    startService("WORKER", {
      script: workerEntry,
      nodeArgs,
      env: {},
    });
  } else {
    log("WORKER", "INFO: Worker service entry not detected; skipping.");
  }

  // 3. Boot Primary Next.js Web Server (runs in-process for cPanel Passenger compatibility)
  log("MAIN", "--> Booting Next.js Web Frontend Subsystem");
  await startWebServer();

  log("MAIN", "All JAAGO HUB subsystems successfully initialized.");
}

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
function shutdown(signal) {
  log("MAIN", `Received ${signal}. Performing graceful shutdown...`);

  for (const [name, record] of children.entries()) {
    record.exiting = true;
    if (record.child && record.child.pid) {
      log("MAIN", `Stopping ${name} (PID: ${record.child.pid})...`);
      record.child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const [name, record] of children.entries()) {
      if (record.child && !record.child.killed) {
        log("MAIN", `Force terminating ${name} (PID: ${record.child.pid})`);
        record.child.kill("SIGKILL");
      }
    }
    log("MAIN", "Shutdown sequence finalized.");
    process.exit(0);
  }, 5000);
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

// Auto-run if executed directly as main script
if (require.main === module) {
  main().catch((err) => {
    log("MAIN", `FATAL startup exception: ${err.message}`);
    process.exit(1);
  });
}

module.exports = {
  startService,
  startWebServer,
  children,
  log,
  main,
  ROOT_DIR,
  LOG_FILE,
};
