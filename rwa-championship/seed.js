// Seed script - populates fake trader data for testing
// Run with: node seed.js

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://apqhtlzejknhilvyalso.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwcWh0bHplamtuaGlsdnlhbHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI1NTg3OCwiZXhwIjoyMDg4ODMxODc4fQ.dBjZaUGyDglakbSu7c_xLxym1mTijZBUwmPfqzstQgs'
)

const FAKE_WALLETS = [
  { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', name: 'CryptoHawk' },
  { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', name: 'GoldBull' },
  { address: 'So11111111111111111111111111111111111111112', name: 'TeslaTrader' },
  { address: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', name: 'NvidiaKing' },
  { address: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', name: 'OilMaster' },
  { address: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1', name: 'SilverFox' },
  { address: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', name: 'BasketCase' },
  { address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', name: 'AppleTrader' },
  { address: 'MangoCzJ36AjZyKwVeZVxvrm1W6oNuQHyA3MTKKbBSq', name: 'WheatKing' },
  { address: 'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT', name: 'CopperBull' },
]

const LEAGUES = ['equities', 'commodities', 'baskets']

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

async function seed() {
  console.log('🌱 Seeding test data...')

  // Get active session IDs
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, league')
    .eq('status', 'active')

  if (!sessions?.length) {
    console.error('❌ No active sessions found. Make sure schema.sql was run.')
    return
  }

  console.log(`Found ${sessions.length} active sessions`)

  // Insert traders
  for (const w of FAKE_WALLETS) {
    await supabase.from('traders').upsert({
      wallet_address: w.address,
      display_name: w.name,
      registered_at: new Date().toISOString(),
    }, { onConflict: 'wallet_address' })
  }
  console.log(`✅ Inserted ${FAKE_WALLETS.length} traders`)

  // Insert leaderboard scores for each session
  for (const session of sessions) {
    const sessionWallets = FAKE_WALLETS.slice(0, 8)

    for (let i = 0; i < sessionWallets.length; i++) {
      const wallet = sessionWallets[i]
      const tradeCount = Math.floor(randomBetween(5, 25))
      const winCount = Math.floor(tradeCount * randomBetween(0.35, 0.8))
      const winRate = winCount / tradeCount
      const totalCollateral = randomBetween(500, 50000)
      const pnlPercent = randomBetween(-15, 45)
      const totalPnl = (pnlPercent / 100) * totalCollateral
      const consistencyMultiplier = winRate >= 0.7 ? 2.0 : winRate >= 0.55 ? 1.5 : winRate >= 0.4 ? 1.0 : 0.7
      const streakBonus = randomBetween(1.0, 1.3)
      const rarScore = Math.max(0, pnlPercent * consistencyMultiplier * streakBonus)

      await supabase.from('leaderboard_scores').upsert({
        session_id: session.id,
        wallet_address: wallet.address,
        league: session.league,
        rar_score: rarScore,
        total_pnl_normalized: totalPnl,
        total_collateral: totalCollateral,
        trade_count: tradeCount,
        win_count: winCount,
        win_rate: winRate,
        consistency_multiplier: consistencyMultiplier,
        streak_bonus: streakBonus,
        championship_points: 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'session_id,wallet_address,league' })
    }

    // Rank them
    const { data: scores } = await supabase
      .from('leaderboard_scores')
      .select('id, rar_score')
      .eq('session_id', session.id)
      .eq('league', session.league)
      .order('rar_score', { ascending: false })

    for (let i = 0; i < (scores || []).length; i++) {
      const points = i === 0 ? 100 : i < 3 ? 75 : i < 10 ? 50 : 25
      await supabase
        .from('leaderboard_scores')
        .update({ rank: i + 1, championship_points: points })
        .eq('id', scores[i].id)
    }

    console.log(`✅ Seeded ${sessionWallets.length} scores for ${session.league} session`)
  }

  // Insert raffle entries
  for (const session of sessions) {
    for (const wallet of FAKE_WALLETS.slice(0, 8)) {
      const fees = randomBetween(10, 200)
      const entries = Math.floor(fees / 25)
      if (entries > 0) {
        await supabase.from('raffle_entries').upsert({
          session_id: session.id,
          wallet_address: wallet.address,
          entries,
          total_fees_paid: fees,
        }, { onConflict: 'session_id,wallet_address' })
      }
    }
  }
  console.log('✅ Seeded raffle entries')

  console.log('\n🎉 Done! Open https://adrena-rwa-championship.vercel.app to see the leaderboard.')
}

seed().catch(console.error)
