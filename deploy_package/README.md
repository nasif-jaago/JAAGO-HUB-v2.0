# JAAGO HUB v2.0 — Production Deployment Package

## Quick Start (on server)

```bash
# 1. Install dependencies
pnpm install

# 2. Start all services
NODE_ENV=production node index.js
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Web     | 3000 (or $PORT) | Next.js Frontend |
| API     | 3001 (or $API_PORT) | NestJS Backend |
| Worker  | N/A  | BullMQ Background Jobs |

## Environment Variables

Set these in your .env files or CPanel environment settings:
- PORT (Web port, default: 3000)
- API_PORT (API port, default: 3001)
- DATABASE_URL
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- REDIS_URL
- ENCRYPTION_KEK

## Files

- `index.js` — Main startup file (point CPanel here)
- `api-resolve-hook.js` — Module resolver for NestJS API
- `apps/web/.next/` — Compiled Next.js frontend
- `apps/api/dist/` — Compiled NestJS API
- `apps/worker/src/` — Worker TypeScript source (runs via tsx)
