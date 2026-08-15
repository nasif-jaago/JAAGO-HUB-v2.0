# Deployment Guide — JAAGO Foundation ERP v2.0

> Last updated: 2026-08-16  
> Status: Draft — to be finalized in Phase 8

## Environments

| Environment | Purpose | URL Pattern |
|---|---|---|
| Local | Developer workstation | `http://localhost:3000` (web), `http://localhost:3001` (api) |
| Development | Shared dev/testing | `https://dev.jaago-hub.org` |
| Staging | Pre-production validation | `https://staging.jaago-hub.org` |
| Production | Live system | `https://jaago-hub.org` |

## Local Development

### Prerequisites
- Node.js LTS (v22+)
- pnpm v9+
- Docker Desktop
- Supabase CLI

### Setup
```bash
# Clone and install
git clone https://github.com/jaago-foundation/jaago-erp.git
cd jaago-erp
pnpm install

# Copy environment files
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
cp apps/worker/.env.example apps/worker/.env

# Start Supabase locally
supabase start

# Run migrations
supabase db push

# Seed the database (fictional data only)
pnpm seed

# Start all services
pnpm dev
```

### Docker Compose (alternative)
```bash
docker-compose up
```

This starts: web (3000), api (3001), worker, redis (6379), postgres (5432, used by local Supabase).

## Environment Variables

### Required (app refuses to start without these)
```
# apps/api
DATABASE_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...    # Never expose in web
REDIS_URL=...
JWT_SECRET=...
ENCRYPTION_KEK=...               # Envelope encryption KEK

# apps/web
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...  # Auth bootstrap only
API_URL=...                        # Internal URL to apps/api

# apps/worker
DATABASE_URL=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
REDIS_URL=...
```

### Optional (app starts with defaults or feature disabled)
```
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS  # Email (falls back to console in dev)
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET      # Google OAuth (disabled if not set)
OTEL_EXPORTER_OTLP_ENDPOINT                # OTel (disabled if not set)
```

## Docker Images

Each app has a multi-stage Dockerfile:
1. **deps** — install pnpm dependencies
2. **builder** — compile TypeScript, build Next.js
3. **runner** — minimal production image, non-root user, healthcheck

```dockerfile
# Non-root user
USER node

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD wget -qO- http://localhost:{PORT}/health || exit 1
```

## CI/CD Pipeline

### CI (on every PR and push to main)
```yaml
steps:
  - pnpm install
  - pnpm typecheck        # TypeScript strict check across all packages
  - pnpm lint             # ESLint across all packages
  - pnpm test:unit        # Unit tests (domain, pure functions)
  - pnpm test:integration # Integration tests (with DB, Redis)
  - pnpm build            # Build all apps
  - security scan         # npm audit + SAST (e.g., Semgrep)
  - migration validation  # Apply migrations to shadow DB; block on destructive
  - container build       # Build and scan Docker images
```

### CD (on merge to main)
```yaml
steps:
  - Deploy to development (automatic)
  - Run smoke tests
  - Manual approval gate
  - Deploy to staging
  - Run E2E tests
  - Manual approval gate (production)
  - Deploy to production (blue-green or rolling)
  - Run healthchecks
  - Notify team
```

## Database Migrations

Migrations are managed exclusively by Supabase CLI:
```bash
# Create a new migration
supabase migration new {description}

# Apply to local
supabase db push

# Apply to remote (CI/CD)
supabase db push --linked
```

**Never run raw SQL on production tables.** All schema changes through migrations.

For destructive changes:
1. Back up (verify Supabase PITR is active)
2. Assess impact (CI blocks unless explicitly flagged)
3. Deploy compatible code (reads old schema)
4. Apply migration
5. Verify
6. Remove obsolete code in a follow-up

## RPO / RTO Targets

| Metric | Target | Mechanism |
|---|---|---|
| RPO (Recovery Point Objective) | < 5 minutes | Supabase PITR |
| RTO (Recovery Time Objective) | < 2 hours | Documented restore runbook |

See `/docs/OPERATIONS.md` for the full DR runbook.

## Production Readiness Checklist (Phase 8)

- [ ] All environment variables set and validated
- [ ] Supabase PITR enabled and verified
- [ ] Supplementary backup job running and checksums verified
- [ ] Redis persistence (AOF) enabled
- [ ] All healthchecks passing
- [ ] Rate limiting configured for production traffic
- [ ] HTTPS enforced; HSTS header present
- [ ] CORS allowlist correct for production domains
- [ ] MFA enforcement policy configured
- [ ] Google OAuth domain restriction set
- [ ] Monitoring/alerting configured (OTel → Grafana)
- [ ] Log retention policies active (partition drop scheduled)
- [ ] Audit log verifier job running
- [ ] DR runbook tested with a restore drill
