"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  CalendarCheck,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { apiClient } from "@/lib/api-client";

interface PingData {
  message: string;
  timestamp: string;
  correlationId: string;
  uptimeSeconds: number;
}

export default function DashboardPage() {
  const { data: pingData, isLoading, isError, refetch, isFetching } = useQuery<PingData>({
    queryKey: ["api-ping"],
    queryFn: () => apiClient<PingData>("/v1/ping"),
    retry: 2,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Executive Overview"
        subtitle="Real-time operational health, cross-module indicators, and mission activity."
        badge={
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>JAAGO HUB Online</span>
          </div>
        }
        actions={
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40 text-xs font-medium transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh Health</span>
          </button>
        }
      />

      {/* API Backend Live Status Card */}
      <div className="glass-card p-5 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-transparent to-jaago-teal/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/20 text-primary border border-primary/40">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">NestJS API & Fastify Engine</h3>
                {isLoading ? (
                  <span className="text-xs text-muted-foreground">Checking probe...</span>
                ) : isError ? (
                  <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Offline / Connecting
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected via BFF
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pingData
                  ? `${pingData.message} • Uptime: ${pingData.uptimeSeconds}s`
                  : "Connecting to API backend service on port 3001..."}
              </p>
            </div>
          </div>

          {pingData?.correlationId && (
            <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-background/80 border border-border/40 text-muted-foreground self-start sm:self-auto">
              <span className="text-primary font-semibold">CorrID:</span> {pingData.correlationId}
            </div>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="glass-card p-5 rounded-xl space-y-3 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Staff</span>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">1,248</div>
            <div className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12 new hires this month</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-card p-5 rounded-xl space-y-3 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Pending Approvals</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">18</div>
            <div className="text-xs text-muted-foreground">
              Across HR, Finance & Procurement
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-card p-5 rounded-xl space-y-3 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Staff on Leave</span>
            <div className="p-2 rounded-lg bg-jaago-teal/10 text-jaago-teal">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">34</div>
            <div className="text-xs text-muted-foreground">
              98.2% attendance rate today
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-card p-5 rounded-xl space-y-3 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Security Posture</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-foreground">RLS + KEK</div>
            <div className="text-xs text-emerald-400 font-medium">
              Multi-tenant isolated
            </div>
          </div>
        </div>
      </div>

      {/* Module Overview Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Launchpad */}
        <div className="glass-card p-6 rounded-2xl lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base text-foreground">Foundation Modules</h3>
            <span className="text-xs text-muted-foreground">7 Active Systems</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              {
                title: "HR & Employee Directory",
                desc: "Employee lifecycle, profiles, NID, designations",
                href: "/hr/employees",
                color: "text-blue-400",
              },
              {
                title: "Leave & Time Off",
                desc: "Annual, casual, sick balances and approvals",
                href: "/hr/leave",
                color: "text-emerald-400",
              },
              {
                title: "Procurement & Requisitions",
                desc: "Purchase requests, quotation comparison, POs",
                href: "/procurement",
                color: "text-amber-400",
              },
              {
                title: "Finance & Operational Ledgers",
                desc: "Chart of accounts, payments, multi-currency",
                href: "/finance",
                color: "text-purple-400",
              },
            ].map((mod) => (
              <a
                key={mod.title}
                href={mod.href}
                className="group p-4 rounded-xl bg-secondary/40 hover:bg-secondary/70 border border-border/40 transition-all duration-150 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-semibold ${mod.color}`}>{mod.title}</span>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="text-xs text-muted-foreground">{mod.desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* System & Architecture Info */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <h3 className="font-semibold text-base text-foreground">System Specifications</h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground">Monorepo Engine</span>
              <span className="font-mono text-foreground font-medium">Turborepo + pnpm</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground">Frontend Runtime</span>
              <span className="font-mono text-foreground font-medium">Next.js 15 App Router</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground">Backend Runtime</span>
              <span className="font-mono text-foreground font-medium">NestJS on Fastify</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="text-muted-foreground">Database Engine</span>
              <span className="font-mono text-foreground font-medium">PostgreSQL + Drizzle</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Offline Strategy</span>
              <span className="font-mono text-foreground font-medium">PWA Service Worker</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
