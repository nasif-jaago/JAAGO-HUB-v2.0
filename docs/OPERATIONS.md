# Operations Guide — JAAGO Foundation ERP v2.0

> Last updated: 2026-08-16

## Service Health

Health endpoint: `GET /health`

Returns component status:
```json
{
  "status": "healthy",
  "timestamp": "2026-08-16T00:00:00.000Z",
  "components": {
    "database": { "status": "healthy", "latencyMs": 4 },
    "redis": { "status": "healthy", "latencyMs": 1 },
    "queue": { "status": "healthy", "pending": 3 },
    "storage": { "status": "healthy" }
  }
}
```

## Observability & Logs Center (Admin UI)

Available at `/admin/observability`. Requires `admin.ops.view` permission.

Pages:
- **Overview** — system health + key metrics at a glance
- **Live Errors** — real-time error stream since cursor
- **App Logs** — structured logs (default: last 200 rows, time-bounded)
- **API Requests** — HTTP request logs with latency/status
- **Background Jobs** — job states (queued/running/completed/failed/dead-letter)
- **Auth Events** — login/logout/reset/MFA/invite events
- **Security Events** — anomalies, rate limit hits, CORS violations
- **Database Issues** — slow queries, connection pool issues
- **Cache Events** — hit/miss/eviction/invalidation
- **Audit Logs** — immutable business action audit trail
- **System Health** — component health timeseries

## Background Jobs Center

Available at `/admin/observability/jobs`.

Allows admins to:
- View job state (queued / running / completed / failed / retrying / dead-lettered)
- Inspect job data and error details
- **Retry** failed jobs (with confirmation; idempotency enforced)
- **Cancel** queued/active jobs where safe and reversible
- **Requeue** dead-lettered jobs (requires typed confirmation for irreversible)
- **Never** unsafe duplication of financial/irreversible jobs

## Cache Management Center

Available at `/admin/cache`.

Shows:
- Redis health (memory, connected clients, uptime)
- Namespace inventory (key counts, hit/miss rates, eviction stats)
- TTL distribution

Safe actions (all require confirm + are audit-logged):
- Invalidate by namespace
- Invalidate by tag
- Warm specific resource
- Pause cache policy

**No raw Redis commands are ever exposed in the UI.**

## Storage & Cleanup Center

Available at `/admin/storage`.

Shows temp uploads, abandoned uploads, temp reports/exports, orphaned files.

Actions:
- View file metadata (org, purpose, created, expiry, status, related entity)
- Quarantine suspicious files
- Restore quarantined files (with reason)
- Delete (real backend deletion + removes from bucket — never frontend-only fake)
- Trigger cleanup run

**Permanent business documents are never touched by automated cleanup.**

## Backup & Recovery Center

Available at `/admin/backup`.

### Primary DR: Supabase PITR
- Supabase automated backups + Point-In-Time Recovery
- Managed by Supabase Cloud
- RPO target: < 5 minutes

### Supplementary Backup (Google Drive / S3)
- Encrypted backup packages (no plaintext secrets)
- Checksum verification on creation and before restore
- Retention policy (configurable, default 30 daily + 12 monthly)
- Backup history with status and checksum

### Restore Procedure
1. Pre-restore backup (automatic, before any restore)
2. Typed confirmation: type `RESTORE {backup-date}` to proceed
3. Validation of backup integrity (checksum verify)
4. Audit log entry created before restore begins
5. Restore executed
6. Post-restore healthcheck
7. Audit log entry with outcome

## Incident Response

### Severity Levels
| Level | Description | Response Time | Example |
|---|---|---|---|
| P1 — Critical | System down or data integrity risk | < 15 minutes | DB unreachable, audit chain broken |
| P2 — High | Core feature broken, security event | < 1 hour | Login broken, RLS policy misconfigured |
| P3 — Medium | Non-core feature degraded | < 4 hours | Background jobs failing, email delivery delayed |
| P4 — Low | Minor issue, workaround exists | Next business day | UI cosmetic issue, non-critical error |

### Response Steps
1. **Identify** — correlationId / traceId from user report → find in Observability Center
2. **Triage** — determine severity and affected scope (which org, which users, which data)
3. **Contain** — rate limit, suspend account, or disable integration if needed
4. **Investigate** — cross-service timeline via traceId; DB slow-query logs; audit trail
5. **Fix** — hotfix or rollback
6. **Verify** — confirm fix via healthcheck + smoke test
7. **Post-mortem** — document root cause and preventive measures

### Escalation
- P1/P2: Immediate notification to IT + Management
- P1: Activate DR runbook if data loss risk

## DR Runbook

**Scenario: Complete database failure**

1. Activate Supabase PITR restore (Supabase dashboard)
2. Identify target restore point (before incident)
3. In Backup & Recovery Center: "Restore from Supabase PITR" + typed confirmation
4. Worker: stop all queue processors to prevent concurrent writes during restore
5. Run data integrity checks (audit chain verifier, referential integrity check)
6. Restart worker processors
7. Notify affected users
8. Post-mortem within 48 hours

**Scenario: Redis failure**
- Cache: application degrades gracefully (cache miss → DB read)
- Queue: BullMQ job metadata lost → jobs may need re-triggering (idempotency ensures safety)
- Recovery: restart Redis with AOF persistence; monitor queue depth

## Monitoring & Alerts

OTel metrics exported to Prometheus + Grafana.

Key alerts:
- Error rate > 1% for 5 minutes → P2
- API latency p95 > 2s for 5 minutes → P3
- Queue depth > 1000 for 10 minutes → P3
- DB connection pool exhausted → P2
- Redis memory > 80% → P3
- `logs_dropped_total` increasing → P3
- Audit chain verification failure → P1
- Failed backup job → P2
- Any login from unusual IP for admin accounts → P2

## Retention Policies

| Data | Retention | Mechanism |
|---|---|---|
| App logs | 30 days | Partition drop (daily partitions) |
| API request logs | 7 days | Partition drop |
| Security events | 90 days | Partition drop |
| Audit logs | 7 years | Partition drop (annual partitions) |
| Temp uploads | TTL on creation (default 24h) | Cleanup worker |
| Session tokens | Per-session lifetime | Supabase managed |
| Supplementary backups | 30 daily + 12 monthly | Cleanup job |

## Performance Targets

| Metric | Target |
|---|---|
| List page first load (server-side) | < 500ms p95 |
| Detail page first load | < 300ms p95 |
| Form submit (non-financial) | < 500ms p95 |
| Approval action (transactional) | < 1s p95 |
| Log page first load (bounded query) | < 500ms p95 |
| Core Web Vitals (LCP) — desktop | < 2.5s |
| Core Web Vitals (LCP) — throttled mobile | < 4s |
| Core Web Vitals (CLS) | < 0.1 |
