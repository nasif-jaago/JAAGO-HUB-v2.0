"use client";

import { useState, useEffect } from "react";
import {
  Cpu,
  Server,
  Database,
  Globe,
  Zap,
  ShieldCheck,
  Code2,
  Layers,
  Sparkles,
  Play,
  Box,
  Terminal,
  Activity,
  Workflow,
  Lock,
} from "lucide-react";

export function SystemArchitectureView() {
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isLiveStream, setIsLiveStream] = useState(true);

  // Periodic simulated heartbeat packets
  useEffect(() => {
    if (!isLiveStream) return;
    const interval = setInterval(() => {
      const flows = [
        "HTTP/2 GET /api/v1/schools/students (BFF Proxy -> Fastify -> Postgres RLS Query: 2.1ms)",
        "CACHE HIT redis:tenant:001:stats (94.2% Hit Rate)",
        "BULLMQ JOB: attendance.geofence.verify (Worker Pool Thread #2)",
        "POST /api/v1/finance/vouchers (Strict Double-Entry Balanced: Sum(Dr)=Sum(Cr))",
        "MCP TOOL CALL: postgres_inspect_schema (Agent Heartbeat: Connected)",
        "AUDIT SEAL: SHA-256 Block #1849 chained to previous hash",
      ];
      const randomFlow = flows[Math.floor(Math.random() * flows.length)]!;
      setSimulationLogs((prev) => [randomFlow, ...prev.slice(0, 4)]);
    }, 2800);

    return () => clearInterval(interval);
  }, [isLiveStream]);

  const triggerLiveFlow = (flowType: string) => {
    setActiveSimulation(flowType);
    if (flowType === "VOUCHER_FLOW") {
      setSimulationLogs((prev) => [
        "[LIVE PUSH] Client dispatched Payment Voucher ($15,000 BDT)",
        "[BFF GATEWAY] Validated JWT Token -> Injected x-tenant-id & x-correlation-id",
        "[NESTJS FASTIFY] Enforced TenantContextGuard & DoubleEntryValidator",
        "[DRIZZLE ORM] Executed parameterized INSERT with PostgreSQL Row-Level Security (RLS)",
        "[EVENT BUS] Published domain event 'voucher.created' to Redis -> Triggered Audit Seal",
        ...prev,
      ]);
    } else if (flowType === "GEOFENCE_FLOW") {
      setSimulationLogs((prev) => [
        "[LIVE PUSH] Staff Mobile GPS Clock-In (24.3636° N, 88.6241° E)",
        "[HAVERSINE ENGINE] Calculated distance: 42.8m from Rajshahi School (Within 150m geofence)",
        "[BIOMETRIC SYNC] Paired with ZKTeco Biometric Device IP (192.168.10.45)",
        "[AUDIT TRAIL] Recorded on-time attendance timestamp",
        ...prev,
      ]);
    } else if (flowType === "MCP_FLOW") {
      setSimulationLogs((prev) => [
        "[AI / MCP AGENT] Triggered Model Context Protocol tool 'generate_grant_milestones'",
        "[STREAMABLE HTTP] Established SSE connection to MCP Server (Port 54321)",
        "[SECURITY] Evaluated granular token scope 'grants.milestones.write'",
        "[EXECUTION] Successfully returned calculated milestone tranches",
        ...prev,
      ]);
    }

    setTimeout(() => setActiveSimulation(null), 3500);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-primary/20 via-background to-secondary/40 border border-primary/30 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/40 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full System Architecture & Developer Blueprint</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              JAAGO HUB v2.0 Enterprise Architecture
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl">
              High-performance, multi-tenant enterprise ERP engineered with Next.js 15, NestJS Fastify, PostgreSQL with Row-Level Security (RLS), Redis BullMQ, and Model Context Protocol (MCP).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsLiveStream(!isLiveStream)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isLiveStream
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              <Activity className={`w-4 h-4 ${isLiveStream ? "animate-pulse" : ""}`} />
              <span>{isLiveStream ? "Live Telemetry Active" : "Telemetry Paused"}</span>
            </button>
          </div>
        </div>

        {/* Live Simulator Flow Triggers */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-semibold">Simulate Request Data Flow:</span>
          <button
            onClick={() => triggerLiveFlow("VOUCHER_FLOW")}
            className="px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-primary hover:text-primary-foreground font-semibold transition-all border border-border/40 flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 text-primary" />
            <span>Finance Double-Entry Voucher Flow</span>
          </button>
          <button
            onClick={() => triggerLiveFlow("GEOFENCE_FLOW")}
            className="px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-primary hover:text-primary-foreground font-semibold transition-all border border-border/40 flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 text-emerald-400" />
            <span>GPS Attendance Geofence Flow</span>
          </button>
          <button
            onClick={() => triggerLiveFlow("MCP_FLOW")}
            className="px-3 py-1.5 rounded-lg bg-secondary/80 hover:bg-primary hover:text-primary-foreground font-semibold transition-all border border-border/40 flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 text-blue-400" />
            <span>Model Context Protocol (MCP) Flow</span>
          </button>
        </div>
      </div>

      {/* ─── INTERACTIVE ANIMATED SYSTEM TOPOLOGY CANVAS ─────────────────────── */}
      <div className="glass-card p-6 rounded-3xl border space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <Workflow className="w-5 h-5 text-primary" />
            <span>Interactive Data Topology & Request Pipeline</span>
          </h3>
          <span className="text-xs font-mono text-muted-foreground">End-to-End Pipeline (Client → BFF → API → DB/Queue)</span>
        </div>

        {/* Visual Architecture Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Node 1: Frontend Tier */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-500 space-y-3 relative overflow-hidden ${
              activeSimulation
                ? "border-primary shadow-lg shadow-primary/20 bg-primary/5"
                : "bg-secondary/40 border-border/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <Globe className="w-5 h-5" />
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">
                PORT 3000
              </span>
            </div>

            <div>
              <h4 className="font-bold text-sm text-foreground">Next.js 15 App Tier</h4>
              <p className="text-xs text-muted-foreground">React 19 • TypeScript • Tailwind v4 • TanStack Query • Zustand</p>
            </div>

            <div className="text-[11px] font-mono text-muted-foreground bg-background/60 p-2.5 rounded-xl border border-border/30 space-y-1">
              <div className="text-primary font-bold">Client Capabilities:</div>
              <div>• Responsive Mobile PWA</div>
              <div>• BFF Route Handler Proxy</div>
              <div>• Client-side RBAC Gates</div>
            </div>

            {activeSimulation && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 via-primary to-emerald-400 animate-pulse" />
            )}
          </div>

          {/* Node 2: Backend API Tier */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-500 space-y-3 relative overflow-hidden ${
              activeSimulation
                ? "border-emerald-400 shadow-lg shadow-emerald-400/20 bg-emerald-500/5"
                : "bg-secondary/40 border-border/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Server className="w-5 h-5" />
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
                PORT 3001
              </span>
            </div>

            <div>
              <h4 className="font-bold text-sm text-foreground">NestJS 11 & Fastify API</h4>
              <p className="text-xs text-muted-foreground">Node.js 22 LTS • TypeScript • OpenAPI Swagger</p>
            </div>

            <div className="text-[11px] font-mono text-muted-foreground bg-background/60 p-2.5 rounded-xl border border-border/30 space-y-1">
              <div className="text-emerald-400 font-bold">Security & Logic Guards:</div>
              <div>• AuthGuard & JWT Validator</div>
              <div>• TenantContextGuard</div>
              <div>• Correlation-ID Tracer</div>
            </div>

            {activeSimulation && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 via-primary to-blue-500 animate-pulse" />
            )}
          </div>

          {/* Node 3: Database & RLS Tier */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-500 space-y-3 relative overflow-hidden ${
              activeSimulation
                ? "border-blue-400 shadow-lg shadow-blue-400/20 bg-blue-500/5"
                : "bg-secondary/40 border-border/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <Database className="w-5 h-5" />
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">
                PORT 5432
              </span>
            </div>

            <div>
              <h4 className="font-bold text-sm text-foreground">PostgreSQL 16 & Supabase</h4>
              <p className="text-xs text-muted-foreground">Drizzle ORM • Multi-Tenant Forced RLS</p>
            </div>

            <div className="text-[11px] font-mono text-muted-foreground bg-background/60 p-2.5 rounded-xl border border-border/30 space-y-1">
              <div className="text-blue-400 font-bold">Data Isolation & Security:</div>
              <div>• Enforced `current_org_id()`</div>
              <div>• AES-256 Envelope DEK/KEK</div>
              <div>• Tamper-Evident SHA-256 Logs</div>
            </div>

            {activeSimulation && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-400 via-primary to-amber-400 animate-pulse" />
            )}
          </div>

          {/* Node 4: Async Queue, Cache & MCP Tier */}
          <div
            className={`p-5 rounded-2xl border transition-all duration-500 space-y-3 relative overflow-hidden ${
              activeSimulation
                ? "border-amber-400 shadow-lg shadow-amber-400/20 bg-amber-500/5"
                : "bg-secondary/40 border-border/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-bold">
                REDIS & MCP
              </span>
            </div>

            <div>
              <h4 className="font-bold text-sm text-foreground">Redis 7, BullMQ & MCP</h4>
              <p className="text-xs text-muted-foreground">EventBus • Model Context Protocol • S3 / SMTP</p>
            </div>

            <div className="text-[11px] font-mono text-muted-foreground bg-background/60 p-2.5 rounded-xl border border-border/30 space-y-1">
              <div className="text-amber-400 font-bold">Async & AI Pipeline:</div>
              <div>• Outbox Domain Event Publisher</div>
              <div>• Automated WAL & S3 Glacier</div>
              <div>• Postgres & Document MCP Tools</div>
            </div>

            {activeSimulation && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 via-primary to-emerald-400 animate-pulse" />
            )}
          </div>
        </div>

        {/* Live Packet Telemetry Terminal */}
        <div className="p-4 rounded-2xl bg-black/80 border border-border/40 font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground pb-2 border-b border-border/30">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Live Packet Inspector & Event Bus Stream</span>
            </span>
            <span className="text-[10px] text-emerald-400">STATUS: 100% OPERATIONAL</span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {simulationLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-foreground/90">
                <span className="text-primary font-bold">❯</span>
                <span className="text-[11px] leading-relaxed">{log}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TECH STACK & LANGUAGE MATRIX ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Languages & Frameworks */}
        <div className="glass-card p-6 rounded-3xl border space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/20 text-primary">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Languages & Core Runtimes</h3>
              <p className="text-xs text-muted-foreground">100% Type-Safe Monorepo</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30">
              <span className="font-semibold text-foreground">TypeScript 5.7</span>
              <span className="font-mono text-primary font-bold">100% Strict Typecheck</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30">
              <span className="font-semibold text-foreground">Node.js 22 LTS</span>
              <span className="font-mono text-muted-foreground">Fastify Backend Engine</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30">
              <span className="font-semibold text-foreground">React 19 & Next.js 15</span>
              <span className="font-mono text-muted-foreground">Turbopack & App Router</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30">
              <span className="font-semibold text-foreground">PostgreSQL 16 SQL</span>
              <span className="font-mono text-emerald-400 font-bold">PL/pgSQL RLS Policies</span>
            </div>
          </div>
        </div>

        {/* Connectors & Persistence */}
        <div className="glass-card p-6 rounded-3xl border space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Database & Connectors</h3>
              <p className="text-xs text-muted-foreground">Persistence & Caching Stack</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30">
              <span className="font-semibold text-foreground">Drizzle ORM 0.38+</span>
              <span className="font-mono text-blue-400 font-bold">Postgres Connection Pool</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30">
              <span className="font-semibold text-foreground">Supabase Cloud</span>
              <span className="font-mono text-muted-foreground">Auth & WAL Archiving</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30">
              <span className="font-semibold text-foreground">ioredis & BullMQ 5.x</span>
              <span className="font-mono text-amber-400 font-bold">Distributed Worker Queues</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30">
              <span className="font-semibold text-foreground">AWS S3 Glacier</span>
              <span className="font-mono text-muted-foreground">Cold Backup Storage</span>
            </div>
          </div>
        </div>

        {/* Architecture Invariants & Standards */}
        <div className="glass-card p-6 rounded-3xl border space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Architectural Invariants</h3>
              <p className="text-xs text-muted-foreground">Zero-Trust Enterprise Rules</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30">
              <span className="font-semibold text-foreground">Forced RLS Isolation</span>
              <span className="font-mono text-emerald-400 font-bold">100% Multi-Tenant</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30">
              <span className="font-semibold text-foreground">AES-256 Envelope DEK/KEK</span>
              <span className="font-mono text-emerald-400 font-bold">At-Rest Encryption</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30">
              <span className="font-semibold text-foreground">Double-Entry Invariant</span>
              <span className="font-mono text-primary font-bold">Sum(Dr) == Sum(Cr)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-secondary/30">
              <span className="font-semibold text-foreground">SHA-256 Hash Chained Logs</span>
              <span className="font-mono text-emerald-400 font-bold">Tamper-Evident Audits</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TURBOREPO MONOREPO SITEMAP & CHEATSHEET ─────────────────────────── */}
      <div className="glass-card p-6 rounded-3xl border space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Box className="w-5 h-5 text-primary" />
              <span>Turborepo Monorepo Package Topology (19 Packages)</span>
            </h3>
            <p className="text-xs text-muted-foreground">Modular workspace dependency graph optimized for fast parallel builds and caching.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30 space-y-2">
            <div className="text-primary font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              <span>Applications (/apps)</span>
            </div>
            <div className="text-muted-foreground space-y-1 text-[11px]">
              <div>• <strong>apps/web</strong>: Next.js 15 Web & PWA</div>
              <div>• <strong>apps/api</strong>: NestJS Fastify API Gateway</div>
              <div>• <strong>apps/worker</strong>: BullMQ Processor</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30 space-y-2">
            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>Core Security & Database</span>
            </div>
            <div className="text-muted-foreground space-y-1 text-[11px]">
              <div>• <strong>packages/database</strong>: Drizzle ORM schemas</div>
              <div>• <strong>packages/security</strong>: AES-256 & Secrets</div>
              <div>• <strong>packages/auth</strong>: Supabase & JWT logic</div>
              <div>• <strong>packages/logger</strong>: Pino redacted logs</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-secondary/30 border border-border/30 space-y-2">
            <div className="text-blue-400 font-bold flex items-center gap-1.5">
              <Cpu className="w-4 h-4" />
              <span>Integration & AI Protocol</span>
            </div>
            <div className="text-muted-foreground space-y-1 text-[11px]">
              <div>• <strong>packages/mcp</strong>: Model Context Protocol</div>
              <div>• <strong>packages/events</strong>: Outbox & EventBus</div>
              <div>• <strong>packages/queue</strong>: BullMQ managers</div>
              <div>• <strong>packages/observability</strong>: Telemetry probes</div>
            </div>
          </div>
        </div>

        {/* Developer Quick-Start CLI Cheatsheet */}
        <div className="p-4 rounded-2xl bg-secondary/40 border border-border/40 space-y-2">
          <span className="font-bold text-xs text-foreground flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span>Developer Quick-Start CLI Cheatsheet</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2 rounded-lg bg-background/80 border border-border/30">
              <span className="text-muted-foreground block text-[10px]">Start Dev Server</span>
              <strong className="text-emerald-400">pnpm run dev</strong>
            </div>
            <div className="p-2 rounded-lg bg-background/80 border border-border/30">
              <span className="text-muted-foreground block text-[10px]">Run Full Unit Tests</span>
              <strong className="text-primary">pnpm test:unit</strong>
            </div>
            <div className="p-2 rounded-lg bg-background/80 border border-border/30">
              <span className="text-muted-foreground block text-[10px]">Typecheck Monorepo</span>
              <strong className="text-blue-400">pnpm typecheck</strong>
            </div>
            <div className="p-2 rounded-lg bg-background/80 border border-border/30">
              <span className="text-muted-foreground block text-[10px]">Production Build</span>
              <strong className="text-amber-400">pnpm run build</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
