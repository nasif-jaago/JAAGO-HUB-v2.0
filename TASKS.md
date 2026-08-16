# JAAGO Foundation ERP v2.0 — TASKS

> Living task list. Updated after every step. Last updated: 2026-08-16.
> Legend: `[ ]` pending · `[/]` in progress · `[x]` complete · `[-]` skipped/deferred

---

## PHASE 0 — Architecture & Discovery

- [x] **Step 0.1** Produce the Architecture & Discovery Package (§22)
  - [x] Executive summary
  - [x] Assumptions (labeled)
  - [x] Modules + responsibilities
  - [x] User roles
  - [x] Permission matrix
  - [x] Information architecture (sidebar/nav)
  - [x] Route map
  - [x] Database entities + relationships
  - [x] Mermaid ERD
  - [x] Approval engine design
  - [x] Security architecture
  - [x] Frontend architecture
  - [x] Full folder structure
  - [x] Development roadmap
  - [x] MVP definition
  - [x] Risk register
  - [x] Decisions requiring stakeholder approval

- [x] **Step 0.2** Create all `/docs/*` and `/TASKS.md`
  - [x] `/docs/PROJECT_CONTEXT.md`
  - [x] `/docs/ARCHITECTURE.md`
  - [x] `/docs/DATABASE_CONVENTIONS.md`
  - [x] `/docs/SECURITY.md`
  - [x] `/docs/MODULE_GUIDE.md`
  - [x] `/docs/API_GUIDE.md`
  - [x] `/docs/DEPLOYMENT.md`
  - [x] `/docs/OPERATIONS.md`
  - [x] `/docs/DECISIONS.md`
  - [x] `/docs/CHANGELOG.md`
  - [x] `/TASKS.md`

- ✓ **Phase 0 Checkpoint:** All docs exist and are internally consistent. Architecture package delivered.

---

## PHASE 1 — Foundation

- [x] **Step 1.1** Scaffold pnpm + Turborepo monorepo + folder structure + `packages/config`
  - [x] Root `package.json` + `pnpm-workspace.yaml` + `turbo.json`
  - [x] `packages/config` (eslint/tsconfig/tailwind/prettier presets)
  - [x] All workspace package stubs (`packages/*`, `apps/*`)
  - [x] ✓ Checkpoint: `pnpm install` succeeds; lint/typecheck run

- [x] **Step 1.2** `packages/shared-types` + `packages/validation`
  - [x] Shared Zod schemas (auth, org, employee, leave, procurement)
  - [x] Shared TypeScript types/enums
  - [x] ✓ Checkpoint: importable from web & api

- [x] **Step 1.3** `packages/logger` — non-blocking Pino logger
  - [x] Pino setup with bounded ring buffer
  - [x] Background flusher (drains buffer in batches)
  - [x] Drop-on-overload with `logs_dropped_total` counter
  - [x] Structural redaction (path-based + regex backstop)
  - [x] Self-metrics
  - [x] ✓ Checkpoint: buffer drops under overload; redaction test proves secret never reaches sink

- [x] **Step 1.4** `packages/observability` + health probes
  - [x] OTel trace + metrics setup
  - [x] Liveness/readiness/DB/Redis/queue health probes
  - [x] ✓ Checkpoint: `/health` returns real component status

- [x] **Step 1.5** `packages/security`
  - [x] `SecretManager` abstraction
  - [x] Envelope encryption (KEK/DEK)
  - [x] Webhook HMAC signing/verification
  - [x] **Zod env validation that refuses to start** on missing config
  - [x] ✓ Checkpoint: app aborts boot on missing required env var

- [x] **Step 1.6** `packages/database` + Supabase local + first migration
  - [x] Drizzle ORM setup
  - [x] Repository base class (forbids unbounded queries)
  - [x] Supabase CLI local setup
  - [x] First migration (trivial table with RLS)
  - [x] ✓ Checkpoint: trivial table migrates up/down; unbounded query throws

- [x] **Step 1.7** `packages/cache` + `packages/queue` + `packages/events`
  - [x] Redis client + namespaces/tags/TTL/SWR/locks
  - [x] BullMQ setup + job base + idempotency + DLQ
  - [x] In-proc + Redis Streams event bus + outbox pattern
  - [x] ✓ Checkpoint: demo job enqueues/runs/dedupes; event round-trips via outbox

- [x] **Step 1.8** Scaffold `apps/api` (NestJS/Fastify)
  - [x] Global guards: auth, permission, tenant-context
  - [x] Interceptors: correlation-ID, structured logging, transform
  - [x] Centralized error mapping (code/status/human message/correlationId)
  - [x] Rate limiting (layered)
  - [x] Demo endpoint with OpenAPI decoration
  - [x] ✓ Checkpoint: demo endpoint returns envelope + correlationId in logs

- [x] **Step 1.9** Scaffold `apps/web` (Next.js App Router)
  - [x] Mobile-first app shell (Sidebar, Topbar, PageHeader, Breadcrumbs)
  - [x] Responsive: drawer (mobile) / icon rail (tablet) / full sidebar (laptop+)
  - [x] Semantic design tokens + breakpoints
  - [x] `loading.tsx`, `error.tsx`, `not-found.tsx`
  - [x] Thin BFF route handler forwarding session to `apps/api`
  - [x] PWA: web manifest + service worker (static-asset caching)
  - [x] ✓ Checkpoint: shell renders + usable at all breakpoints; installable; fetches demo endpoint via BFF

- [x] **Step 1.10** `apps/worker` + Docker + CI
  - [x] BullMQ consumer bootstrap
  - [x] Base docker-compose (PG + Redis + LocalStack/MinIO + Mailhog)
  - [x] GitHub Actions CI: typecheck -> lint -> test -> build -> secret scan
  - [x] ✓ Checkpoint: `pnpm dev` boots all services; CI workflow passes on PR

- ✓ **Phase 1 DoD:** foundation runs locally; CI green; env-guard works; logger non-blocking; health + logged request work end-to-end

---

## PHASE 2 — Identity, Tenancy, Auth & RBAC

- [x] **Step 2.1** Data model: users, employees, organizations, offices, departments, roles, permissions, etc.
- [x] **Step 2.2** Tenant-context guard + RLS enabled & forced on all identity tables
- [x] **Step 2.3** RBAC + dynamic Admin Settings in `apps/api` and `apps/web` (Live RBAC matrix, SMTP setup, API tokens)
- [x] **Step 2.4** Supabase Auth: email + Google OAuth + MFA
- [x] **Step 2.5** Sessions/devices + login audit + invitation flow
- [x] **Step 2.6** Frontend auth pages + `<PermissionGate>` + permission-filtered Sidebar

---

## PHASE 3 — Core Platform Services

- [ ] **Step 3.1** Audit logging (tamper-evident, hash-chained)
- [ ] **Step 3.2** Email service (provider-agnostic, templated, queued)
- [ ] **Step 3.3** Notifications + Notification Center UI
- [ ] **Step 3.4** File storage abstraction
- [ ] **Step 3.5** Temporary Resource Lifecycle & Cleanup
- [ ] **Step 3.6** Reference-number service

---

## PHASE 4 — Module Framework & Reusable Infra

- [ ] **Step 4.1** ModuleContract runtime + module registry
- [ ] **Step 4.2** Module generator CLI
- [ ] **Step 4.3** Approval/Workflow engine
- [ ] **Step 4.4** Shared UI library (`packages/ui`)
- [ ] **Step 4.5** Import/Export + Reporting infrastructure

---

## PHASE 5 — First Business Slice

- [ ] **Step 5.1** Employees module (backend + frontend, mobile-verified)
- [ ] **Step 5.2** Leave management (apply/approve/balance/calendar)

---

## PHASE 6 — Operations Admin / System Control Center

- [ ] **Step 6.1** Observability & Logs Center UI
- [ ] **Step 6.2** Background Jobs Center
- [ ] **Step 6.3** Cache Management Center
- [ ] **Step 6.4** Storage & Cleanup Center
- [ ] **Step 6.5** Integrations + API Management + MCP admin
- [ ] **Step 6.6** Backup & Recovery Center
- [ ] **Step 6.7** System dashboard + health overview

---

## PHASE 7 — Remaining Business Modules

- [ ] **7.1** Attendance, Onboarding, Recruitment (complete HR)
- [ ] **7.2** Programmes & Projects
- [ ] **7.3** Donors & Grants
- [ ] **7.4** Procurement & Vendors
- [ ] **7.5** Inventory & Assets
- [ ] **7.6** Finance (operational)
- [ ] **7.7** Documents, Tasks, Comments, Reports/Dashboards

---

## PHASE 8 — Hardening & Pilot Readiness

- [ ] Security review + cross-org sweep
- [ ] Performance review (EXPLAIN ANALYZE, mobile profile)
- [ ] Cross-device review (real phones/tablets/laptops/desktops)
- [ ] Accessibility review
- [ ] Backup/restore verification
- [ ] DR runbook validation

---

## OPEN DECISIONS (blocking or tracked)

> See `/docs/DECISIONS.md` for full ADR log

| ID | Decision | Status | Owner |
|---|---|---|---|
| D1 | Supabase Cloud approval for production | Pending | IT/Management |
| D2 | Fiscal year: July–June | Pending confirmation | Finance |
| D3 | Leave types and entitlement rules | Pending | HR Admin |
| D4 | Procurement approval thresholds | Pending | Finance/Management |
| D5 | MFA enforcement timeline | Pending | IT/Management |
| D6 | Google Workspace domain restriction (@jaago.com.bd) | Pending | IT |
| D7 | Data migration scope (full Odoo history vs. active records only) | Pending | Management |
| D8 | Fund accounting model (per-grant vs. cost-center overlay) | Pending | Finance |

---

## KNOWN RISKS

See `/docs/PROJECT_CONTEXT.md` Risk Register (Section P) for full list.

Top 3 for immediate attention:
1. **Odoo data migration complexity** — needs a dedicated migration plan
2. **Finance accounting rules** — must not code before Finance team validates
3. **Cross-tenant data isolation** — cross-org tests written BEFORE RLS policies in Phase 2

---

## COMPLETED STEPS

| Date | Step | Description |
|---|---|---|
| 2026-08-16 | Phase 0 | Architecture & Discovery Package delivered |
| 2026-08-16 | Phase 0 | All `/docs/*` and `TASKS.md` created |
| 2026-08-16 | Step 1.1 | pnpm + Turborepo monorepo scaffold, packages/config, git initialized & pushed |
| 2026-08-16 | Step 1.2 | packages/shared-types & packages/validation with core Zod schemas and enums |
| 2026-08-16 | Step 1.3 | packages/logger non-blocking Pino logger, ring-buffer, structural redaction, flusher, 35 unit/security tests passing |
| 2026-08-16 | Step 1.4 | packages/observability health probes (DB, Redis, Queue, Storage), Tracer, SystemMetricsCollector, 9 unit tests passing |
| 2026-08-16 | Step 1.5 | packages/security SecretManager, envelope encryption (AES-256-GCM), webhook HMAC signer, boot env validator, 13 unit tests passing |
| 2026-08-16 | Step 1.6 | packages/database Drizzle ORM schema, BaseRepository with unbounded query prevention, RLS migration, 8 unit tests passing |
| 2026-08-16 | Step 1.7 | packages/cache, packages/queue, packages/events (Redis locks, BullMQ queue manager, EventBus & Outbox publisher, 10 unit tests passing) |
| 2026-08-16 | Step 1.8 | apps/api NestJS Fastify scaffold, global guards (auth, tenant, permission), interceptors (correlation-id, logging, transform), global exception filter, OpenAPI docs, health & ping endpoints |
| 2026-08-16 | Step 1.9 | apps/web Next.js 15 App Router scaffold, responsive mobile-first AppShell (Sidebar, Topbar, PageHeader), dark design tokens, BFF proxy route handler, PWA manifest & service worker |
| 2026-08-16 | Step 1.10 | apps/worker BullMQ processor bootstrap, docker-compose.yml with multi-stage non-root Dockerfiles, GitHub Actions CI workflow (.github/workflows/ci.yml) |
| 2026-08-16 | Step 2.1 | IAM Data Model: Drizzle ORM schemas + PostgreSQL migration (users, employees, organizations, offices, departments, roles, permissions, user_roles, role_permissions, invitations, sessions) with 14 database unit tests passing |
| 2026-08-16 | Step 2.2 | RLS Policies & Tenant Isolation: PostgreSQL RLS enabled and forced across all IAM tables with current_org_id() and super_admin bypass helpers |
| 2026-08-16 | Step 2.3 | Dynamic Admin Settings & RBAC: NestJS AdminModule (/api/v1/admin/rbac/roles, permissions, /admin/settings/email, /admin/settings/api-tokens) connected to Next.js Admin Settings UI (/admin/settings) with 7 unit tests passing |
| 2026-08-16 | Step 2.4 | Supabase Auth & JWT: ApiAuthModule with login, signup, TOTP MFA challenge/verify and setup flows |
| 2026-08-16 | Step 2.5 | Sessions & Invitations: Active device session tracking, revocation, and token-based invitation acceptance |
| 2026-08-16 | Step 2.6 | Frontend Auth & RBAC Gates: Responsive /login, /signup, /invite/[token] pages, Zustand useAuthStore, and declarative <PermissionGate> component |
