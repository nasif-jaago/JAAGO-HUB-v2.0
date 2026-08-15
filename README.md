# JAAGO HUB v2.0 — ERP Platform

> Production-grade, modular ERP for JAAGO Foundation (Bangladesh NGO)  
> Built for mission-critical use over 10–15 years.

## Overview

JAAGO HUB v2.0 is a custom ERP system replacing the current Odoo-based JAAGO HUB. It is built as a pnpm Turborepo monorepo with a Next.js frontend and NestJS/Fastify backend, backed by Supabase (PostgreSQL + Auth + Storage) and Redis.

## Architecture

- **`apps/web`** — Next.js 15 (App Router), mobile-first responsive PWA
- **`apps/api`** — NestJS on Fastify, all business logic, OpenAPI 3.1
- **`apps/worker`** — BullMQ consumers, cron jobs, background tasks
- **`packages/*`** — 15 shared packages (logger, auth, database, cache, queue, validation, etc.)
- **`modules/*`** — ERP business modules (hexagonal architecture)
- **`supabase/`** — Migrations (single source of truth)

See [`/docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full architecture reference.

## Requirements

- Node.js LTS (v22+)
- pnpm v9+
- Docker Desktop
- Supabase CLI

## Quick Start (Local Development)

```bash
# Install dependencies
pnpm install

# Copy env files
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env

# Start Supabase locally
supabase start

# Run migrations
supabase db push

# Seed with fictional dev data
pnpm seed

# Start all services
pnpm dev
```

Services available at:
- Web: http://localhost:3000
- API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

## Commands

```bash
pnpm dev          # Start all services in development mode
pnpm build        # Build all apps and packages
pnpm test         # Run all tests
pnpm typecheck    # TypeScript check across all packages
pnpm lint         # ESLint across all packages
pnpm seed         # Seed the local DB with fictional data
```

## Documentation

| Doc | Description |
|---|---|
| [`/docs/PROJECT_CONTEXT.md`](./docs/PROJECT_CONTEXT.md) | Org context, departments, users, MVP scope |
| [`/docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System architecture, tech stack, patterns |
| [`/docs/DATABASE_CONVENTIONS.md`](./docs/DATABASE_CONVENTIONS.md) | DB naming, RLS, indexing, migrations |
| [`/docs/SECURITY.md`](./docs/SECURITY.md) | AuthN/AuthZ, secrets, web security, security gate |
| [`/docs/MODULE_GUIDE.md`](./docs/MODULE_GUIDE.md) | Module architecture, contract, implementation recipe |
| [`/docs/API_GUIDE.md`](./docs/API_GUIDE.md) | API patterns, response envelopes, error codes |
| [`/docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) | Environments, Docker, CI/CD, migrations |
| [`/docs/OPERATIONS.md`](./docs/OPERATIONS.md) | Health, observability, backups, incidents, DR |
| [`/docs/DECISIONS.md`](./docs/DECISIONS.md) | Architecture Decision Records (ADRs) |
| [`/docs/CHANGELOG.md`](./docs/CHANGELOG.md) | Version history |
| [`/TASKS.md`](./TASKS.md) | Phase-by-phase task tracker |

## Current Phase

**Phase 0 Complete** — Architecture & Discovery Package delivered.  
**Next:** Phase 1 — Foundation (pending stakeholder approval on open decisions).

See [`/TASKS.md`](./TASKS.md) for current status.

## Security

Security concerns? Vulnerabilities? Contact the IT team directly — do not open a public issue.

See [`/docs/SECURITY.md`](./docs/SECURITY.md) for the full security model.

## License

Proprietary — JAAGO Foundation Trust. All rights reserved.
