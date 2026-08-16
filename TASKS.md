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

- [x] **Step 3.1** Audit logging (tamper-evident, hash-chained)
- [x] **Step 3.2** Email service (provider-agnostic, templated, queued)
- [x] **Step 3.3** Notifications + Notification Center UI
- [x] **Step 3.4** File storage abstraction
- [x] **Step 3.5** Temporary Resource Lifecycle & Cleanup
- [x] **Step 3.6** Reference-number service

- ✓ **Phase 3 DoD:** audit log sealed & verified; emails sent via worker; notification center updates live; storage providers tested; cleanup job purges expired resources; references generated.

---

## PHASE 4 — Domain Modules (Vertical Slices)

- [x] **Step 4.1** Module registry & domain event contracts
- [x] **Step 4.2** Approvals Engine (multi-tier, threshold-based, dynamic delegation)
- [x] **Step 4.3** HR: Employees module
- [x] **Step 4.4** HR: Leave module (quota, accrual, approval hook)
- [x] **Step 4.5** HR: Attendance module (biometric + geofenced check-in)
- [x] **Step 4.6** HR: Recruitment & Onboarding module
- [x] **Step 4.7** Procurement: PR → Quotation → Comparison → PO
- [x] **Step 4.8** Inventory: Goods Receipt (GRN) → Stock Ledger → Dispatch
- [x] **Step 4.9** Finance: Chart of Accounts → Journal/Payment Vouchers → Approval
- [ ] **Step 4.10** Fixed Assets & Fleet management module
- [ ] **Step 4.11** Field Programmes & School Operations module
- [ ] **Step 4.12** Donors & Grant Management module
- [ ] **Step 4.13** Vendor Portal & Compliance modulenter
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
| 2026-08-16 | Step 3.1 | Tamper-Evident Audit Logging: SHA-256 hash chaining on all log records with automatic integrity verification |
| 2026-08-16 | Step 3.2 | Email Service & Templates: Provider-agnostic engine (Mock, SMTP) with HTML templates (welcome, leave decision) and BullMQ worker queue |
| 2026-08-16 | Step 3.3 | Notification Center UI: In-app notification service with real-time polling popover, unread counter badges, and mark-as-read transitions |
| 2026-08-16 | Step 3.4 | File Storage Abstraction: Pluggable storage providers (Mock, Supabase Storage, S3) with signed URLs and buffer uploads |
| 2026-08-16 | Step 3.5 | Temporary Resource Cleanup: BullMQ maintenance worker processor for session expiry, temp files, and stale export purges |
| 2026-08-16 | Step 3.6 | Reference Number Service: Enterprise sequential code generator for PR, PO, GRN, Leave, Vouchers, and Asset tags |
| 2026-08-16 | Step 4.1 | Module Registry & Domain Events: SYSTEM_MODULES catalog + domain event contracts (HR, Procurement, Finance, Approvals) |
| 2026-08-16 | Step 4.2 | Approvals Engine & Dashboard: Multi-tier threshold approval engine with delegation and dedicated UI (/approvals) |
| 2026-08-16 | Step 4.3 | HR Employees Master Directory: Staff directory CRUD, auto EMP-code generation, department/branch filters, and UI (/hr/employees) |
| 2026-08-16 | Step 4.4 | HR Leave & Time-Off: Bangladesh quota management (Annual, Sick, Casual, Maternity), application modal, and approvals integration (/hr/leave) |
| 2026-08-16 | Step 4.5 | HR Attendance & Admin Geofencing: Haversine geofence calculation, live mobile GPS clock-in (/hr/attendance), and full Admin Panel branch & biometric editor (/admin/settings) |
| 2026-08-16 | Step 4.6 | HR Recruitment & Onboarding (ATS): Job opening requisitions, candidate pipeline screening, and 1-click automated employee master enrollment (/hr/recruitment) |
| 2026-08-16 | Step 4.7 | Procurement: Purchase Requisitions (PR), multi-vendor quotation comparison (CS), and automated Purchase Order (PO) issuance (/procurement) |
