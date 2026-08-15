# Security — JAAGO Foundation ERP v2.0

> Last updated: 2026-08-16  
> Reference standard: OWASP Top 10, API Security Top 10, ASVS Level 2

## Security Principles

1. **Defense in depth** — multiple independent layers; no single point of failure
2. **Server-side authorization is mandatory** — hiding a UI element is UX, not security
3. **Zero secrets in the browser** — no service keys, no API secrets, no unencrypted credentials
4. **Audit everything sensitive** — approvals, financial actions, admin actions, auth events
5. **Fail closed** — if auth/authZ check fails or is uncertain, deny access

## Authentication (AuthN)

### Methods Supported
- Email + Password (Supabase Auth, bcrypt)
- Google OAuth via Supabase (configurable domain restriction e.g. `@jaago.com.bd`)
- TOTP-based MFA (org-wide enforcement policy configurable)

### Account Lifecycle
- No open self-registration (admin-invite only by default — configurable)
- Invitation flow: admin creates account → assigns role → email invite with expiring link → user activates
- Password reset: expiring single-use token (never email passwords)
- Refresh token rotation on every use
- Logout-all-sessions (revoke all refresh tokens)
- Admin-forced session revocation on account suspension

### Login Audit
Every auth event recorded in `login_audit`:
- Login success
- Login failure (with reason)
- Logout
- Password reset requested/completed
- Session revoked
- Account suspended
- MFA enabled/disabled
- Google OAuth linked/unlinked

### Session Bootstrap Optimization
On successful login:
1. Supabase JWT issued (short-lived access token)
2. Single `/api/me` call: returns profile + permissions + org context
3. No additional permission API calls during navigation

## Authorization (AuthZ)

### Primary Gate: `apps/api`

Every request through the RBAC guard before business logic:
```
JWT verify → resolve user + org → check hasPermission(user, 'module.entity.action') → proceed or 403
```

### Permission Helpers
```typescript
hasPermission(user, permission: string): boolean
requirePermission(user, permission: string): void // throws 403 if false
hasAnyPermission(user, permissions: string[]): boolean
hasRole(user, role: string): boolean
requireRole(user, role: string): void
```

### Secondary Gate: RLS (DB backstop)
```sql
-- Tenant isolation on every table
CREATE POLICY "tenant_isolation" ON {table}
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

Tenant context set at request start by the tenant-context guard:
```sql
SET LOCAL app.current_org_id = '{org_id}';
SET LOCAL app.current_user_id = '{user_id}';
SET LOCAL app.current_role = '{role}';
```

### Field-Level Sensitivity
Fields marked `SENSITIVE` require an explicit additional permission beyond the parent record read:
- `hr.employee.salary.view` — salary, allowances, benefits
- `hr.employee.banking.view` — banking details
- `hr.employee.disciplinary.view` — disciplinary records
- `hr.employee.medical.view` — medical/leave health records
- `vendors.vendor.banking.view` — vendor banking details

These fields are **never included in list API responses**. Detail view only, with explicit permission check.

## Secrets Management

### SecretManager Abstraction
- Wraps environment variables + future secret store (AWS SSM, HashiCorp Vault)
- API: `secretManager.get(key: string): string | undefined`
- All secret access goes through SecretManager — no direct `process.env` in business code

### Envelope Encryption
Third-party OAuth tokens, API keys, banking details encrypted at rest:
```
KEK (Key Encryption Key) — from secret store, never in DB
DEK (Data Encryption Key) — per-record, encrypted with KEK, stored in DB
Plaintext — encrypted with DEK
```

### What Goes Where
| Secret | Lives In |
|---|---|
| Supabase service-role key | `apps/api` env + `apps/worker` env only |
| Supabase anon key | `apps/web` env (auth bootstrap only — no writes) |
| Redis connection string | `apps/api` + `apps/worker` env only |
| SMTP/email credentials | `apps/api` env + `apps/worker` env only |
| Third-party OAuth refresh tokens | DB, envelope-encrypted |
| API keys (external) | DB, hashed (shown once on creation) |
| JWT signing keys | Supabase-managed |

### Boot Validation
The app **refuses to start** if any `REQUIRED` env var is missing (Zod env validation).

## Web Security Controls

| Control | Implementation |
|---|---|
| CORS | Explicit allowlist — no wildcard. Checked in Fastify config. |
| CSP | Strict Content-Security-Policy based on actual integrations. No `unsafe-inline`. |
| HSTS | `Strict-Transport-Security: max-age=31536000; includeSubDomains` in production |
| Cookies | `httpOnly=true`, `SameSite=Strict`, `Secure=true` (production) |
| CSRF | `SameSite=Strict` cookies + custom request header for state-changing requests |
| Rate limiting | Layered: anonymous / auth / auth-endpoints / upload / API-key / privileged |
| Request size | Hard body size limit in Fastify (configurable, default 10MB for uploads) |
| SQL injection | Drizzle parameterized queries — no raw string concatenation |
| XSS | Output encoding in Next.js (default) + strict CSP |
| IDOR | Tenant context guard + RLS ensures org isolation |
| Mass assignment | DTO allowlisting — only declared fields pass Zod validation |
| Path traversal | File paths normalized server-side; bucket paths use UUID-based names |
| Open redirects | Redirect targets validated against allowlist |
| Webhook replay | HMAC-SHA256 signature + timestamp (≤5min window) + nonce |

## File Upload Security

- File type validation by **magic bytes** (server-side) — never trust `Content-Type` header
- Size limits enforced before processing
- Files stored in private buckets (no public URLs)
- Download via short-TTL signed URLs (max 15 minutes)
- Org ownership verified before generating signed URL
- Quarantine bucket for suspicious files (flagged by validation)

## Security Gate — Definition of Done

A feature is NOT done until ALL pass:
- ✅ AuthN checked (unauthenticated requests get 401)
- ✅ AuthZ checked server-side (insufficient permission gets 403)
- ✅ RLS checked (cross-org test exists and passes)
- ✅ Input validation checked (Zod DTO validation)
- ✅ Sensitive data logging checked (redaction unit test passes)
- ✅ Rate-limit impact considered (endpoint categorized in rate limit tier)
- ✅ Audit requirements considered (business action logged to audit_log)
- ✅ Cross-organization access test added (must fail without RLS, pass after)

## Audit Requirements

The following actions are ALWAYS audit-logged (never sampled, never dropped):
- Login / logout / password reset / MFA changes
- User creation / role changes / permission changes
- All approval decisions (approve / reject / return / delegate)
- Financial actions (payment created / approved / reversed)
- API key creation / rotation / revocation
- Secret / credential rotation
- Sensitive data access (salary, banking, NID)
- Admin configuration changes (workflows, org settings)
- Bulk import / export of sensitive data
- Cache flush / admin deletions
- Backup and restore operations

## Incident Response

See `/docs/OPERATIONS.md` for the incident response runbook.

Security events are surfaced in the **Security Events** section of the Observability Center (admin-only).

## Known Limitations (MVP)

- Penetration test not yet scheduled — planned for Phase 8
- Bangladesh data protection law compliance review: pending (no formal law enacted yet as of 2026-08)
- biometric hardware integration out of scope for MVP
