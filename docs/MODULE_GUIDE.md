# Module Guide — JAAGO Foundation ERP v2.0

> Last updated: 2026-08-16

## What is a Module?

A module is a self-contained unit of business functionality organized as **Hexagonal / Clean Architecture**. Each module has four layers:

```
modules/{domain}/{module-name}/
├── domain/           Pure TypeScript: entities, value objects, domain events, invariants
│                     ZERO framework imports. No NestJS, no Drizzle here.
├── application/      Use cases (command/query handlers), authorization checks,
│                     transaction boundaries, orchestration
│                     Depends only on domain + port interfaces (not infrastructure)
├── infrastructure/   Implements the ports: Drizzle repos, Redis, BullMQ, email,
│                     external API adapters
└── interface/        NestJS controllers, Zod-validated DTOs, guards, OpenAPI decorators
                      Thin layer: translates HTTP ↔ application commands
```

## Module Contract

Every module must export a typed `ModuleContract`:

```typescript
interface ModuleContract {
  id: string;                    // e.g. 'hr.leave'
  name: string;                  // e.g. 'Leave Management'
  version: string;               // semver e.g. '1.0.0'
  dependencies: string[];        // other module IDs this depends on
  permissions: Permission[];     // permissions this module registers
  routes: RouteDefinition[];     // API routes exposed
  navigation: NavItem[];         // sidebar nav items (role-gated)
  migrations: string[];          // migration file names (for ordering)
  entities: string[];            // entity type names
  events: DomainEventDefinition[];   // events this module emits
  eventHandlers: EventHandlerDefinition[];  // events this module handles
  jobs: JobDefinition[];         // BullMQ jobs registered
  scheduledJobs: CronDefinition[];  // cron jobs
  settings: ZodSchema;           // module-level settings schema
  featureFlags: FeatureFlag[];   // flags this module uses
  auditActions: string[];        // audit action verbs
  notifications: NotificationDefinition[];  // notification types
  health(): Promise<HealthStatus>;  // module health check
}
```

## Module Communication Rules

Modules communicate ONLY via:
1. **Published application-service interfaces** (dependency-injected ports)
2. **Domain events** on the event bus
3. **Internal API calls** (via the typed api-client)

**A module NEVER imports another module's:**
- Repositories
- Internal services
- Domain entities (use shared-types for cross-module types)
- Infrastructure adapters

This is enforced by an **ESLint module-boundary rule** that fails CI.

## Per-Module Implementation Recipe

For each business module, follow this order:

1. **Understand the workflow** — map the full business process
2. **Define entities** — domain entities, value objects, invariants
3. **Define validation** — Zod schemas in `packages/validation` (shared FE/BE)
4. **Define permissions** — add to module contract
5. **Drizzle schema** — table definitions in `packages/database/schema/{module}/`
6. **Migration** — Supabase CLI migration with RLS policy + indexes + audit fields
7. **Application/service layer** — use cases (commands + queries)
8. **API layer** — NestJS controllers, DTOs, OpenAPI decorators
9. **Frontend** — list page + detail page + forms (responsive/adaptive)
10. **Empty/loading/error states** — for every page at every breakpoint
11. **Audit logging** — every write action logged to audit_log
12. **Tests** — unit (domain), integration (repository + service), cross-tenant (security)
13. **Lint** — `pnpm lint`
14. **Typecheck** — `pnpm typecheck`
15. **Test** — `pnpm test`
16. **Build** — `pnpm build`
17. **Security Gate review** — all 8 checkboxes passed
18. **Cross-device review** — mobile / tablet / laptop / desktop verified
19. **Update docs** — `/docs` + `/TASKS.md`

## Module Generator

```bash
pnpm create-module <domain>/<module-name>
# Example:
pnpm create-module hr/recruitment
```

Scaffolds all four backend layers + permissions/events/migrations/tests + frontend routes/nav.

## Module Registry

Modules register at startup via the `ModuleRegistry` service in `packages/database`. The registry:
- Resolves dependency order
- Registers permissions into the `permissions` table
- Assembles the navigation tree (filtered by role at runtime)
- Wires event handlers
- Registers BullMQ jobs and cron schedules

## Feature Flags

Feature flags allow gating module features per org without code changes:
```typescript
if (await featureFlags.isEnabled('hr.recruitment.ai-screening', { orgId })) {
  // AI screening feature
}
```

Flags managed in the Admin → Settings UI.

## Module Enable/Disable

Modules can be enabled/disabled per org via the module registry. Disabling a module:
- Removes its nav items
- Returns 404 on its routes
- **Does NOT bypass authZ** (it's additive restriction, not a security gate replacement)
- Is recorded in audit log

## Module List

### Phase 1–4 (Platform / Core)
| Module ID | Name | Phase |
|---|---|---|
| `core.organizations` | Organizations & Offices | 1–2 |
| `core.users` | Users & Profiles | 2 |
| `core.auth` | Auth & RBAC | 2 |
| `core.approvals` | Approval Workflow Engine | 4 |
| `core.notifications` | Notifications | 3 |
| `core.audit` | Audit Logs | 3 |
| `core.files` | File Storage | 3 |
| `core.reference-numbers` | Reference Numbers | 3 |
| `core.settings` | Settings | 4 |
| `core.feature-flags` | Feature Flags | 4 |

### Phase 5–7 (Business)
| Module ID | Name | Phase |
|---|---|---|
| `hr.employees` | Employee Management | 5 |
| `hr.leave` | Leave Management | 5 |
| `hr.attendance` | Attendance | 7.1 |
| `hr.recruitment` | Recruitment | 7.1 |
| `hr.onboarding` | Onboarding | 7.1 |
| `programmes` | Programmes | 7.2 |
| `projects` | Projects | 7.2 |
| `donors` | Donors | 7.3 |
| `grants` | Grants | 7.3 |
| `procurement` | Procurement | 7.4 |
| `vendors` | Vendors | 7.4 |
| `inventory` | Inventory | 7.5 |
| `assets` | Assets | 7.5 |
| `finance` | Finance | 7.6 |
| `documents` | Documents | 7.7 |
| `tasks` | Tasks | 7.7 |
| `reports` | Reports & Dashboards | 7.7 |
| `admin.ops` | Operations Admin | 6 |
