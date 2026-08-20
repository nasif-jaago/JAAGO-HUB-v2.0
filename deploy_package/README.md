# JAAGO HUB v2.0 — Production Deployment Package

This package contains everything required to deploy **JAAGO HUB v2.0** on **cPanel Node.js App Manager** or any Linux server without Docker.

---

## 🚀 Quick Start on cPanel (5 Steps)

### Step 1: Upload Files
Upload `deploy_package.zip` to your server directory (e.g. `/home/username/jaagohub`) via cPanel **File Manager** and extract it.

### Step 2: Configure cPanel Node.js App Manager
1. Open cPanel > **Setup Node.js App** > **Create Application**.
2. Set:
   - **Node.js version**: 20.x or 22.x
   - **Application mode**: Production
   - **Application root**: `jaagohub` (or your folder name)
   - **Application startup file**: `index.js`
3. Click **Create**.

### Step 3: Set Environment Variables
In the cPanel Node.js App Manager screen, under **Environment variables**, add:
- `DATABASE_URL` = Your PostgreSQL connection string
- `SUPABASE_URL` = Your Supabase project URL
- `SUPABASE_ANON_KEY` = Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
- `REDIS_URL` = `redis://127.0.0.1:6379` (or managed Redis URL)
- `ENCRYPTION_KEK` = 32-character encryption key
- `JWT_SECRET` = Your JWT secret
- `NEXT_PUBLIC_APP_URL` = `https://yourdomain.com`
- `NEXT_PUBLIC_API_URL` = `https://yourdomain.com/api`
- `API_INTERNAL_URL` = `http://127.0.0.1:3001`

### Step 4: Install Dependencies & Run Migrations
Click **Run NPM Install** in cPanel (or open cPanel **Terminal**):
```bash
# Enter the virtual environment indicated at the top of your cPanel app screen:
source /home/username/nodevenv/jaagohub/22/bin/activate
pnpm install --prod # or npm install --omit=dev

# Run database migrations:
node scripts/migrate-production.mjs
```

### Step 5: Start / Restart Application
Click **Restart Application** in cPanel.

Verify by visiting:
- Frontend: `https://yourdomain.com`
- Health check: `https://yourdomain.com/health`
- API documentation: `https://yourdomain.com/api/docs`
