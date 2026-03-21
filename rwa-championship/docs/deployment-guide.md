# RWA Championship — Deployment & Configuration Guide

## Overview

The RWA Championship consists of three components that must be deployed separately:

1. **Frontend** — Next.js app deployed on Vercel
2. **Database** — Supabase (PostgreSQL)
3. **Scoring Engine** — Node.js service running on a VPS via pm2

---

## Prerequisites

| Requirement | Version | Notes |
|------------|---------|-------|
| Node.js | 18+ | Required for both frontend and scoring engine |
| npm | 9+ | Comes with Node.js |
| Git | Any | For cloning and pushing |
| Supabase account | — | Free tier works |
| Vercel account | — | Free tier works |
| VPS | Any Linux | AlmaLinux 9 / Ubuntu recommended, min 1GB RAM |
| Phantom Wallet | Latest | For testing wallet connection |

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/peace-dapps/adrena-rwa-championship
cd adrena-rwa-championship/rwa-championship
```

---

## Step 2 — Set Up Supabase

### 2.1 Create Project

1. Go to https://supabase.com
2. Click **New Project**
3. Choose a name, password, and region
4. Wait for project to initialize (~2 minutes)

### 2.2 Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `rwa-championship/schema.sql`
4. Paste and click **Run**

### 2.3 Run Quest Migration

In SQL Editor, run:

```sql
CREATE TABLE IF NOT EXISTS quest_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  quest_key text NOT NULL,
  quest_name text NOT NULL,
  quest_type text NOT NULL,
  reward_mutagen int DEFAULT 0,
  session_id uuid REFERENCES sessions(id),
  completed_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quest_completions_wallet ON quest_completions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_quest_completions_completed_at ON quest_completions(completed_at);
```

### 2.4 Run Feedback Migration

```sql
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  q1_wallet_ease int,
  q2_trades_correct text,
  q3_rar_fairer text,
  q4_overall_rating int,
  q5_improvements text,
  q6_would_return text,
  q7_other text,
  submitted_at timestamptz DEFAULT now()
);
```

### 2.5 Get Your Keys

Go to **Project Settings** → **API**:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **service_role** key → `SUPABASE_SERVICE_KEY` (keep this secret)

---

## Step 3 — Deploy Frontend to Vercel

### 3.1 Push to GitHub

```bash
git add .
git commit -m "initial deployment"
git push origin main
```

### 3.2 Import to Vercel

1. Go to https://vercel.com
2. Click **Add New Project**
3. Import your GitHub repository
4. Set **Root Directory** to `rwa-championship/frontend`
5. Framework will auto-detect as **Next.js**

### 3.3 Add Environment Variables

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Your chosen admin password |

### 3.4 Deploy

Click **Deploy**. Every `git push` to `main` triggers a new deployment automatically.

---

## Step 4 — Deploy Scoring Engine to VPS

### 4.1 Connect to VPS

```bash
ssh root@your-vps-ip
```

### 4.2 Install Node.js (if not installed)

```bash
# AlmaLinux / CentOS
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs
```

### 4.3 Install pm2

```bash
npm install -g pm2
```

### 4.4 Clone and Set Up

```bash
git clone https://github.com/peace-dapps/adrena-rwa-championship
cd adrena-rwa-championship/rwa-championship/scoring-engine
npm install
```

### 4.5 Create Environment File

```bash
cat > .env << EOF
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
AUTONOM_API_KEY=your_autonom_api_key
EOF
```

### 4.6 Build and Start

```bash
npm run build

SUPABASE_URL=your_url SUPABASE_SERVICE_KEY=your_key AUTONOM_API_KEY=your_key \
pm2 start dist/index.js --name rwa-scoring-engine

pm2 save
pm2 startup
```

---

## Step 5 — Create First Season and Session

### 5.1 Initialize Season in Supabase SQL Editor

```sql
INSERT INTO seasons (name, status, start_date, end_date)
VALUES ('Season 1 — Expanse', 'active', now(), now() + interval '90 days');
```

### 5.2 Create Sessions via Admin Panel

1. Visit `https://your-site.vercel.app/admin`
2. Enter your admin password
3. Create sessions for each league and click **Activate**

---

## Step 6 — Verify Everything Works

### Check Scoring Engine Logs

```bash
pm2 logs rwa-scoring-engine --lines 20
```

Expected output every 60 seconds:
```
[2026-03-18T10:00:00.000Z] Starting scoring cycle...
[2026-03-18T10:00:03.500Z] Cycle complete. Processed X wallet-sessions.
```

---

## Scoring Engine Commands

```bash
pm2 logs rwa-scoring-engine        # View logs
pm2 restart rwa-scoring-engine     # Restart
pm2 stop rwa-scoring-engine        # Stop
pm2 monit                          # Monitor CPU/memory
```

---

## Troubleshooting

**Scores not updating:**
Restart with explicit env vars:
```bash
pm2 stop rwa-scoring-engine
pm2 delete rwa-scoring-engine
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... AUTONOM_API_KEY=... \
pm2 start dist/index.js --name rwa-scoring-engine
```

**Leaderboard shows no traders:**
- Check that a session is active in the admin panel
- Verify wallets are registered in the traders table in Supabase

**Price ticker showing 0.00%:**
- First load always shows 0.00% — refreshes every 30 seconds
- Check `/api/prices` route is returning data from Autonom

---

## Environment Variables Reference

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Yes | Admin panel access password |

### Scoring Engine (VPS)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase service role key |
| `AUTONOM_API_KEY` | Yes | Autonom API key for price feeds |

---

## Infrastructure Costs

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Vercel | Free | $0 |
| Supabase | Free | $0 |
| VPS (1GB RAM) | Basic | ~$6 |
| **Total** | | **~$6/month** |
