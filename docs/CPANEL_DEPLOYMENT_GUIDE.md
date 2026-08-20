# JAAGO HUB v2.0 — Production cPanel Node.js Deployment Guide

This guide details the complete, step-by-step procedure to deploy and run **JAAGO HUB v2.0** on any **cPanel Server** using the **cPanel "Setup Node.js App" Manager** (CloudLinux / Phusion Passenger) without requiring Docker.

---

## 🏗️ 1. Architecture Overview

In cPanel's Node.js environment, the application runs through **Phusion Passenger**, which binds to a dynamically assigned port (`process.env.PORT`) and routes traffic to a single master startup file (`index.js`).

```
                              ┌────────────────────────────────────────┐
                              │            cPanel / Apache             │
                              │     (SSL Termination & Passenger)      │
                              └───────────────────┬────────────────────┘
                                                  │
                                          Binds process.env.PORT
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │           Unified index.js             │
                              │     Master Process & Health Probe      │
                              └───────────┬────────────────┬───────────┘
                                          │                │
                               In-Process │                │ Spawns Child
                                          ▼                ▼
                    ┌───────────────────────────┐    ┌───────────────────────────┐
                    │    apps/web (Next.js)     │    │ apps/api (NestJS Fastify) │
                    │ - Public UI & SSR         │───▶│ - Runs on 127.0.0.1:3001  │
                    │ - Reverse Proxies /api/*  │    │ - REST API & Swagger Docs │
                    └───────────────────────────┘    └─────────────┬─────────────┘
                                                                   │ Spawns Child
                                                                   ▼
                                                     ┌───────────────────────────┐
                                                     │    apps/worker (BullMQ)   │
                                                     │ - Async Jobs & Schedulers │
                                                     └───────────────────────────┘
```

---

## 📋 2. Prerequisites

1. **cPanel Account** with:
   - "Setup Node.js App" enabled (Node.js version `20.x` or `22.x`).
   - cPanel **File Manager** or SSH/FTP access.
   - cPanel **Terminal** access (optional but recommended).
2. **PostgreSQL Database** (either Supabase, cPanel PostgreSQL Database, or managed cloud PostgreSQL).
3. **Redis Instance** (local Redis on server `redis://127.0.0.1:6379` or Upstash/managed Redis).

---

## 📦 3. Generating the Deployment Package

Before uploading to cPanel, generate the standalone production build on your local machine or CI/CD runner:

```bash
# 1. Build and package the production artifacts
pnpm run build

# 2. Or trigger the deploy packager directly
pnpm run deploy:package
```

This generates:
- `deploy_package/` (folder containing compiled Next.js `.next`, NestJS `dist`, Worker `dist`, shared packages, and production `package.json`)
- `deploy_package.zip` (compressed zip archive ready for 1-click upload).

---

## 🚀 4. Step-by-Step cPanel Deployment

### Step 4.1: Upload Application Files
1. Log into your **cPanel** dashboard.
2. Open **File Manager**.
3. Navigate to your desired application directory (e.g., `/home/username/jaagohub`). If the folder does not exist, create it.
4. Upload `deploy_package.zip`.
5. Right-click `deploy_package.zip` and select **Extract**.
6. Delete `deploy_package.zip` after extraction to save disk space.

---

### Step 4.2: Create Application in cPanel Node.js App Manager
1. In cPanel, navigate to **Software** > **Setup Node.js App**.
2. Click **Create Application**.
3. Configure the following fields:
   - **Node.js version**: Select `20.x` or `22.x` (latest available).
   - **Application mode**: `Production`
   - **Application root**: `jaagohub` (relative path to your folder from home directory).
   - **Application URL**: Select your domain or subdomain (e.g. `hub.jaago.com.bd` or `erp.yourdomain.com`).
   - **Application startup file**: `index.js`
4. Click **Create**.

---

### Step 4.3: Configure Production Environment Variables
In the same Node.js App screen in cPanel, scroll down to **Environment variables** and add the following keys (or edit the `.env` file directly in `/home/username/jaagohub/.env`):

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production environment mode |
| `PORT` | *(Leave default/assigned)* | Passenger manages this dynamically |
| `API_PORT` | `3001` | Loopback port for NestJS Fastify backend |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/jaago_erp` | PostgreSQL connection string |
| `SUPABASE_URL` | `https://xyz.supabase.co` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase public anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Supabase service role secret |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis connection URL |
| `JWT_SECRET` | `your-secret-32-chars` | JSON Web Token signing key |
| `ENCRYPTION_KEK` | `your-32-char-key-string` | Master key encryption key |
| `NEXT_PUBLIC_APP_URL` | `https://hub.jaago.com.bd` | Public URL of the frontend |
| `NEXT_PUBLIC_API_URL` | `https://hub.jaago.com.bd/api` | Public API endpoint for browser calls |
| `API_INTERNAL_URL` | `http://127.0.0.1:3001` | Internal loopback address for Next.js SSR proxy |
| `CORS_ORIGIN` | `https://hub.jaago.com.bd` | Allowed CORS origins |

Click **Save** after adding environment variables.

---

### Step 4.4: Install Dependencies & Run Database Migrations
1. In the cPanel Node.js App screen, copy the virtual environment command shown at the top:
   ```bash
   source /home/username/nodevenv/jaagohub/22/bin/activate && cd /home/username/jaagohub
   ```
2. Open **cPanel Terminal** (or SSH) and paste the command.
3. Install production dependencies:
   ```bash
   pnpm install --prod
   # Or if using npm:
   npm install --omit=dev
   ```
4. Run database migrations to apply the latest schemas and tables:
   ```bash
   node scripts/migrate-production.mjs
   ```

---

### Step 4.5: Start / Restart the Application
1. Return to **cPanel > Setup Node.js App**.
2. Click **Restart Application**.
3. Status should indicate **Running**.

---

## 🔍 5. Verification & Health Monitoring

Verify that all subsystems are operational:

1. **Top-Level Health Probe**:
   Visit `https://hub.jaago.com.bd/health` (or `http://127.0.0.1:PORT/health`).
   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-08-20T16:00:00.000Z",
     "uptime": 123.45,
     "version": "2.0.0",
     "services": {
       "web": "running (in-process)",
       "api": "running",
       "worker": "running"
     }
   }
   ```

2. **Frontend UI**:
   Visit `https://hub.jaago.com.bd` to verify the Next.js login screen and dashboard.

3. **API Documentation**:
   Visit `https://hub.jaago.com.bd/api/docs` to view the interactive Swagger OpenAPI specification.

4. **Application Logs**:
   Inspect real-time logs in:
   - `/home/username/jaagohub/logs/jaago-hub.log`
   - cPanel stderr log: `/home/username/jaagohub/passenger.log` (or `stderr.log`)

---

## 🛠️ 6. Troubleshooting & Common Questions

### Q1: API requests return 503 "BACKEND_UNAVAILABLE"
- **Cause**: The Fastify API child process is still booting or failed due to invalid `DATABASE_URL` / `SUPABASE_URL`.
- **Solution**: Check `/home/username/jaagohub/logs/jaago-hub.log`. Ensure `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct and accessible from the server.

### Q2: How do I update the application after code changes?
1. Build locally: `pnpm run build`
2. Upload `deploy_package.zip` and extract to overwrite files.
3. In cPanel Terminal: `node scripts/migrate-production.mjs`
4. Click **Restart Application** in cPanel.

### Q3: Memory limit reached on shared hosting
- Because `index.js` uses pre-compiled `.next` and `dist` outputs, build memory spikes are avoided. Production runtime memory footprint is typically under ~250MB–350MB for all 3 services combined.
