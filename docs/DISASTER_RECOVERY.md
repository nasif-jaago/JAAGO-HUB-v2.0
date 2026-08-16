# JAAGO HUB v2.0 — Disaster Recovery & Backup Runbook

## 1. Objectives

- **Recovery Point Objective (RPO)**: < 5 minutes (via continuous Write-Ahead Log archiving).
- **Recovery Time Objective (RTO)**: < 30 minutes (automated container restoration & database replay).

---

## 2. Backup Architecture

1. **Continuous WAL Streaming**: All database write operations stream Write-Ahead Logs to Supabase Cloud Storage.
2. **Automated Daily Snapshots**: Full logical & physical backups executed daily at 02:00 UTC and replicated to AWS S3 Glacier Vault.
3. **Pre-Migration & Manual Snapshots**: Generated via Admin Center (`/admin/observability`) before schema changes.

---

## 3. Recovery Procedures

### 3.1 Point-In-Time Recovery (PITR) Execution
```bash
# Verify integrity drill from CLI / Admin UI
pnpm --filter @jaago/api test:unit -- __tests__/admin.spec.ts

# Or trigger automated PITR verification endpoint
POST /api/v1/admin/backups/pitr-verify
```

### 3.2 Cold Start Reconstruction
1. Pull latest Docker images from GitHub Container Registry.
2. Deploy Supabase / PostgreSQL instance and restore target snapshot:
   ```bash
   pnpm db:migrate
   ```
3. Boot NestJS API and Next.js Web frontends:
   ```bash
   pnpm run build
   pnpm run start
   ```
4. Verify system health probes via `/health` and `/api/v1/ping`.
