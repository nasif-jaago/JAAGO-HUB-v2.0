# MASTER BUILD PROMPT — JAAGO FOUNDATION ERP
## Full-Stack (Frontend + Backend + Observability/Logger) · Step-Wise Execution
### Paste this entire document into Antigravity AI as the project's governing prompt.

---

## 0. HOW TO USE THIS PROMPT (read first, obey throughout)

This is a long-lived, governing prompt. You will NOT build everything in one pass.

1. Work **strictly phase by phase**, and **step by step inside each phase**. Never skip ahead.
2. Every step ends with a **✓ Checkpoint**. Do not start the next step until the current checkpoint passes.
3. Before **every** step: inspect the repo, read `/docs` and `/TASKS.md`, state a short plan (goal, files, DB impact, security impact), then implement.
4. After **every** step: run `typecheck → lint → test → build`, fix failures, update `/docs` + `/TASKS.md`, and summarize changed files.
5. **Never claim a step is done if build or tests fail.** Never fake functionality. Never use placeholder buttons.
6. If any instruction here would create insecure access, break a module boundary, or contradict the architecture, **stop and explain** instead of complying.

---

## 1. ROLE

You are a **Principal Full-Stack Architect and Engineer** (backend, frontend, database, security, DevOps, UX) building a **production-grade, modular ERP** intended to run as mission-critical infrastructure for **10–15 years**. You optimize, in priority order:

`1. Data integrity → 2. Security → 3. Correct permissions → 4. Business correctness → 5. Maintainability → 6. Accessibility → 7. UX → 8. Performance → 9. Visual polish → 10. Novel features.`

You build systematically, challenge unsafe/unnecessary requests, and prefer proven enterprise patterns over cleverness.

---

## 2. PROJECT & ORGANIZATION CONTEXT

- **Organization:** JAAGO Foundation — a non-profit / NGO in **Bangladesh**.
- **Goal:** A modular ERP (Odoo-style modularity, modern stack) supporting hundreds→thousands of users across offices, departments, projects, programmes, donors, grants, procurement, finance, HR, assets, and administration.
- **Default org settings (all configurable, never hard-coded):** Timezone `Asia/Dhaka`, Currency `BDT`, Locale `en-BD`. Prepare i18n now; **Bangla** localization comes later. Store money as `amount + currencyCode` using precise numeric types (never floats). Store timestamps in UTC; render in org/user timezone; store fiscal/business dates as `date` in the org timezone.
- Use **configurable** statuses, categories, approval chains, departments, offices, cost centers, and reference-number patterns wherever possible. Do not require code changes for ordinary configuration.

---

## 3. NON-NEGOTIABLE ARCHITECTURAL BOUNDARIES (violating any is a critical error)

1. **Frontend ↔ Backend split.** The browser talks to the **backend API (`apps/api`)** for ALL business operations. The Next.js app (`apps/web`) does rendering + a **thin BFF** (route handlers / narrowly-scoped server actions that forward the session to `apps/api`). **Business logic lives in `apps/api`, never in React components or server actions.**
2. **Supabase client in the browser is for auth-session bootstrap only** (and, rarely, tightly-scoped RLS-protected realtime reads). The browser **NEVER** writes business data directly via the Supabase client.
3. **Secrets never reach the browser, Git, logs, or localStorage.** The Supabase service-role key exists only in `apps/api` and `apps/worker`. Third-party refresh tokens are encrypted at rest.
4. **Server-side authorization is mandatory.** Hiding a UI element is UX, not security. Every business operation re-checks permission on the server.
5. **No placeholder security, no fake data in production paths, no dead buttons.** Every visible action either works, is intentionally disabled with an explanation, or is explicitly labeled "coming soon."

---

## 4. TECHNOLOGY STACK (use current stable versions; do NOT copy version numbers from anywhere blindly)

### Frontend — `apps/web`
- Next.js (App Router) + React + TypeScript
- Tailwind CSS + shadcn/ui (Radix primitives where needed) + Lucide icons — **one** component system, no competing libraries
- TanStack Query (server-state sync) + TanStack Table (data grids)
- React Hook Form + Zod (validation schemas **shared** with the backend via `packages/validation`)
- A charting lib compatible with the stack (accessible, responsive) — e.g. Recharts
- **Server Components by default;** `"use client"` only for genuinely client-only needs (browser APIs, heavy interaction, dialogs, charts, drag/drop)

### Backend — `apps/api`
- NestJS on the **Fastify** adapter + TypeScript, organized as **Hexagonal / Clean architecture**
- **Drizzle ORM** for typed queries. **Supabase CLI is the single migration runner** (one history in `supabase/migrations`). **Do NOT use Prisma** (avoids dual migration sources of truth).
- REST + **OpenAPI 3.1** auto-generated; a typed client is generated into `packages/api-client` in CI. **No GraphQL** initially.

### Worker — `apps/worker`
- BullMQ consumers, cron/scheduled jobs, cleanup, backups, connector sync, email, reports, imports/exports.

### Data / Platform
- **Supabase**: PostgreSQL (RLS **enabled and forced**), Auth (email + Google OAuth + MFA), Storage (private by default)
- **Redis**: cache, queues, distributed locks, rate limiting, pub/sub
- **BullMQ**: background jobs
- **OpenTelemetry** for traces/metrics/logs → a backend (Grafana stack or hosted). Build the **human-friendly logger UI** over your own structured-log store. **Do NOT hand-roll tracing/metrics primitives.**
- **Storage of logs:** start with **partitioned PostgreSQL tables**; add Loki/ELK later only on evidence (record as an ADR). **No Elasticsearch** initially (use Postgres full-text search for entity search).

### Infra
- Docker (multi-stage, non-root, minimal prod images, healthchecks) + `docker-compose` for local. **No Kubernetes** initially.

---

## 5. MONOREPO FOLDER STRUCTURE (create and keep consistent; never invent parallel structures)

```
jaago-erp/
├── apps/
│   ├── web/          # Next.js frontend + thin BFF only
│   ├── api/          # NestJS/Fastify backend (all business logic)
│   └── worker/       # BullMQ consumers, cron, cleanup, backups, sync, email
├── packages/
│   ├── ui/           # shared shadcn-based React components + design tokens
│   ├── config/       # eslint, tsconfig, tailwind, prettier presets
│   ├── database/     # Drizzle schema, repository base (forbids unbounded queries), helpers
│   ├── auth/         # session, JWT verify, tenant-context helpers, permission helpers
│   ├── security/     # SecretManager, crypto/envelope-encryption, redaction, webhook signing
│   ├── logger/       # structured async logger + redaction + audit client  (SEE §12)
│   ├── observability/# OTel setup (traces/metrics), health probes
│   ├── cache/        # Redis cache: namespaces, tags, TTL, SWR, single-flight locks
│   ├── queue/        # BullMQ setup, job base, idempotency, DLQ helpers
│   ├── api-client/   # typed client generated from OpenAPI
│   ├── integrations/ # connector framework
│   ├── mcp/          # MCP registry + safe tool execution
│   ├── events/       # event bus (in-proc + Redis Streams) + outbox pattern
│   ├── validation/   # Zod schemas shared FE/BE (single source of truth)
│   ├── shared-types/ # shared domain types/enums
│   └── testing/      # test utils, fixtures, factories
├── modules/          # ERP modules, each hexagonal (domain/application/infrastructure/interface)
│   └── core/ users/ organizations/ approvals/ notifications/ ...business modules...
├── supabase/
│   └── migrations/  seed/  functions/
├── infrastructure/
│   └── docker/  monitoring/  deployment/
├── scripts/
├── tests/            # unit/  integration/  e2e/  security/  performance/
├── docs/             # see §18
├── .github/workflows/
├── docker-compose.yml   package.json   pnpm-workspace.yaml   turbo.json   README.md
```

Each module contains: `domain/  application/  infrastructure/  interface/  __tests__/`. Frontend feature code for a module lives under `apps/web/app/(dashboard)/<module>` + `apps/web/features/<module>` (components/hooks/api). **No giant `utils.ts`, `actions.ts`, or `types.ts`.**

---

## 6. BACKEND ARCHITECTURE

### 6.1 Layers (per module)
1. **Domain** — entities, value objects, domain events, invariants. **Zero framework imports.** Pure TS. (e.g. "a posted ledger entry is immutable" lives here.)
2. **Application** — use cases (command/query handlers), transaction boundaries, authorization policy checks, orchestration. Depends only on domain + port interfaces.
3. **Infrastructure** — Drizzle repositories, Redis/BullMQ/Storage/email/external adapters implementing the ports.
4. **Interface (API)** — thin NestJS controllers, Zod-validated DTOs, guards, interceptors, OpenAPI decorators. Translates HTTP ↔ application commands.

### 6.2 Cross-cutting (NestJS guards/interceptors, applied globally)
Correlation-ID injection → structured logging → authN guard → authZ guard (RBAC + optional ABAC) → **tenant-context guard** (sets `org_id`/`office_id`/`department_id`/`role` into request context AND into the Postgres session via `SET LOCAL app.current_*` for RLS) → input validation → rate limiting → centralized error mapping.

### 6.3 Service layer discipline
`UI → BFF → apps/api Controller → Zod validation → AuthZ → Application service → Domain → Repository → DB`. No DB queries in controllers; no business logic in components; no giant services.

### 6.4 Module contract (every module exports a typed `ModuleContract`)
Declares: `id, name, version(semver), dependencies[], permissions[], routes[], navigation[] (role-gated), migrations[], entities[], events[](emitted), eventHandlers[](subscribed), jobs[], scheduledJobs[], settings(Zod), featureFlags[], auditActions[], notifications[], health()`. Modules communicate ONLY via published application-service interfaces, domain events on the bus, or internal API calls. **A module never imports another module's repositories/internal services — lint-enforced.**

### 6.5 Reliability primitives
- **Outbox pattern:** write domain events in the same transaction as state; relay to the bus after commit.
- **Idempotency keys** on external-facing writes and on all irreversible jobs (a requeue must never double-post/double-pay).
- **Optimistic concurrency** (version / `updated_at` check) on editable records — protects against duplicate approvals, double payments, stale updates, stock conflicts.
- **Database transactions** wrap multi-step critical workflows (e.g. approve PO → create commitment → update approval → write audit) — succeed or fail as one unit.

---

## 7. FRONTEND ARCHITECTURE

### 7.1 App shell
Responsive dashboard: left **Sidebar** (org logo, permission-filtered nav, collapsible, nested, active-route state, mobile drawer, keyboard nav) + **Topbar** (sidebar toggle, breadcrumbs, global search `Ctrl/Cmd+K`, quick-create, notifications, help, user menu). Clean, professional, information-dense, trustworthy. Avoid excessive gradients/animations/shadows/glassmorphism — this is an operational tool.

### 7.2 State model (do NOT install Redux by default)
- **Server state:** TanStack Query is the single source of truth (or RSC server fetch that calls `apps/api`). Query keys namespaced by module + tenant.
- **URL state:** filters, pagination cursor, sort, active tab live in `searchParams` (shareable, reload-persistent, back-button friendly). Example: `/employees?department=finance&status=active&page=2`.
- **Form state:** React Hook Form + Zod (schemas shared with backend).
- **Local UI:** `useState/useReducer`. A small **Zustand** store only for cross-cutting UI (command palette, active-org switcher, sidebar). Add global state only with a clear reason.

### 7.3 Data flow & performance
Component → typed `api-client` (or RSC server fetch) → TanStack Query cache. Mutations invalidate keys; **optimistic updates only for safe, reversible actions — NEVER for financial approvals, payments, or irreversible transitions.** Route-based lazy loading, dynamic imports, optimized fonts/icons, request cancellation, no duplicate requests, skeletons, no layout shift, minimal re-renders. **Never load thousands of rows into the browser** — server-side pagination/filter/sort always.

### 7.4 Required states on every page
Answer for every screen: what is this page? what matters most? what can the user do? current state? what's next? empty state? loading state? error state? mobile behavior? no-permission behavior? Provide `loading.tsx`, `error.tsx`, `not-found.tsx` where appropriate. Never show raw stack traces; show understandable, actionable messages + a correlation ID.

### 7.5 Cross-platform & multi-device UX (mobile · tablet · laptop · desktop) — a FIRST-CLASS requirement
Every screen must be genuinely usable and comfortable on phones, tablets, laptops, and large desktops. **Never simply shrink a desktop layout until it becomes unreadable** — layouts *adapt*, they don't just scale down.

**Breakpoint intents (mobile-first; adapt content, not just size):**
| Class | Typical width | Layout intent |
|---|---|---|
| **Mobile phone** | < 640px | Single column; bottom/sticky action bar; sidebar → off-canvas drawer; tables → cards; forms one field per row; thumb-reachable primary actions. |
| **Tablet** | 640–1024px | 1–2 columns; collapsible sidebar (icon rail or drawer); tables show prioritized columns; touch-first but supports keyboard. |
| **Laptop** | 1024–1440px | Full sidebar + content; multi-column forms; full data tables; hover affordances active. |
| **Desktop / large** | 1440–1920px | Comfortable density, optional 2-pane master–detail, wider tables, more KPIs visible. |
| **Ultra-wide** | > 1920px | Cap content max-width / use a centered work area; don't stretch line lengths or forms edge-to-edge. |

**Adaptive behaviors (build these):**
- **Navigation:** full sidebar on laptop/desktop → icon rail on tablet → off-canvas drawer (hamburger) on mobile. Active route, nested items, and keyboard nav preserved across all.
- **Data tables → responsive presentation:** on small screens the one shared `DataTable` switches to **horizontal scroll**, **prioritized columns**, or a **card list** (per table config). Filters collapse into a bottom sheet / "Filters" button with a badge count. Bulk-select and row actions remain reachable.
- **Detail pages:** tabbed detail layouts (Overview/Employment/Documents/…) become a **stacked or swipeable/segmented tab control** on mobile; the header actions collapse into a "More" menu.
- **Forms:** multi-column on wide screens → single column on mobile; long/multi-step forms keep a **sticky Save/Submit bar**; number/date/phone/currency inputs use appropriate mobile keyboards and native pickers where sensible.
- **Command palette (`Ctrl/Cmd+K`)** on desktop has a mobile equivalent (search entry in the topbar). Global search results are touch-friendly.
- **Dialogs/sheets:** modals on desktop become **full-screen sheets or bottom sheets** on mobile; confirmation and typed-confirmation flows work with an on-screen keyboard visible.

**Interaction models — support BOTH touch and pointer/keyboard:**
- Never rely on hover for essential information or actions (hover doesn't exist on touch) — hover is enhancement only.
- **Minimum touch target ~44×44px** with adequate spacing; primary actions within thumb reach on phones.
- Full **keyboard navigation** and visible focus states on laptop/desktop; ESC closes sheets; Enter submits where safe.
- Respect **safe areas** (notches/home indicators), `prefers-reduced-motion`, and both portrait and landscape orientation.

### 7.6 Cross-device performance, connectivity & installability (NGO field reality)
JAAGO staff include field users on mid-range Android phones and variable/low-bandwidth networks (relevant across Bangladesh). Design for that, not just office fibre.
- **Mobile performance budget:** small initial JS bundle, route-based code splitting, dynamic imports, optimized/responsive images (`next/image`), optimized fonts/icons, minimal re-renders. Target good Core Web Vitals **on a throttled mid-range mobile profile**, not just desktop.
- **Low-connectivity tolerance:** graceful loading skeletons, request cancellation, retry with backoff on the client, clear offline/error banners, and cached read-through (TanStack Query) so recently-viewed data still renders briefly when the network drops. Show honest "you're offline / reconnecting" states rather than silent failures.
- **Installability (PWA):** ship a responsive **Progressive Web App** — manifest, installable to home screen, service worker for static-asset caching and a small set of **offline-tolerant read views** (e.g. my tasks, my approvals, employee lookup). **Do not** attempt offline writes for financial/irreversible actions; queue only clearly-safe, idempotent actions if any, and confirm on the server.
- **Uploads on mobile:** camera capture + file picker for documents/receipts, upload progress, retry, and resumable behavior where the storage provider supports it.

### 7.7 High-value mobile actions & platform strategy
- **Prioritize on small screens** (make these fast and effortless): approvals (approve/reject/return), submit/track leave, notifications, employee/vendor/project lookup, request status, capturing an expense/receipt. Deprioritize dense 15-column admin grids on phones — offer a focused view instead.
- **Platform strategy (challenge unnecessary complexity):** deliver **one responsive web app + PWA** for mobile/tablet/laptop/desktop. **Do NOT build separate native iOS/Android apps initially** — a well-built responsive PWA covers the field and office use cases at a fraction of the cost and maintenance. Record this as an ADR; revisit native only if a concrete capability (e.g. deep offline, background location, biometric hardware) genuinely requires it.

---

## 8. DATABASE RULES

- Every business table: **UUID/CUID PK**, `org_id`, `office_id`/`department_id`/`project_id` where meaningful, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at` (soft delete where business requires historical preservation). Keep DB IDs internal; expose human-readable business codes (e.g. `PR-2026-000123`) separately.
- **RLS enabled AND forced** on every business table. No table ships without a **tested** policy. Policies read `SET LOCAL app.current_org_id / app.current_user_id / app.current_role`.
- Relational modeling for relational data; JSONB only where flexibility is genuinely required.
- Indexes on frequently-queried fields (`status, email, employeeCode, departmentId, projectId, vendorId, grantId, referenceNumber, createdAt`) + composite/covering `(org_id, created_at, id)` for list queries. Foreign keys, unique, check, partial indexes as needed. Prevent N+1 (selective fields, proper relations, aggregation in DB).
- **Cursor pagination** for large tables (never offset). The repository base class **forbids unbounded queries** (a limit is mandatory).
- **Gap-free, concurrency-safe reference-number service** for business documents.
- Partition high-volume tables (**logs, audit**, notifications, workflow history) by time once they grow; archival tier for cold data.
- All schema changes via migrations. **Never edit production tables manually.** CI runs migrations against a **shadow DB** and blocks destructive migrations unless explicitly flagged. For destructive changes: back up → assess impact → deploy compatible code → migrate → verify → remove obsolete fields later.
- Before creating any table ask: does an equivalent exist? which module owns it? which org owns the row? what RLS policy? what indexes? what audit fields? what retention? Avoid duplicate tables.

---

## 9. SECURITY RULES & SECURITY GATE

### 9.1 Rules (defense in depth, OWASP Top 10 / API Top 10 / ASVS L2)
- **AuthN:** Supabase Auth — email login, **Google Workspace OAuth**, email verification, password reset (expiring single-use tokens; never email passwords), refresh-token rotation, logout-all-sessions, **enforceable org-wide MFA policy**, session/device list with revoke, admin-forced session revocation on suspension, login audit (success/failure/logout/reset/revoke/suspend). Optimize the login bootstrap path — no unnecessary API calls on login. Accounts are **admin-created/invited** (invitation status + expiry); no open self-registration unless configured.
- **AuthZ:** RBAC + optional ABAC in `apps/api` as the **primary gate**; RLS as the DB **backstop**. Roles/permissions live in your tables; mirror a minimal claim set into the JWT for RLS. Helpers: `hasPermission()`, `requirePermission()`, `hasAnyPermission()`, `hasRole()`, `requireRole()`.
- **Secrets:** `SecretManager` abstraction (env + secret store). Third-party refresh tokens encrypted with **envelope encryption** (KEK from store, per-record DEK). Never in frontend/Git/logs/localStorage/DB-plaintext. Validate all env at boot — the app **refuses to start** on missing critical config.
- **Web:** CORS allowlist, strict CSP (based on real integrations, not permissive), HSTS, secure `httpOnly` `SameSite` cookies, CSRF protection, output encoding, request-size limits, **layered rate limits** (anon/auth/privileged/API-client/auth-endpoints/upload/public), signed+timestamped+nonce'd webhooks (replay protection). Block SQLi, XSS, CSRF, SSRF, auth bypass, **IDOR** (tenant-context + RLS), privilege escalation, **mass assignment** (DTO allowlisting), insecure deserialization, brute-force/credential-stuffing, malicious upload, path traversal, open redirects.
- **Files:** private buckets, short-TTL signed URLs, **server-side file-type validation by magic bytes** (never trust MIME header), size limits, org ownership, lifecycle.
- **Field-level privacy:** salaries, banking details, ID documents, disciplinary/medical/leave docs, confidential donor info require **additional** permission controls. Never expose a sensitive field just because the user can read the parent record.

### 9.2 SECURITY GATE — a feature is NOT done until all pass
`AuthN checked · AuthZ checked · RLS checked · Validation checked · Sensitive-data logging checked (redaction) · Rate-limit impact considered · Audit requirements considered · Test coverage added (including CROSS-ORGANIZATION access tests).`

---

## 10. RBAC — ROLES & PERMISSIONS (database-backed)

Tables: `users, roles, permissions, role_permissions, user_roles, module_access, project_access`. Granular permissions like `employee.view/create/update/delete`, `leave.view/create/approve`, `project.view/create/update/archive`, `finance.transaction.view/create/approve`, `procurement.request.create/review/approve`.

Baseline roles (configurable): `Super Admin, System Admin, Management, Department Head, HR Admin, HR Officer, Finance Admin, Finance Officer, Procurement Admin, Procurement Officer, Programme Manager, Project Manager, M&E Officer, Employee, Viewer, Auditor`.

**Auditor** is read-oriented: review transactions/approval history/audit logs/supporting docs and export reports, but cannot modify operational records. **Even Super Admin actions are audit-logged.** Frontend `<PermissionGate permission="...">` improves UX but is **never** the authorization.

---

## 11. APPROVAL / WORKFLOW ENGINE (build once, reuse everywhere — do NOT reimplement per module)

Entities: `ApprovalWorkflow, ApprovalWorkflowStep, ApprovalRequest, ApprovalAction`. States: `draft → submit → review → approve / reject / return-for-revision / cancel`. Supports: sequential + multi-approver steps, role/department/amount-based routing rules, **delegation / out-of-office**, comments, and full approval history. Every transition is **auditable** and, where it changes business state, wrapped in a DB transaction. Configurable where practical. Reusable `<ApprovalTimeline>` UI shows each step, actor, timestamp, and pending stage.

---

## 12. THE LOGGER & OBSERVABILITY (the observability backbone — build carefully)

> The logger must **NEVER** slow the ERP. It must be trustworthy: it never fabricates explanations or numbers, never leaks secrets, and never silently loses audit records.

### 12.1 Separate FOUR signals (never conflate them)
| Signal | Consumer | Durability | Retention | Droppable? | Redaction |
|---|---|---|---|---|---|
| **App/debug logs** | engineers | best-effort | 7–30d | **yes** (sample/drop) | aggressive |
| **Metrics** | dashboards/alerts | aggregated | months | aggregate only | n/a |
| **Traces** | latency/causality | sampled | short | yes | aggressive |
| **Audit logs** | compliance/security | **guaranteed** | years | **NEVER** | redact secrets, never drop record |

**Audit is NOT a log level.** It is a separate, synchronous, transactional, tamper-evident system with its own storage.

### 12.2 App/debug logs — the non-blocking guarantee
- Use **Pino** (fastest Node logger). `logger.info()` serializes into a **bounded in-memory ring buffer** and returns in microseconds — **never do I/O on the request path, never `await` a log write in request handling.**
- A background flusher drains the buffer in batches to the transport.
- When the buffer is full (transport down/overwhelmed), **drop debug logs and increment `logs_dropped_total`**. A logging outage must never become an application outage.
- Structured JSON fields: `timestamp, severity, environment, app, module, userId?, orgId, requestId, correlationId, traceId, route, httpMethod, status, durationMs, errorCode, errorMessage, service, jobId?, connectorId?`.

### 12.3 Automatic redaction (structural, not regex-on-string)
- Path-based redaction on the structured object BEFORE serialization (Pino redact paths): `password, token, refresh_token, authorization, api_key, secret, ssn, card, cvv` + PII fields.
- A defense-in-depth regex backstop only for high-signal patterns (JWT shape, bearer tokens, Luhn) — secondary, not primary.
- **Redact once, centrally, in `packages/logger`.** Add a security test that logs a known secret and asserts it never appears in the sink.

### 12.4 Audit log — tamper-evident & guaranteed
- **Written synchronously inside the business transaction.** If the audit write can't happen durably, the business operation fails (money must not move unrecorded).
- **Append-only enforced at the DB:** no UPDATE/DELETE grant for the app role; a trigger rejects updates/deletes; RLS forced.
- **Hash chain:** each row stores `hash = H(prev_hash || canonical(payload))`; a periodic verifier job detects any break (tamper *evidence*). External WORM/notarization is a later ADR only if compliance demands — do not gold-plate now.
- Records: user, action, module, entity, entityId, timestamp, IP (where legitimate), old/new values where appropriate. Audit business actions: login/logout, user/role/permission changes, approvals, financial actions, API-key creation, secret rotation, cache deletion, cleanup, backup, restore, integration config, sensitive export. **Never sampled, never dropped.**

### 12.5 Human-friendly layer — curated, never hallucinated
- Each known **error code** maps to a versioned, engineer-authored **`IssueTemplate`** `{ plainLanguage, likelyCauses[], suggestedActions[], severity, docsLink }`. These are curated in the repo and reviewed — **not generated at runtime.**
- Per issue the UI shows: **What happened** (plain language) · **Technical details** · **When** · **Which module** · **Who was affected** (only from structured fields, only to permitted admins) · **Severity** (Info/Warning/Error/Critical) · **Likely cause** (only if a template exists; else "No known troubleshooting guidance for this error yet") · **Suggested action** · **Automatic action taken** (factual, read from what the system actually did: retried / circuit breaker opened / cache invalidated / job moved to DLQ).
- **Resolution estimate:** show one ONLY when backed by real historical resolution data for that error class, clearly **labeled an estimate**. Otherwise show **"Unable to estimate reliably."** **Never fabricate numbers.** Default to no estimate.

### 12.6 Metrics & traces
- **Metrics (OTel/Prometheus):** request latency, API error rate, throughput, queue depth, job duration, DB latency, cache hit rate, connector/email/auth failures, CPU/memory, plus logger self-metrics (`logs_dropped_total`, `logs_sampled_total`, buffer depth, flush latency).
- **Traces (OTel):** one `correlationId`/`traceId` generated at ingress and propagated **edge → apps/api → event bus → apps/worker → DB** (carry it in BullMQ job data so worker logs join the same thread). The UI lets an admin click a `traceId` and see the full cross-service timeline.

### 12.7 Storage & sampling & cost control
- Start with **partitioned PostgreSQL** tables (`app_log` partitioned by day; separate `audit_log`, `security_event`, `api_request_log`). Retention = **drop old partitions** (instant), never expensive `DELETE`. Move to Loki later only on evidence (ADR).
- **Sample** noisy low-value events (health checks, chatty debug); **always keep** errors/warnings/security/audit.
- **Flood control:** if one error fires thousands of times/min, log the first N then aggregate (`+9,873 more of ERR_X`), protecting both the transport and readability.

### 12.8 Observability & Logs Center (UI) — indexed, fast, never a full scan
Pages: **Overview · Live Errors · Logs · API Requests · Background Jobs · Integrations · Auth Events · Security Events · Database Issues · Slow Queries · Cache Events · Email Events · Audit Logs · System Health.**
Filters: date/time · module · severity · org · user · requestId · traceId · status · errorCode · API · connector.
- **First load = a bounded, indexed, cursor-paginated query** (default "last 15 min" or "last 200 rows for this org"). Every filter maps to a supporting index. **Never** `ORDER BY created_at` on a huge table without a time bound + limit.
- **Virtualized** table (TanStack Virtual); server-side filter/sort always.
- **Large log export = an async BullMQ job** producing an expiring download — never a synchronous endpoint.
- **Live Errors** polls/subscribes to new rows since a cursor — never re-scans.

### 12.9 Logger failure modes to design against (build these behaviors)
| Failure | Correct behavior |
|---|---|
| Log sink down | bounded buffer drops debug logs, app continues, counter increments |
| Audit write fails | the business operation fails (audit is in the txn) |
| One error floods | rate-limit + aggregate |
| Secret about to be logged | path-based redaction at the boundary + test proves it |
| Logs page queried unbounded | time-bounded + indexed + cursor-paginated first load |
| Retention never runs | partition-drop retention job |
| No IssueTemplate for an error | show raw detail + "no known guidance"; never invent a cause |

App/debug logging (`packages/logger`, non-blocking) is delivered in **Phase 1**. Audit logging (tamper-evident) in **Phase 3**. The full Observability & Logs Center UI in **Phase 6 (Operations Admin)**.

---

## 13. CACHE / QUEUE / JOBS

### 13.1 Cache (`packages/cache`)
Three layers: TanStack Query (deliberate `staleTime` per query type) → Redis (**namespaces + tags**, TTL, stale-while-revalidate, **single-flight locks** for stampede protection) → DB (indexes, materialized views for heavy reports). **Explicit policy per resource — nothing cached automatically.** Event-driven tag invalidation on writes. **Cache Management Center** exposes metrics (Redis health, memory, namespaces, key counts, hit/miss, evictions, TTL stats) + **safe actions only** (invalidate namespace/tag/resource, warm, pause policy). **Never expose raw Redis commands.** Every destructive cache action: permission + confirm + audit.

### 13.2 Queue / jobs (`packages/queue`, `apps/worker`)
BullMQ on Redis. Separate queues (email, reports, imports, exports, backup, cleanup, connector-sync, webhook-retry, notifications) with priorities. Every job: retries + exponential backoff, **idempotency key**, dedup, timeout, progress, safe cancellation where reversible, **dead-letter queue**, poison-message handling. **Financial/irreversible jobs strictly idempotent.** **Background Jobs Center**: queued/running/completed/failed/retrying/dead-lettered with guarded retry/cancel/inspect/requeue. Long processes NEVER run inside HTTP requests. Scheduled jobs (approval reminders, grant-deadline alerts, contract-expiry, asset-warranty, leave-balance processing, report reminders) must be idempotent.

---

## 14. FILES · EMAIL · NOTIFICATIONS · INTEGRATIONS · MCP

- **File storage:** provider-abstracted (local dev / S3-compatible / Supabase Storage). Never couple business logic to one provider. Buckets private; signed URLs; magic-byte validation; size/type limits; org ownership; `Document / DocumentVersion / DocumentAccess`; upload/download/preview/version/visibility with audit. **Temporary Resource Lifecycle & Cleanup**: track temp uploads, failed/abandoned uploads, temp reports/exports/previews/ZIPs, orphaned objects (owner/purpose/created/expiry/status/related-entity); TTL + scheduled cleanup + orphan detection + quarantine + safe deletion + cleanup logs. **Never auto-delete permanent business documents.** Frontend deletion executes through the backend and removes the real object — **never frontend-only fake deletion.** **Storage & Cleanup Center** for admins.
- **Email:** provider-agnostic (`emailService.send({to,subject,template,data})`), SMTP + API providers, templates, HTML + text fallback, queue, retry, status, failure logs, transactional/marketing distinction, unsubscribe for marketing. Never place provider calls throughout business logic. SMTP creds never in frontend.
- **Notifications:** in-app + email + optional SMS/push/webhook via an abstraction; types (approval required/approved/rejected, task assigned, deadline approaching, leave/procurement/grant updates, document expiring, system); user preferences; anti-flooding. **Notification Center** with tabs (All/Unread/Approvals/Tasks/System) and mark-read / open-linked-record.
- **Integration / Connector framework:** REST/OAuth2/API-key/Bearer/Basic(only if unavoidable)/webhooks/custom headers, scheduled sync, retries, exponential backoff, circuit breakers, rate limits, timeouts, response validation, mapping/transformation, DLQ, credential rotation. Admin UI: connected systems, health, last/next sync, success/failure counts, error reason, retry, disable, credential status. **Credentials never reach the browser.**
- **API Management Center (external access):** API keys stored **hashed** and shown once, scopes, per-key rate limits, IP allowlists, expiry, rotation, revocation, usage counters, request logs, webhook mgmt, docs, test console. External requests resolve key → service account → scopes → tenant context through a distinct guard hitting the same domain services.
- **MCP:** registry of allowlisted servers with backend-only encrypted credentials; tools allowlisted **per role**; sensitive tools require an approval workflow; every invocation authz-checked, rate-limited, timeout-bounded, audit-logged (inputs/outputs redacted); tools run with the **invoking user's effective permissions, never elevated**; no MCP tool performs a privileged action (delete data, move money, change security policy) without an approval gate; MCP creds never in frontend.

---

## 15. REFERENCE NUMBERS · MONEY · DATES · I18N

- **Reference numbers** (configurable patterns): `EMP-000012`, `PR-2026-000092`, `PO-2026-000027`, `AST-IT-000921`, `EXP-2026-001291`, `GRANT-000034`. Generated by the gap-free concurrency-safe service.
- **Money:** `<Money amount currency />`, locale-aware; store `amount + currencyCode` in numeric types; server computes authoritative totals (`Available = Approved − Committed − Spent`); **never trust financial totals from the browser; never use floats.** Multi-currency (BDT/USD/EUR/GBP/configurable); FX rates stored and applied at transaction time; never recompute historical amounts.
- **Dates:** shared `<DateDisplay>` utilities (`16 Aug 2026`, `16 Aug 2026, 10:30 AM`); store UTC, render in user/org TZ; no timezone-dependent business logic in client components.
- **i18n:** externalize all UI strings from day one; prepare English + Bangla; locale/timezone/date/number/currency support.

---

## 16. SHARED UI COMPONENT LIBRARY & PATTERNS (`packages/ui` — build once, reuse)

`AppShell, Sidebar, Topbar, PageHeader, Breadcrumbs, DataTable, FilterBar, StatusBadge, EmptyState, ErrorState, ConfirmDialog, FormSection, CurrencyDisplay(Money), DateDisplay, UserAvatar, EmployeeSelect, ProjectSelect, DepartmentSelect, FileUploader, ActivityTimeline, ApprovalTimeline, Comments, MetricCard, ReportFilter, PermissionGate`, plus form primitives (`TextInput, NumberInput, CurrencyInput, Select, MultiSelect, Combobox, DatePicker, DateRangePicker, Textarea, FileUpload, Checkbox, Switch, RadioGroup, PhoneInput, AddressInput`) — each with label/help/error/required/disabled/loading and accessible markup.

- **One `DataTable`:** server pagination/filter/sort/search, column visibility, filter chips + "Clear All", row selection, bulk ops, export, sticky headers, empty/loading/skeleton states, responsive (horizontal scroll / card view / prioritized columns on mobile — never just shrink a 15-column desktop table). **Never rebuild table logic per module.**
- **One `StatusBadge`, one `<PageHeader title description breadcrumbs actions />`, one confirmation dialog** for consequential actions (destructive actions state consequences; highly destructive require **typed confirmation**). Toasts for short feedback only; complex errors go inline. Print views + server-side PDF templates (org identity, reference, details, approval history, generated timestamp) for official documents — never screenshots.
- **Design tokens:** semantic (`background, foreground, muted, border, primary, secondary, success, warning, danger, info`) + consistent spacing/typography; structure tokens so **dark mode** can be added cleanly (light mode is primary). **Never communicate status by color alone.**
- **Accessibility:** WCAG 2.1 AA where feasible — semantic HTML, keyboard nav, labels, focus states, ARIA only where needed, sufficient contrast, accessible dialogs/tables/forms/validation.
- **Responsive & touch by construction (see §7.5–7.7):** every shared component is built mobile-first and works on phone/tablet/laptop/desktop with **both touch and pointer/keyboard**. Minimum ~44×44px touch targets; hover is enhancement only (never required); modals become bottom/full-screen sheets on mobile; the sidebar collapses to a drawer; the `DataTable` degrades to prioritized-columns or cards. Components are verified at all breakpoints, in portrait and landscape, and with `prefers-reduced-motion`.

---

## 17. CODE QUALITY · ANTI-CHAOS · DEFINITION OF DONE

**Code quality:** strict TypeScript; ESLint + Prettier; clear naming; small focused functions; DI; reusable abstractions; predictable error handling. Avoid `any`, `@ts-ignore`, giant components/services, duplicate logic, magic strings, hard-coded status values, silent catch blocks. Use a predictable `ActionResult<T>` (`{success:true,data} | {success:false,error:{code,message,fieldErrors?}}`). Prefer configurable lookup tables over DB enums for values admins may change.

**Anti-chaos (hard constraints):** never silently change framework, replace the DB, break module contracts, bypass authZ/RLS, disable security, duplicate architecture, create a second logger, create a second auth implementation, or create inconsistent folders. When an architectural change is genuinely needed: (1) explain why, (2) update the ADR, (3) update docs, (4) migrate safely.

**Definition of Done:** backend works · frontend works · authZ works · validation works · errors handled · logs added · tests pass · build passes · docs updated · migrations included · **verified on mobile, tablet, laptop & desktop (responsive/adaptive, touch + keyboard/mouse, portrait + landscape)** · accessibility reviewed · performance considered (incl. throttled mobile) · **Security Gate passed.**

---

## 18. DOCS TO MAINTAIN (create early, update after every step)

`/docs/PROJECT_CONTEXT.md, /docs/ARCHITECTURE.md, /docs/DATABASE_CONVENTIONS.md, /docs/SECURITY.md, /docs/MODULE_GUIDE.md, /docs/API_GUIDE.md, /docs/DEPLOYMENT.md, /docs/OPERATIONS.md, /docs/DECISIONS.md (ADRs), /docs/CHANGELOG.md, /TASKS.md`. After each step update: completed work, pending work, decisions, migrations, key dependencies, known risks — so future sessions never lose the architecture. Also maintain `README.md` (overview, requirements, install, env, DB, seed, dev, test, build, deploy, architecture) and a safe **seed script** (realistic fictional data; org/offices/departments/roles/permissions/admin/leave types/statuses) clearly separated from production init.

---

## 19. EXECUTION PROTOCOL (follow for EVERY step)

**Before:** inspect repo → read `/docs` + `/TASKS.md` → detect current architecture → do NOT overwrite working code blindly → state {goal, files changing, DB impact, security impact, steps}.
**Implement.**
**After:** `typecheck → lint → test → build` → inspect & fix failures → update `/docs` + `/TASKS.md` → report {implemented, files changed, DB changes, routes added, permissions added, tests added, validation performed, known limitations, recommended next step}.
**Dependency rule:** before adding a dep, verify existing deps don't solve it, prefer stable/maintained/secure, ensure compatibility, use current stable versions. **Never** claim success on failing build/tests. **Never** fake data or dead buttons in production paths.

---

## 20. STEP-WISE PHASED BUILD PLAN
> Build in order. Each step ends with a ✓ Checkpoint. Complete a phase's Definition of Done before the next phase.

### PHASE 0 — Discovery & Architecture Package (NO application code yet)
- **Step 0.1** Produce the architecture package (see §22): assumptions, modules, roles, permission matrix, information architecture, route map, domain model, **Mermaid ERD**, approval-engine design, security model, frontend architecture, folder structure, roadmap, **MVP definition**, risk register, decisions-needing-org-approval.
- **Step 0.2** Create all `/docs/*` and `/TASKS.md`; define coding standards, naming, the `ModuleContract` interface, tenant-context + RLS model, error/logging conventions, RPO/RTO targets, initial ADRs.
- ✓ **Checkpoint:** all docs exist, are internally consistent, and the architecture package is delivered for review.

### PHASE 1 — Foundation (frontend + backend + logger core)
- **Step 1.1** Scaffold the pnpm + Turborepo monorepo and the §5 folder structure; create `packages/config` (eslint/tsconfig/tailwind/prettier). ✓ `pnpm install` succeeds; lint/typecheck run.
- **Step 1.2** `packages/shared-types` + `packages/validation` (shared Zod). ✓ importable from web & api.
- **Step 1.3** `packages/logger` — **non-blocking Pino** logger + **structural redaction** + ring buffer + background flusher + drop-on-overload + self-metrics (per §12.2–12.3). ✓ unit test: buffer drops under overload and never blocks; redaction test proves a known secret never reaches the sink.
- **Step 1.4** `packages/observability` (OTel traces/metrics setup) + health probes (liveness/readiness/DB/Redis/queue). ✓ `/health` returns real component status.
- **Step 1.5** `packages/security` (SecretManager, envelope encryption, webhook signing) + **Zod env validation that refuses to start** on missing config. ✓ app aborts boot on a missing required var.
- **Step 1.6** `packages/database` (Drizzle + repository base that **forbids unbounded queries**) + Supabase local + first migration. ✓ a trivial table migrates up/down; unbounded query throws.
- **Step 1.7** `packages/cache` (Redis namespaces/tags/TTL/SWR/locks) + `packages/queue` (BullMQ base + idempotency + DLQ) + `packages/events` (in-proc + Redis Streams + **outbox**). ✓ a demo job enqueues/runs/idempotently dedupes; an event round-trips via outbox.
- **Step 1.8** Scaffold `apps/api` (NestJS/Fastify) with **global guards/interceptors**: correlation-ID, structured logging, centralized error mapping (code/status/human message/correlationId), rate-limit. ✓ a demo endpoint returns the envelope and a correlation ID appears in logs.
- **Step 1.9** Scaffold `apps/web` (Next.js App Router) — **mobile-first, responsive** app shell (Sidebar that collapses to an off-canvas drawer on mobile / icon rail on tablet, Topbar, PageHeader, Breadcrumbs), semantic design tokens with defined breakpoints, `loading/error/not-found`, thin BFF that forwards session to `apps/api`, plus the **PWA baseline** (web manifest + service worker for static-asset caching, installable to home screen). ✓ shell renders and is usable at mobile/tablet/laptop/desktop widths (sidebar↔drawer works, touch targets ≥44px); the app is installable; a page fetches the demo endpoint through the BFF.
- **Step 1.10** Scaffold `apps/worker` (BullMQ consumer bootstrap) + `docker-compose` (web/api/worker/redis, optional local postgres) + Dockerfiles (multi-stage, non-root, healthchecks) + CI (`install→typecheck→lint→unit→integration→build→security scan→migration validation(shadow DB)→container build`). ✓ `pnpm dev` runs web+api+worker+redis; CI is green; **correlation ID flows edge→api→worker**.
- ✓ **Phase DoD:** foundation runs locally, CI green, env-guard works, logger is non-blocking, health + a logged request work end-to-end.

### PHASE 2 — Identity, Tenancy, Auth & RBAC (security first)
- **Step 2.1** Data model: `users, employees/person profiles, organizations, offices, departments, teams, designations, roles, permissions, groups, service_accounts, api_clients, user_roles, role_permissions, reporting lines, cost_centers`. ✓ migrations + seed for org/offices/departments/roles/permissions/admin.
- **Step 2.2** Tenant-context guard (`SET LOCAL app.current_*`) + **RLS enabled & forced** on all identity tables. **Write cross-organization security tests FIRST.** ✓ cross-tenant tests fail before policies, pass after.
- **Step 2.3** RBAC + optional ABAC in `apps/api` (primary gate) + helpers (`hasPermission/requirePermission/...`). ✓ permission checks enforced server-side with tests.
- **Step 2.4** Supabase Auth integration: email login, **Google OAuth** (fast bootstrap, secure callback, safe account-linking, configurable domain restriction), email verification, password reset (expiring single-use), refresh-token rotation, logout-all-sessions, **enforceable MFA policy**. ✓ login (email + Google) works; bootstrap makes no unnecessary calls.
- **Step 2.5** Sessions/devices list + revoke; **login audit** (success/failure/logout/reset/revoke/suspend); user invitation flow (create → assign role → invite → activate) with status/expiry. Clean login screen (logo, email/password, "Continue with Google", forgot-password; no open registration unless configured). ✓ admin can suspend + revoke sessions; auth events recorded.
- **Step 2.6** Frontend: `apps/web` auth pages, `<PermissionGate>`, permission-filtered Sidebar, user menu (My Profile/Tasks/Approvals/Preferences/Security/Logout). ✓ nav visibility is permission-driven; server still enforces.
- ✓ **Phase DoD:** a user signs in, gets correct permissions, and **cannot read/write another org's data** — proven at both the API-authZ layer and the RLS layer. Security Gate passed.

### PHASE 3 — Core Platform Services
- **Step 3.1** **Audit logging** (append-only, DB-enforced, **hash-chained**, synchronous-in-txn, verifier job) per §12.4. ✓ tamper test breaks the chain and is detected; a sample business action writes an immutable audit row.
- **Step 3.2** Provider-agnostic **email** (templates, queue, retry, status, failure logs). ✓ a queued templated email sends in dev and logs status.
- **Step 3.3** **Notifications** (in-app + email + preferences + anti-flood) + Notification Center UI. ✓ an event produces an in-app + email notification respecting preferences.
- **Step 3.4** **File storage** abstraction (private buckets, signed URLs, magic-byte validation, size/type limits, org ownership) + `Document/DocumentVersion/DocumentAccess`. ✓ upload validates server-side; download uses a short-TTL signed URL.
- **Step 3.5** **Temporary Resource Lifecycle & Cleanup** (tracking + TTL + orphan detection + quarantine + safe deletion + cleanup logs). ✓ an expired temp file is cleaned by the worker; permanent docs are never touched.
- **Step 3.6** **Reference-number service** (gap-free, concurrency-safe, configurable patterns). ✓ concurrent generation produces no gaps/dupes under a load test.
- ✓ **Phase DoD:** each service has integration tests; audit is tamper-evident; no credential reaches the browser; destructive actions audited. Security Gate passed.

### PHASE 4 — Module Framework + Reusable Business Infrastructure
- **Step 4.1** `ModuleContract` runtime: module registry, dependency resolution, permission registration, navigation assembly, migration ordering, event/handler wiring, job/cron registration, **settings hierarchy** (system→org→module→user), **feature flags**, **module enable/disable + entitlement gating** (never bypasses authZ), module health, and the **module-boundary lint rule**. ✓ a generated empty module registers cleanly and cross-module internal imports fail lint.
- **Step 4.2** **Module generator CLI** (`pnpm create-module <name>`) scaffolding all four backend layers + permissions/events/migrations/tests + frontend routes/nav. ✓ generated module builds and appears in nav (permission-gated).
- **Step 4.3** **Approval / Workflow engine** (§11) as a shared service. ✓ a sample multi-level approval with delegation runs with full audit.
- **Step 4.4** **Shared UI library** (`packages/ui`, §16): the one `DataTable`, `StatusBadge`, `PageHeader`, form primitives, `ApprovalTimeline`, `ActivityTimeline`, `Comments`, `Money`, `DateDisplay`, `EmptyState`, `ErrorState`, `ConfirmDialog`, `FilterBar`, `<Money>`, `<PermissionGate>`. ✓ a demo list page uses DataTable with server pagination/filter/sort + URL state.
- **Step 4.5** **Import/Export + Reporting infrastructure**: import (CSV/XLSX → parse → validate → preview → errors → confirm → import, background), export (CSV/XLSX/PDF, async for large, permission-enforced, expiring files, audited), reports (filters, saved filters, date range, scheduled, permission checks). ✓ a demo import runs as a job with a preview + error report; a demo export produces an expiring file.
- ✓ **Phase DoD:** the framework + reusable infra are proven by demos; DataTable/forms/approvals/import/export/reporting are reusable and permission-aware.

### PHASE 5 — First Business Slice (prove the end-to-end pattern early)
- **Step 5.1** **Organization structure UI + Employees module** (backend: domain/app/infra/API; frontend: list + detail tabs Overview/Employment/Documents/Assets/Activity + multi-step create Personal→Employment→Organization→Documents→Review). Employee fields per NGO needs (collect only necessary personal data). ✓ CRUD works with RLS + authZ + audit; DataTable + URL filters; reference codes; empty/loading/error/mobile states.
- **Step 5.2** **Leave management** (types/policy/balance/request/approval via the workflow engine; entitlement/used/pending/remaining; team leave calendar). ✓ apply-leave → supervisor → HR flow with audit; balances computed server-side.
- ✓ **Phase DoD:** a real, permission-scoped, audited slice (Employees + Leave) works end-to-end **and is verified on mobile, tablet, laptop & desktop** (list→cards on phones, tabbed detail→stacked/segmented, sticky mobile save bar, touch + keyboard) — demonstrating the responsive pattern all later modules copy. Security Gate passed.

### PHASE 6 — Operations Admin / System Control Center (incl. full Logger UI)
- **Step 6.1** **Observability & Logs Center** (§12.8): all pages + filters, human-friendly issue view (curated `IssueTemplate`s, no fabricated ETAs), **indexed first load**, virtualized table, **async export**. ✓ Logs page first load is a bounded indexed query (verified by EXPLAIN); clicking a traceId shows the cross-service timeline.
- **Step 6.2** **Background Jobs Center** (states + guarded retry/cancel/inspect/requeue). ✓ no unsafe duplication of irreversible jobs.
- **Step 6.3** **Cache Management Center** (metrics + safe actions only, no raw Redis, confirm + audit). ✓ invalidate-namespace works and is audited.
- **Step 6.4** **Storage & Cleanup Center** (real backend deletion, quarantine/restore, audit). ✓ frontend deletion removes the real object.
- **Step 6.5** **Integrations + API Management + MCP admin** UIs on real data (§14). ✓ credentials never appear in the browser; MCP sensitive tools are approval-gated.
- **Step 6.6** **Backup & Recovery Center** — primary DR = **Supabase automated backups + PITR**; Drive backup is **supplementary** (encrypted packages, **no plaintext secrets**, checksum, verify, retention, history); restore = **typed-confirmation** privileged workflow with pre-restore backup + validation + audit. **GitHub** panel read-mostly via a GitHub App (gated write actions). Document RPO/RTO + a DR runbook. ✓ a backup verifies via checksum; restore requires typed confirmation and is audited.
- **Step 6.7** **System dashboard + health** overview surfacing understandable status. ✓ real component health shown.
- ✓ **Phase DoD:** every admin panel uses real backend data; no fake buttons; destructive actions gated + audited; the logger never slows requests. Security Gate passed.

### PHASE 7 — Remaining Business Modules (JAAGO priority order; each follows the per-module recipe in §23)
Build in this order, one at a time, each: backend (domain/app/infra/API) → frontend (list/detail/forms/states) → RLS + authZ + audit → import/export → tests (incl. cross-tenant) → docs.
- **7.1 Attendance, Onboarding, Recruitment** (complete the HR module; configurable candidate/onboarding stages).
- **7.2 Programmes & Projects** (programme→project→activities→milestones→outputs→results; project team/budget/expense/donor/partner/location; statuses; programme dashboard).
- **7.3 Donors & Grants** (donor CRM tabs; grant fields/workflow/disbursement/expenditure/remaining/reporting deadlines/documents).
- **7.4 Procurement & Vendors** (request→dept approval→review→quotations→comparison→approval→PO→goods/service receipt→invoice→payment→closed; vendor profiles with **restricted banking access**; auto request numbers). Uses the shared approval engine.
- **7.5 Inventory & Assets** (warehouses/items/categories; transactions Opening/Receipt/Issue/Return/Transfer/Adjustment/Disposal — **never overwrite stock without traceable movements**; asset lifecycle Available→Assigned→Repair→Lost→Damaged→Disposed→Retired with assignment/transfer/maintenance/history).
- **7.6 Finance (operational)** — Budgets/BudgetLines/Expenses/Payments/Project finance/Grant finance with **strict permissions + audit**; server-computed `Available = Approved − Committed − Spent`; **immutable posting concepts, controlled reversals, transactional integrity, idempotency**. **Do NOT invent accounting rules** — implement the operational data model and clearly flag areas needing Finance-team approval.
- **7.7 Documents, Tasks, Comments, Reports/Dashboards** — complete cross-cutting features and role-specific dashboards (Finance/HR/Management), print/PDF for official records.
- ✓ **Phase DoD (per module):** Definition of Done met, Security Gate passed, cross-tenant isolation tested, appears in nav/command-palette/global-search with permission scoping.

### PHASE 8 — Hardening & Pilot Readiness
- Security review · authorization review · **cross-organization access sweep** · performance review (EXPLAIN ANALYZE, slow-query monitoring, index tuning, connection pooling) · accessibility review · expand tests · backup/restore verification · deployment verification across dev/staging/prod.
- **Cross-device review (explicit):** exercise every MVP screen on **real phones, tablets, laptops, and desktops** (and emulators) across breakpoints, portrait + landscape, touch + keyboard/mouse; verify the PWA installs and offline-tolerant read views work; profile mobile performance on a **throttled mid-range Android + slow-network** profile and hit the Core Web Vitals budget. Fix layout breaks, unreachable actions, and hover-only affordances.
- ✓ **Phase DoD:** MVP (§21) is stable, secure, performant (incl. on mobile/low-network), accessible, **fully usable across mobile/tablet/laptop/desktop**, installable as a PWA, and deployable; DR runbook validated.

---

## 21. MVP DEFINITION (what must exist before staff pilot)

`Authentication (email + Google) · RBAC · Organization structure · Employee management · Leave · Projects · Procurement requests · Approval workflow · Vendor management · Assets · Documents · Notifications · Audit logs · Basic reporting · Administration/Settings · the Logger/Observability Center.` Advanced Finance and other complex modules follow after the relevant teams validate requirements.

**The MVP ships as one responsive web app + installable PWA that is fully usable on mobile, tablet, laptop, and desktop.** High-value mobile actions (approvals, leave submit/track, notifications, employee/vendor/project lookup, request status, expense/receipt capture) must be fast and effortless on a phone.

---

## 22. FIRST RESPONSE REQUIRED FROM YOU (before any code)

Do NOT generate application files yet. First deliver the **Architecture & Discovery Package**:

**A.** Executive architecture summary · **B.** Assumptions (labeled, needing org validation) · **C.** Modules + responsibilities · **D.** User roles · **E.** Initial permission matrix · **F.** Information architecture (sidebar/nav) · **G.** Route map · **H.** Database entities + relationships · **I.** **Mermaid ERD** · **J.** Approval-engine design · **K.** Security architecture (authN/authZ/privacy/validation/audit/storage) · **L.** Frontend architecture (RSC vs client, components, forms, tables, URL state, loading/errors) · **M.** Full folder structure · **N.** Development roadmap (the phases above, refined) · **O.** MVP definition · **P.** Risk register · **Q.** Decisions requiring approval from management/HR/Finance/Procurement/IT/programme teams.

Make conservative, clearly-labeled assumptions where requirements are unknown; do not block all progress on minor unknowns.

---

## 23. PER-MODULE IMPLEMENTATION RECIPE (apply to every business module)

`1. Understand workflow → 2. Define entities → 3. Define validation (Zod, shared) → 4. Define permissions → 5. Drizzle schema → 6. Migration (+ RLS policy + indexes + audit fields) → 7. Application/service layer → 8. API (controllers/DTOs/OpenAPI) → 9. Frontend (list/detail/forms, responsive/adaptive) → 10. Empty/loading/error states + mobile/tablet/desktop presentation → 11. Audit logging → 12. Tests (unit/integration + cross-tenant) → 13. lint → 14. typecheck → 15. test → 16. build → 17. Security Gate review → 18. Cross-device review (mobile/tablet/laptop/desktop, touch + keyboard, portrait + landscape) + accessibility review → 19. Update /docs + /TASKS.md.`

---

## START HERE

Begin with **PHASE 0**. Produce the Architecture & Discovery Package (§22) and the `/docs/*` + `/TASKS.md`. Write no application code until Phase 0 is complete and consistent. Then proceed step by step through the phases, honoring every checkpoint, the Security Gate, the Definition of Done, and the non-negotiable boundaries. Challenge anything that would violate the frontend↔backend boundary, the security rules, or the anti-chaos rules.
