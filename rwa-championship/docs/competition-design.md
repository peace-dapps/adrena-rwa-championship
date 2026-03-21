# RWA Championship — Competition Design Document

**Bounty:** Superteam Ireland × Adrena × Autonom  
**Submitted by:** peace_onchain  
**Live Prototype:** https://adrena-rwa-championship.vercel.app  
**GitHub:** https://github.com/peace-dapps/adrena-rwa-championship

---

## 1. Problem Statement

Existing trading competitions on perpetuals platforms share a fundamental flaw: **they reward capital, not skill**. A trader with $100,000 will always outrank a trader with $1,000 on a raw PnL leaderboard — regardless of skill level. This creates a competition that is:

- Inaccessible to retail traders
- Dominated by whales
- Disconnected from Adrena's core value: "Be Equitable"

Additionally, no existing competition infrastructure is designed for **Real-World Assets**. Trading AAPL perpetuals requires market-hours awareness, corporate action normalization, and price feed reliability that crypto-native leaderboards don't provide. This is the gap the RWA Championship fills.

---

## 2. Competition Format

### Season Structure

The RWA Championship is organized into **Seasons** of approximately 12 weeks. Each season contains multiple weekly sessions across three asset class leagues.

```
Season (12 weeks)
├── Week 1
│   ├── Equities Session (Mon–Fri)
│   ├── Commodities Session (Mon–Fri)
│   └── Baskets Session (Mon–Fri)
├── Week 2
│   └── ...
└── Week 12 → Season Final Rankings
```

### Three Asset Class Leagues

| League | Assets | Market Hours |
|--------|--------|-------------|
| **Equities** | AAPL, TSLA, NVDA, MSFT | NYSE: Mon–Fri 9:30am–4pm ET |
| **Commodities** | Gold (XAU), Oil (CL1), Silver (XAG), NatGas | CME: Nearly 24/5 |
| **Baskets** | EV Metals, Semiconductors | Composite hours |

Traders can compete in one, two, or all three leagues simultaneously. Each league has its own weekly leaderboard and championship points table.

### Weekly Flow

1. **Session opens** — Admin activates session via admin panel
2. **Traders register** — Connect Phantom wallet, sign message, enter championship
3. **Trading window** — Traders open and close positions on Adrena during the week
4. **Scoring** — Engine polls Adrena API every 60 seconds, scoring closed positions
5. **Session closes** — Admin ends session or it auto-closes at `end_time`
6. **Points awarded** — Championship points distributed based on final rankings
7. **Raffle draw** — Weekly winner drawn via Autonom QRNG

---

## 3. RAR Scoring Formula

### Core Formula

```
RAR = PnL% × Consistency_Multiplier × Streak_Bonus
```

### Component Breakdown

**PnL% (Risk-Adjusted Percentage Return)**

```
PnL% = (Exit Price (CAN) - Entry Price) / Entry Price × 100
```

- Uses Autonom CAN-normalized exit prices to absorb corporate actions
- Calculated on percentage return, not absolute dollar amount
- A trader returning 5% on $100 scores identically to a trader returning 5% on $100,000

**Consistency Multiplier**

Rewards traders who maintain a strong win rate over a meaningful sample size:

| Win Rate | Min Trades | Multiplier |
|----------|-----------|------------|
| < 30% | Any | 0.5x |
| 30–49% | Any | 0.8x |
| 50–69% | 5+ | 1.0x |
| 70–84% | 5+ | 1.5x |
| 85%+ | 5+ | 2.0x |

**Streak Bonus**

Rewards traders who compete consistently across multiple weeks:

```
Streak_Bonus = 1.0 + (consecutive_weeks × 0.10)
Maximum: 1.5x (5+ consecutive weeks)
```

### Qualifying Position Rules

A position must meet all criteria to count toward RAR scoring:

| Rule | Value | Rationale |
|------|-------|-----------|
| Minimum collateral | $10 | Filters dust trades |
| Minimum duration | 60 seconds | Prevents flash gaming |
| Maximum leverage for scoring | 50x | Caps outsized leverage advantage |
| Market must be open at close | Yes | Prevents stale price gaming |

### Championship Points

Points awarded at end of each weekly session based on final rank:

| Rank | Points |
|------|--------|
| 1st | 100 pts |
| 2nd–3rd | 75 pts |
| 4th–10th | 50 pts |
| 11th–25th | 25 pts |
| All others | 5 pts |

Points accumulate across all weeks and leagues to form the **Season Standings**.

---

## 4. Autonom Integration

The Autonom integration is the core technical differentiator of this submission. Three APIs are used:

### 4.1 CAN Price Normalization

**Endpoint:** `GET https://oracle.autonom.cc/prices/batch?feed_ids={ids}&fresh=true`

**Why it matters for RWA assets:**

When Apple announces a 4:1 stock split, the raw share price drops from $200 to $50 overnight. A trader who went long at $200 and holds through the split would appear to have lost 75% of their position on a raw price leaderboard — even though they actually held through a neutral corporate action.

Autonom's CAN feeds normalize for:
- Stock splits and reverse splits
- Dividend adjustments
- Index rebalancing events

This makes the RWA Championship the first trading competition where corporate actions cannot break trader scores.

**Feed IDs used:**

| Asset | Symbol | Feed ID |
|-------|--------|---------|
| Apple | AAPL | 1030 |
| Tesla | TSLA | 1029 |
| NVIDIA | NVDA | 1022 |
| Microsoft | MSFT | 1002 |
| Gold | XAU | 2056 |
| Crude Oil | CL1 | 2003 |
| Natural Gas | NG1 | 2025 |
| Silver | XAG | 2069 |

### 4.2 Market Hours Gating

**Endpoint:** `GET https://oracle.autonom.cc/hours/asset/{symbol}/status`

The scoring engine checks market status at the time each position closes. Positions closed when the market is not trading are recorded but not counted toward RAR scores.

This prevents a common exploitation vector: opening large positions right before market close and holding through the overnight gap to capture price movements that happen outside trading hours.

### 4.3 QRNG Raffle

The weekly raffle uses Autonom's Quantum Random Number Generator for provably fair winner selection. Every trader earns raffle entries based on trading fees paid ($1 entry per $25 in fees). The QRNG proof is stored on-chain and displayed on the raffle results page for full transparency.

---

## 5. Quest System

Daily and weekly quests provide structured engagement goals beyond simple leaderboard ranking:

### Daily Quests (reset midnight UTC)

| Quest | Requirement | Reward |
|-------|-------------|--------|
| Active Trader | Close 3 trades today | 25 Mutagen |
| Both Sides | Open a long AND short | 25 Mutagen |
| Market Hours | Close during active hours | 15 Mutagen |

### Weekly Quests (reset Monday UTC)

| Quest | Requirement | Reward |
|-------|-------------|--------|
| Sharp Shooter | 50%+ win rate, 10+ trades | 200 Mutagen |
| League Explorer | Trade in all 3 leagues | 150 Mutagen |
| Consistent | 5-session streak | 100 Mutagen |

Mutagen points are a soft currency that will be used in future seasons for cosmetic rewards, early access, and competition tiers.

---

## 6. Achievement System

Six achievements can be unlocked based on trading behavior:

| Achievement | Condition | Rarity |
|-------------|-----------|--------|
| Equity Analyst | 10+ equity trades | Common |
| Commodity Trader | 10+ commodity trades | Common |
| Basket Weaver | First basket trade | Common |
| Consistent | 70%+ win rate, 10 trades | Rare |
| Streak Master | 3-week streak | Rare |
| RWA Leviathan | Top 3 in any league | Epic |

Achievements are stored on-chain via the Supabase database and displayed on trader profiles.

---

## 7. Anti-Gaming Measures

| Threat | Mitigation |
|--------|-----------|
| Whale dominance | RAR uses % return, not absolute PnL |
| Leverage abuse | 50x cap on leverage for scoring |
| Dust trade spam | $10 minimum collateral per qualifying trade |
| Flash gaming | 60-second minimum position duration |
| Stale price gaming | Market hours check at position close |
| Multi-wallet farming | Referral tracking flags correlated wallets |

---

## 8. Reward Structure

### Weekly Prizes
- **1st place per league:** 500 ADX (from raffle pool)
- **Raffle winner:** Selected via Autonom QRNG from all fee-paying traders

### Season Prizes
- **Season 1st overall:** Major prize (TBD with Adrena team)
- **Top 3 per league:** League champion badges and rewards

### Referral Rewards
- 1 bonus raffle entry per week for each referred trader who competes

---

## 9. Why This Is Better Than Existing Solutions

| Feature | RWA Championship | Generic Leaderboard | Bracket Elimination |
|---------|-----------------|--------------------|--------------------|
| Skill-based scoring | ✅ RAR formula | ❌ Raw PnL | ⚠️ Partial |
| RWA asset support | ✅ Built for RWA | ❌ Crypto only | ❌ Crypto only |
| Autonom integration | ✅ Full | ❌ None | ❌ None |
| CAN normalization | ✅ Yes | ❌ No | ❌ No |
| Market hours gating | ✅ Yes | ❌ No | ❌ No |
| QRNG raffle | ✅ Yes | ❌ No | ❌ No |
| Season structure | ✅ Yes | ❌ No | ⚠️ Rounds only |
| Quest system | ✅ Yes | ❌ No | ❌ No |
| Streak bonuses | ✅ Yes | ❌ No | ❌ No |

---

## 10. Technical Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                      │
│  Next.js 14, React, TypeScript, Supabase client          │
│                                                           │
│  /           → Leaderboard (3 league tabs)               │
│  /season     → Season standings                          │
│  /quests     → Daily/weekly quest tracker                │
│  /raffle     → QRNG raffle entries and results           │
│  /profile    → Personal stats, referral link             │
│  /trader/[w] → Public trader profile                     │
│  /about      → How it works, scoring formula             │
│  /admin      → Session management, raffle draws          │
│  /feedback   → Test competition survey                   │
│  /api/prices → Server-side Autonom price proxy           │
└──────────────────────┬───────────────────────────────────┘
                       │ Supabase JS client
                       ▼
┌──────────────────────────────────────────────────────────┐
│                   SUPABASE (Database)                     │
│  PostgreSQL with 11 tables:                              │
│  seasons, sessions, traders, positions,                  │
│  leaderboard_scores, season_leaderboard,                 │
│  raffle_entries, raffle_results,                         │
│  trader_achievements, trader_streaks,                    │
│  quest_completions, feedback                             │
└──────────────────────┬───────────────────────────────────┘
                       │ Supabase service key
                       ▼
┌──────────────────────────────────────────────────────────┐
│              SCORING ENGINE (VPS, pm2)                    │
│  Node.js + TypeScript — 60s polling cycle                │
│                                                           │
│  1. Fetch closed positions → Adrena /position API        │
│  2. Classify asset league → autonom.ts                   │
│  3. Check market hours → Autonom hours API               │
│  4. Get CAN price → Autonom prices/batch API             │
│  5. Compute RAR score → scoring.ts                       │
│  6. Update leaderboard → Supabase upsert                 │
│  7. Update raffle entries → raffle.ts                    │
│  8. Update streaks → streaks.ts                          │
│  9. Unlock achievements → achievements.ts                │
│  10. Complete quests → quests.ts                         │
│  11. Auto-close expired sessions                         │
└──────────────────────────────────────────────────────────┘
```

---

## 11. Edge Cases and Abuse Prevention

**Corporate actions mid-competition:**
Autonom CAN normalization handles splits, dividends, and index changes automatically. No manual intervention required.

**Market closed positions:**
Positions closed outside market hours are recorded in the database but flagged `market_open_at_close: false` and excluded from RAR scoring.

**Leverage gaming:**
Positions with entry leverage above 50x are capped at 50x for scoring purposes. A 100x leverage position scores identically to a 50x position.

**Wash trading:**
Minimum 60-second duration and $10 collateral filter out micro-trades designed to inflate win rate.

**Multi-wallet exploitation:**
The referral system tracks `referred_by` wallet addresses. Suspiciously correlated wallets (same referrer, same trading patterns) can be identified and excluded by admins.

---

## 12. Future Roadmap

- **Season 2:** Launch with live RWA assets as soon as Adrena supports them
- **QRNG raffle:** Full Autonom QRNG integration when endpoint available
- **OG image cards:** Dynamic share images per trader profile
- **Mobile app:** Native iOS/Android for push notifications on position close
- **DAO governance:** Season parameters voted on by ADX holders
- **Cross-chain:** Expand to other chains that add RWA perpetuals
ENDOFFILE
echo "Done"