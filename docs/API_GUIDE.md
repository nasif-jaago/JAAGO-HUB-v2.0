# API Guide — JAAGO Foundation ERP v2.0

> Last updated: 2026-08-16

## API Philosophy

- **REST + OpenAPI 3.1** — auto-generated from NestJS decorators
- **Typed client** generated into `packages/api-client` in CI — frontend always uses this, never raw `fetch`
- No GraphQL initially
- Internal API only — external access via separate API Management Center (scoped keys)

## Base URL

```
Development:  http://localhost:3001/api
Production:   https://api.jaago-hub.org/api
```

## Authentication

All endpoints (except public OAuth callbacks) require:
```
Authorization: Bearer {supabase_access_token}
Cookie: sb-{ref}-auth-token={session}
```

The BFF in `apps/web` forwards the session cookie automatically.

## Standard Response Envelope

All responses use `ActionResult<T>`:

```typescript
// Success
{
  "success": true,
  "data": T,
  "meta": {             // for list endpoints
    "cursor": "...",
    "hasMore": true,
    "total": 247        // approximate count (not always exact)
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "LEAVE_REQUEST_OVERLAP",
    "message": "You already have an approved leave request overlapping these dates.",
    "fieldErrors": {     // optional, for validation errors
      "fromDate": "Overlaps with approved leave LV-2026-000023",
      "toDate": "..."
    },
    "correlationId": "01J5G...",  // for support/debugging
    "traceId": "abc123..."
  }
}
```

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation error (Zod) |
| 401 | Unauthenticated |
| 403 | Unauthorized (insufficient permission) |
| 404 | Not found (or hidden by RLS — same response) |
| 409 | Conflict (duplicate, optimistic concurrency) |
| 422 | Business rule violation |
| 429 | Rate limited |
| 500 | Internal server error |

## Pagination

All list endpoints use cursor-based pagination:

```
GET /api/hr/employees?limit=50&cursor=eyJpZCI6IjEyMyJ9&sort=name&dir=asc
```

Response includes `meta.cursor` (next page token) and `meta.hasMore`.

Never use offset pagination for business data.

## Filtering & Sorting

Filter parameters use a consistent pattern:
```
?status=active&departmentId={uuid}&search=nasif&sort=createdAt&dir=desc
```

All filter parameters validated by Zod DTOs before reaching business logic.

## API Versioning

API is versioned via URL prefix:
```
/api/v1/hr/employees
```

Breaking changes require a new version. Non-breaking changes are backwards-compatible on the same version.

## Rate Limiting

| Tier | Limit | Applies To |
|---|---|---|
| Anonymous | 20 req/min | Unauthenticated requests |
| Authenticated | 300 req/min | Normal authenticated users |
| Auth endpoints | 10 req/min | `/api/auth/*` |
| Upload | 10 req/min | File upload endpoints |
| Privileged | 60 req/min | Admin endpoints |
| API key | Per-key configurable | External API access |

Rate limit headers returned on every response:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 287
X-RateLimit-Reset: 1723733400
```

## Correlation ID

Every request receives a correlation ID (generated at ingress if not provided):
```
X-Correlation-ID: 01J5G9XVHK3...
```

Returned on every response. Propagated to worker jobs. Used in logs for request tracing.

## Error Codes

Error codes follow the pattern: `{MODULE}_{ENTITY}_{ERROR_TYPE}`

Examples:
- `HR_LEAVE_OVERLAP` — leave request dates overlap existing approved leave
- `PROCUREMENT_PR_BUDGET_EXCEEDED` — PR amount exceeds available budget
- `AUTH_MFA_REQUIRED` — MFA required for this org
- `COMMON_RATE_LIMIT_EXCEEDED` — rate limit hit

Each error code maps to a curated `IssueTemplate` in the Observability Center.

## OpenAPI Documentation

Available at:
```
Development: http://localhost:3001/api/docs
```

Auto-generated from NestJS `@ApiOperation`, `@ApiResponse`, `@ApiProperty` decorators.

## External API Access (API Keys)

External systems access the API via scoped API keys:
- Keys shown once on creation (hashed in DB)
- Scopes limit what the key can do
- Per-key rate limits and IP allowlists
- Managed in Admin → API Management Center
- External requests resolve key → service account → scopes → tenant context

## BFF Pattern (apps/web)

The Next.js BFF (`app/api/[...proxy]/route.ts`) forwards requests:
```typescript
// apps/web/app/api/[...proxy]/route.ts
// Thin proxy ONLY — no business logic here
export async function GET(request: Request) {
  const session = await getServerSession(); // from Supabase auth
  return fetch(`${API_URL}${pathname}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'X-Correlation-ID': request.headers.get('X-Correlation-ID') ?? generateId(),
    }
  });
}
```
