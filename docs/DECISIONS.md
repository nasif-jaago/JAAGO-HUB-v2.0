# Architecture Decision Records — JAAGO Foundation ERP v2.0

> Last updated: 2026-08-16  
> Format: ADR-{NNN} | Status: {Proposed | Accepted | Deprecated | Superseded}

---

## ADR-001: NestJS on Fastify as the Backend Framework

**Status:** Accepted  
**Date:** 2026-08-16

**Context:** Need a TypeScript-first backend framework with excellent DI, modularity, OpenAPI support, and performance for a complex ERP.

**Decision:** NestJS on Fastify adapter.

**Rationale:**
- NestJS provides enterprise-grade DI, guards, interceptors, pipes that map perfectly to the cross-cutting concerns needed
- Fastify adapter is significantly faster than Express and handles higher throughput
- Built-in OpenAPI support via `@nestjs/swagger`
- TypeScript-first, aligns with the entire stack

**Consequences:** Higher learning curve than Express; Fastify's stricter handling requires careful middleware porting.

---

## ADR-002: Drizzle ORM over Prisma

**Status:** Accepted  
**Date:** 2026-08-16

**Context:** Need a typed ORM for PostgreSQL. Two main options: Prisma (popular, mature) or Drizzle (newer, lighter).

**Decision:** Drizzle ORM.

**Rationale:**
- **Single migration source:** Supabase CLI is the migration runner. Prisma has its own migration system — using both creates two competing sources of truth. Drizzle doesn't manage migrations; it defers to Supabase CLI.
- Drizzle is fully TypeScript-native (schema is TS, not a separate DSL)
- Drizzle queries are more explicit, making it easier to audit for N+1 and unbounded queries
- Lighter runtime overhead

**Consequences:** Smaller ecosystem than Prisma; less tooling for visualization. Drizzle's API is lower-level — more explicit, which is intentional here.

---

## ADR-003: Supabase over Self-Hosted PostgreSQL

**Status:** Accepted (pending hosting approval — see Assumption B1)  
**Date:** 2026-08-16

**Context:** Need PostgreSQL with RLS, auth, storage, and backup/PITR without the operational burden of self-hosting for an NGO with limited IT staff.

**Decision:** Supabase Cloud.

**Rationale:**
- Managed PostgreSQL with built-in PITR (point-in-time recovery)
- Supabase Auth handles email + Google OAuth + MFA out of the box
- Supabase Storage for private file buckets with signed URLs
- RLS is a first-class citizen in Supabase
- Avoids need for separate auth service, storage service, and DB management
- Can self-host Supabase later if data residency demands it (same codebase)

**Consequences:** Dependency on Supabase. Mitigation: Drizzle ORM is DB-agnostic; auth layer is abstracted. Migration to self-hosted is documented.

---

## ADR-004: PWA over Native Mobile Apps (Initial Strategy)

**Status:** Accepted  
**Date:** 2026-08-16

**Context:** Field staff use mid-range Android phones. Need mobile support.

**Decision:** Ship a responsive web app + PWA first. No separate React Native or Flutter apps initially.

**Rationale:**
- A well-built responsive PWA covers field and office use cases at a fraction of the cost and maintenance
- One codebase serves mobile/tablet/laptop/desktop
- JAAGO has limited IT capacity; maintaining two codebases (web + native) is a significant burden
- Key field actions (approvals, leave, attendance, lookup) work well as PWA
- PWA can be installed to Android home screen

**Review trigger:** Revisit after 12 months of real usage data. Go native only if a concrete capability (deep offline, background location, biometric hardware) genuinely requires it.

**Consequences:** PWA has limitations vs. native (camera quality, background tasks, push on iOS). Documented limitations shared with stakeholders.

---

## ADR-005: Partitioned PostgreSQL for Logs (Not Elasticsearch)

**Status:** Accepted  
**Date:** 2026-08-16

**Context:** Need log storage for app logs, audit logs, API request logs, security events.

**Decision:** Partitioned PostgreSQL tables (range-partitioned by time). Loki/ELK/Elasticsearch deferred.

**Rationale:**
- No additional infrastructure to manage initially
- PostgreSQL full-text search is sufficient for the log query patterns needed
- Time-based partitioning gives instant partition-drop retention (no expensive DELETE)
- The stack already has PostgreSQL — one less moving part
- Move to Loki only on evidence (query performance degradation, storage cost)

**Review trigger:** When query latency on the logs page exceeds 500ms under normal usage, evaluate Loki or ClickHouse.

**Consequences:** Log query performance at very high volume (>100M rows) will degrade. Partition-drop retention mitigates this. Indexed first-load queries avoid full scans.

---

## ADR-006: pnpm + Turborepo Monorepo

**Status:** Accepted  
**Date:** 2026-08-16

**Context:** Need to manage `apps/web`, `apps/api`, `apps/worker`, and 15+ shared packages.

**Decision:** pnpm workspaces + Turborepo.

**Rationale:**
- pnpm's strict linking prevents phantom dependencies
- Turborepo provides build caching (CI speed), task orchestration, and remote cache
- Single repo = single CI/CD, shared types/validation, atomic commits across app and packages
- Industry standard for this type of stack

**Consequences:** More complex initial setup. Developers must understand workspace package resolution. Worth the investment for a 10–15 year codebase.

---

## ADR-007: BullMQ on Redis for Job Queues

**Status:** Accepted  
**Date:** 2026-08-16

**Context:** Need reliable background job processing (email, reports, imports, exports, cleanup, backups).

**Decision:** BullMQ backed by Redis.

**Rationale:**
- BullMQ is the most mature Redis-backed queue for Node.js
- Rich features: retries, backoff, priorities, dedup, DLQ, progress, concurrency
- Redis is already in the stack (cache layer)
- Bull Board UI available for job inspection

**Consequences:** Dependency on Redis availability. Mitigation: health check on Redis; graceful degradation on cache miss; queue persistence via Redis AOF.

---

## ADR-008: No GraphQL Initially

**Status:** Accepted  
**Date:** 2026-08-16

**Context:** Some team members suggested GraphQL for flexible querying.

**Decision:** REST + OpenAPI 3.1 only, initially.

**Rationale:**
- REST is well-understood and maps cleanly to the permission model (endpoint-level authZ)
- OpenAPI auto-generates typed client — avoids manual GraphQL codegen complexity
- GraphQL's flexible querying makes field-level permission enforcement harder to reason about
- The DataTable component uses server-side filter/sort/pagination — not a GraphQL use case

**Review trigger:** If multiple client types (mobile native, third-party integrations) need truly different data shapes, evaluate GraphQL federation.

---

## ADR-009: Audit Log in Transaction (Not a Side Effect)

**Status:** Accepted  
**Date:** 2026-08-16

**Context:** Should audit logging be synchronous (in the same DB transaction) or asynchronous (event-driven)?

**Decision:** Audit log writes are **synchronous within the business transaction**.

**Rationale:**
- If a financial action succeeds but the audit write fails, we have an unrecorded movement of money — unacceptable
- The audit log must be guaranteed — it is NOT a log level, it is a compliance record
- If the audit write fails, the business transaction fails (money does not move unrecorded)
- App/debug logs (non-audit) remain non-blocking and async

**Consequences:** Slightly higher write latency on business operations. Acceptable tradeoff for a non-profit's compliance requirements.

---

## ADR-010: No Redux / Zustand for Server State

**Status:** Accepted  
**Date:** 2026-08-16

**Context:** How to manage server-fetched data in the frontend.

**Decision:** TanStack Query for server state. Zustand only for cross-cutting UI state (sidebar, command palette, org switcher).

**Rationale:**
- Redux is over-engineered for server-state caching; TanStack Query is purpose-built for this
- Zustand is minimal and sufficient for the handful of global UI concerns
- `searchParams` for URL-persistent state (filters, pagination, sort)
- Clear separation of concerns: server state vs. URL state vs. form state vs. local UI state
