# Adrena × Autonom: RWA Championship

> The first on-chain trading competition for real-world assets. Equities, commodities, and basket perps — scored by skill, not capital.

**Live Demo:** [Deploy to Vercel — see instructions below]  
**Bounty:** Superteam Ireland — Adrena × Autonom Trading Competition ($5,000 USDG)

---

## What This Is

The RWA Championship is a trading competition module built on top of Adrena's perpetuals platform, designed specifically for real-world asset (RWA) trading powered by Autonom's oracle infrastructure.

**Three innovations no other perp DEX competition has:**

1. **Risk-Adjusted Return (RAR) Scoring** — score by `PnL% × consistency × streak`, not raw dollar PnL. A 15% return on $5k beats a 2% return on $500k.
2. **Market-Hours Aware Sessions** — competitions pause at NYSE/CME close. Autonom's explicit "closed" semantics gate scoring. No gaming the spread on stale prices.
3. **Asset Class Leagues** — Equities, Commodities, and Baskets compete separately. Apple traders vs Apple traders. Gold traders vs Gold traders.

**QRNG Raffles** — weekly prize draws powered by Autonom's quantum randomness (ANU-sourced, Merkle-committed on-chain). Verifiably fair.

---

## Architecture

```
Adrena /position API → Scoring Engine → Supabase → Next.js Frontend
                          ↑
                   Autonom Price API
                   (CAN-normalized prices + market hours)
```

**Scoring Engine** — Node.js TypeScript service, runs every 60 seconds on VPS via pm2  
**Frontend** — Next.js 15, Supabase Realtime for live leaderboard updates  
**Database** — Supabase (PostgreSQL + Realtime)  
**RPC** — Helius  

---

## Scoring Formula

```
RAR = (PnL_normalized / Collateral × 100) × Consistency_multiplier × Streak_bonus
```

| Component | Range | Notes |
|-----------|-------|-------|
| PnL_normalized | Uses Autonom CAN-adjusted price | Corporate actions absorbed |
| Consistency_multiplier | 0.5x – 2.0x | Based on win-rate over ≥5 trades |
| Streak_bonus | 1.0x – 1.5x | +10% per active weekly streak |
| Qualifying trades | Min $50 collateral, >60s duration | Prevents wash trading |
| Leverage cap | Max 50x for scoring | 100x leverage = same as 50x in RAR |

---

## Project Structure

```
rwa-championship/
├── scoring-engine/          # Node.js scoring service
│   ├── src/
│   │   ├── index.ts         # Main loop (60s cycle)
│   │   ├── adrena.ts        # Adrena /position API client
│   │   ├── autonom.ts       # Autonom price + hours API client
│   │   ├── scoring.ts       # RAR formula + leaderboard updates
│   │   └── raffle.ts        # QRNG raffle engine
│   ├── package.json
│   └── .env.example
├── frontend/                # Next.js 15 app
│   ├── src/app/
│   │   ├── layout.tsx
│   │   └── page.tsx         # Live leaderboard (3 leagues)
│   ├── package.json
│   └── .env.local           # Supabase keys
└── schema.sql               # Supabase database schema
```

---

## Setup

### 1. Database (Supabase)

1. Go to [supabase.com](https://supabase.com) → your project → SQL Editor
2. Paste and run the contents of `schema.sql`
3. This creates all tables, indexes, realtime subscriptions, and seeds Season 1

### 2. Scoring Engine (VPS)

```bash
cd scoring-engine
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, AUTONOM_API_KEY
npm install
npm run build

# Start with pm2
npm run pm2:start

# View logs
npm run pm2:logs
```

### 3. Frontend (Vercel)

```bash
cd frontend
# .env.local is pre-filled with Supabase public keys
npm install
npm run dev    # Local development

# Deploy
vercel --prod
```

---

## Environment Variables

### Scoring Engine (`scoring-engine/.env`)

| Variable | Value |
|----------|-------|
| `SUPABASE_URL` | `https://apqhtlzejknhilvyalso.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Your service role key |
| `AUTONOM_API_KEY` | Your Autonom API key (from integration form) |

### Frontend (`frontend/.env.local`)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://apqhtlzejknhilvyalso.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |

---

## Autonom Integration

The scoring engine integrates with Autonom at two points:

**1. CAN-Normalized Prices**
```
GET https://api.autonom.cc/v1/prices/{SYMBOL}
→ Returns CAN-adjusted price (splits, dividends, M&A absorbed)
→ Used as exit_price_normalized for all PnL calculations
```

**2. Market Hours Status**
```
GET https://api.autonom.cc/v1/hours/{SYMBOL}
→ Returns { status: 'open' | 'closed', venue: 'NYSE' | 'CME' }
→ Positions closed during 'closed' status excluded from RAR leaderboard
```

**3. QRNG Raffle (weekly draws)**
```
POST https://api.autonom.cc/v1/qrng/random
→ ANU quantum randomness, Merkle-committed on-chain
→ Proof published publicly for verification
```

Until Autonom API key is received, the engine runs with realistic mock prices and local market hours logic. Swap in `AUTONOM_API_KEY` and the integration activates automatically.

---

## Adrena API Integration

```
GET https://datapi.adrena.trade/position?user_wallet={wallet}&limit={n}
→ Returns all closed positions with: pnl, entry_price, exit_price, 
  collateral_amount, entry_leverage, entry_date, exit_date, fees
```

No API key required — public endpoint.

---

## Abuse Prevention

| Attack | Mitigation |
|--------|-----------|
| Market hours gaming | Positions scored only if `market_open_at_close = true` (Autonom hours API) |
| Corporate action exploitation | All PnL uses Autonom CAN-normalized prices |
| Sybil wallets | Min 5 trades before appearing on leaderboard + consistency multiplier |
| Wash trading | Min $50 collateral + min 60s duration per qualifying trade |
| Leverage inflation | Max 50x scoring leverage cap in RAR formula |
| Basket timing | DAS timing penalty for entries after 50% of competition range |

---

## League Configuration

| League | Assets | Scoring | Market Hours |
|--------|--------|---------|--------------|
| Equities | AAPL, TSLA, NVDA, MSFT + more | RAR | NYSE Mon–Fri 9:30–4pm EST |
| Commodities | GOLD, SILVER, OIL, NATGAS + more | RAR | CME extended hours |
| Baskets | EV Metals, Semiconductors, FAANG | DAS | Derived from components |

---

## Test Competition

To run a test competition:

1. Register 10+ wallets via the frontend (wallet connect)
2. Ensure participants make at least 3 qualifying RWA trades during an active session
3. Monitor leaderboard updates in real-time
4. After session ends, collect feedback via the survey template in `/docs/test-feedback-template.md`

---

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Supabase Realtime
- **Scoring Engine:** Node.js, TypeScript, pm2
- **Database:** Supabase (PostgreSQL)
- **Data Sources:** Adrena API, Autonom API
- **Deployment:** Vercel (frontend), VPS/pm2 (scoring engine)
- **RPC:** Helius

---

*Built for the Superteam Ireland Adrena × Autonom bounty. Powered by Autonom CAN-normalized pricing, market hours intelligence, and QRNG-verified raffle draws.*
