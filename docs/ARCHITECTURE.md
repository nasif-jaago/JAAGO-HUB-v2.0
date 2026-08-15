# Architecture — JAAGO Foundation ERP v2.0

> Last updated: 2026-08-16  
> See Architecture Package (implementation_plan.md) for the full authoritative document.  
> This file is the persistent reference summary.

## System Overview

```
┌──────────────────────────────────────────────────────────┐
│                    JAAGO HUB v2.0                        │
│                                                          │
│  Browser / PWA / Mobile                                  │
│  ┌─────────────────────────────────────────────────┐    │
│  │  apps/web  (Next.js 15 App Router)               │    │
│  │  - Server Components (default)                   │    │
│  │  - Client Components (browser-only interactions) │    │
│  │  - Thin BFF (route handlers — proxy only)        │    │
│  └─────────────────┬───────────────────────────────┘    │
│                    │ HTTP (cookie + JWT forwarded)        │
│  ┌─────────────────▼───────────────────────────────┐    │
│  │  apps/api  (NestJS on Fastify)                   │    │
│  │  - All business logic                            │    │
│  │  - RBAC + RLS enforcement                        │    │
│  │  - OpenAPI 3.1 auto-generated                    │    │
│  └────┬────────────┬──────────────────┬─────────────┘   │
│       │            │                  │                   │
│  ┌────▼──┐   ┌─────▼────┐   ┌────────▼────────┐        │
│  │Supabase│  │  Redis   │   │  apps/worker    │        │
│  │(PG+Auth│  │(cache+   │   │  (BullMQ jobs) │        │
│  │+Storage│  │ queue)   │   │               │        │
│  └────────┘  └──────────┘   └───────────────┘        │
└──────────────────────────────────────────────────────────┘
```

## Non-Negotiable Boundaries

1. **Browser → API only.** Never browser → Supabase for business data writes.
2. **Supabase service-role key** in `apps/api` and `apps/worker` only.
3. **Secrets never reach** browser, Git, logs, localStorage.
4. **Server-side authorization is mandatory.** RLS is a backstop, not the gate.
5. **No placeholder security, fake data, or dead buttons.**

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend framework | Next.js (App Router) + React + TypeScript | Latest stable |
| Styling | Tailwind CSS + shadcn/ui | Latest stable |
| Icons | Lucide React | Latest stable |
| Server state | TanStack Query | v5 |
| Data tables | TanStack Table | v8 |
| Forms | React Hook Form + Zod | Latest stable |
| Charts | Recharts | Latest stable |
| Backend framework | NestJS on Fastify + TypeScript | Latest stable |
| ORM | Drizzle ORM | Latest stable |
| Database | PostgreSQL (Supabase) | Latest stable |
| Auth | Supabase Auth | Latest stable |
| File storage | Supabase Storage | Latest stable |
| Cache | Redis (ioredis) | Latest stable |
| Queue | BullMQ | Latest stable |
| Logger | Pino | Latest stable |
| Observability | OpenTelemetry | Latest stable |
| Monorepo | pnpm + Turborepo | Latest stable |
| Runtime | Node.js | LTS |

## Architecture Layers (per module)

```
interface/          HTTP layer: controllers, DTOs, guards, OpenAPI
    ↓
application/        Use cases: commands/queries, authZ, transaction orchestration
    ↓
domain/             Entities, value objects, domain events, invariants (pure TS, zero framework imports)
    ↑
infrastructure/     Drizzle repos, Redis, BullMQ, email, external adapters
```

## Cross-Cutting Concerns (Global NestJS middleware/guards)

```
Request →
  Correlation-ID injection
  → Structured logging
  → AuthN guard (JWT verify)
  → AuthZ guard (RBAC check)
  → Tenant-context guard (SET LOCAL app.current_*)
  → Input validation (Zod pipe)
  → Rate limiting
  → Business logic
  → Centralized error mapping
→ Response
```

## Module Communication Rules

- Modules communicate ONLY via:
  1. Published application-service interfaces
  2. Domain events on the event bus
  3. Internal API calls
- **A module NEVER imports another module's repositories or internal services.**
- This is enforced via ESLint module-boundary rules.

## Frontend State Model

| State Type | Tool | Notes |
|---|---|---|
| Server state | TanStack Query | Single source of truth |
| URL state | `searchParams` | Filters, pagination, sort, tabs |
| Form state | React Hook Form + Zod | Schemas shared with backend |
| Local UI state | useState / useReducer | Component-local only |
| Cross-cutting UI | Zustand (minimal) | Sidebar, command palette, org switcher |

## Responsive Breakpoints

| Name | Width | Layout |
|---|---|---|
| Mobile | < 640px | Single column, off-canvas sidebar, cards |
| Tablet | 640–1024px | Icon rail sidebar, prioritized table columns |
| Laptop | 1024–1440px | Full sidebar, multi-column forms |
| Desktop | 1440–1920px | 2-pane master-detail where appropriate |
| Ultra-wide | > 1920px | Centered content, max-width cap |

## PWA Strategy

- Web manifest: JAAGO HUB, installable to Android/iOS home screen
- Service worker: static-asset caching + offline-tolerant read views
- Offline reads: my tasks, my approvals, employee lookup (cached data)
- **No offline writes for financial/irreversible actions**
- Target: good Core Web Vitals on throttled mid-range Android + slow network

## Key Design Decisions

See `/docs/DECISIONS.md` for full ADR log.

- ADR-001: NestJS/Fastify over Express (performance, TypeScript, ecosystem)
- ADR-002: Drizzle ORM over Prisma (single migration source via Supabase CLI)
- ADR-003: Supabase over self-hosted PostgreSQL (managed auth, storage, RLS, PITR)
- ADR-004: PWA over native apps (initial strategy — revisit after 12mo)
- ADR-005: Partitioned PostgreSQL for logs over Elasticsearch (simplicity, no extra infra)
- ADR-006: pnpm + Turborepo monorepo (workspace efficiency, build caching)
