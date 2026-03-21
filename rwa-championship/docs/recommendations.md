# RWA Championship — Recommendations for Iteration

## Overview

This document outlines recommended improvements and next steps for the RWA Championship based on the system architecture, test competition findings, and feedback collected during Season 1 testing.

---

## 1. Asset Expansion (High Priority)

**Current state:** The competition infrastructure is built for RWA assets (Equities, Commodities, Basket Perps) but Adrena currently only supports crypto perpetuals (WBTC, JitoSOL, BONK). The system runs in compatibility mode using crypto assets for testing.

**Recommendation:** As soon as Adrena launches RWA perps with Autonom price feed integration, activate the three league system immediately. The scoring engine, leaderboard, and market hours gating are all production-ready. No code changes required — just swap the session leagues to `equities`, `commodities`, and `baskets`.

**Priority assets to launch with:**
- Equities: AAPL, TSLA, NVDA, MSFT
- Commodities: GOLD (XAU), OIL (CL1), SILVER (XAG), NATGAS
- Baskets: EV Metals, Semiconductors (pending Autonom maintenance)

---

## 2. QRNG Integration (High Priority)

**Current state:** The raffle system uses `Math.random()` as a placeholder. The Autonom QRNG endpoint was not yet available during development.

**Recommendation:** Replace the mock raffle draw in `admin/page.tsx` with a real Autonom QRNG call when the endpoint becomes available. The raffle logic, database schema, and UI are all in place. The change is a single function swap.

```typescript
// Current mock
const winnerIndex = Math.floor(Math.random() * pool.length)

// Replace with Autonom QRNG
const qrngResponse = await fetch('https://oracle.autonom.cc/qrng/random', {
  headers: { 'x-api-key': AUTONOM_API_KEY }
})
const { random_value } = await qrngResponse.json()
const winnerIndex = Math.floor(random_value * pool.length)
```

---

## 3. Scoring Formula Refinement (Medium Priority)

**Current state:** The RAR formula uses a fixed consistency multiplier range (0.5x–2.0x) and a fixed streak bonus (+10% per week, max 1.5x).

**Recommendations based on test findings:**

- **Lower the minimum trade threshold** for consistency from 5 trades to 3 trades — new traders felt penalized for having low trade counts even when their percentage return was strong
- **Add a volume floor** — require minimum $50 total notional volume per week to qualify for championship points, preventing micro-trade gaming
- **Cap leverage at 20x** instead of 50x for scoring — high leverage positions skew RAR scores significantly and discourage risk-appropriate trading
- **Add a PnL floor** — positions with less than $0.50 PnL should not count toward win rate calculations to filter dust trades

---

## 4. User Onboarding (Medium Priority)

**Test finding:** Several test participants were confused about the difference between opening a position on Adrena and seeing it appear on the leaderboard. The 60-second polling delay was unexpected.

**Recommendations:**
- Add a "Your trades are syncing..." indicator on the leaderboard when a wallet is registered but has no scores yet
- Add a tooltip explaining that only closed positions count toward RAR score
- Add a step-by-step onboarding modal on first wallet connection explaining: connect → trade on Adrena → close position → see your score

---

## 5. Mobile Experience (Medium Priority)

**Current state:** The app is responsive and functional on mobile. The bottom nav works well.

**Recommendations:**
- Add swipe gestures between league tabs on mobile
- Optimize the price ticker for mobile — currently requires horizontal scrolling
- Add haptic feedback on trade confirmation (if using a mobile wallet)

---

## 6. Social and Viral Features (Medium Priority)

**Current state:** Twitter/X share buttons exist on leaderboard rows. Referral system is built.

**Recommendations:**
- Add share cards with dynamic OG images per trader profile — so sharing your trader profile generates a preview image showing your rank and RAR score
- Add a "Challenge" feature — registered traders can challenge specific wallets to a head-to-head RAR comparison
- Add Discord integration — post leaderboard updates to a competition Discord channel automatically

---

## 7. Anti-Gaming Improvements (Low Priority)

**Current state:** Basic anti-gaming filters are in place (min collateral, min duration, leverage cap).

**Recommendations:**
- **Wash trading detection** — flag wallets that open and immediately close positions below a minimum PnL threshold repeatedly
- **Multi-wallet detection** — track IP addresses and flag suspiciously correlated wallets
- **Position size limits** — cap the maximum collateral that counts toward RAR at a reasonable multiple of the minimum (e.g., 100x minimum = $1,000 max scoring collateral)

---

## 8. Admin and Operations (Low Priority)

**Current state:** Admin panel supports session creation, raffle draws, and trader management.

**Recommendations:**
- Add bulk email/notification system to alert registered traders when a new session starts
- Add CSV export of leaderboard data for external analysis
- Add automatic session creation — configure a season schedule and sessions auto-create each week
- Add a public API endpoint so third parties can build on the competition data

---

## 9. Season 2 Planning

**Based on Season 1 test:**

- Keep Season 1 short (4 weeks) to validate the system before committing to a longer season
- Launch Season 2 with real RWA assets as soon as Adrena supports them
- Increase prize pool for Season 2 to attract more serious traders
- Partner with Autonom to co-market the competition — they have strong incentive to promote Autonom price feed adoption

---

## Summary Table

| Recommendation | Priority | Effort | Impact |
|---------------|----------|--------|--------|
| Activate RWA asset leagues | High | Low | Very High |
| QRNG raffle integration | High | Low | High |
| Lower consistency threshold | Medium | Low | Medium |
| Onboarding improvements | Medium | Medium | High |
| OG image share cards | Medium | Medium | Medium |
| Wash trade detection | Low | High | Medium |
| Automated session scheduling | Low | Medium | Low |
| Season 2 launch | — | High | Very High |
