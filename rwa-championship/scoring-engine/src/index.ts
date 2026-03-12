import { createClient } from '@supabase/supabase-js'
import { fetchPositions } from './adrena'
import { getNormalizedPrice, isMarketOpen, classifyAsset } from './autonom'
import { computeRAR, updateLeaderboard } from './scoring'
import { updateRaffleEntries } from './raffle'

const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!
const POLL_INTERVAL_MS = 60_000 // 60 seconds

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function getActiveSessionWallets(): Promise<{ wallet: string; sessionId: string; league: string }[]> {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, league')
    .eq('status', 'active')

  if (!sessions?.length) return []

  const { data: traders } = await supabase
    .from('traders')
    .select('wallet_address')

  if (!traders?.length) return []

  return sessions.flatMap(s =>
    traders.map(t => ({ wallet: t.wallet_address, sessionId: s.id, league: s.league }))
  )
}

async function processWallet(wallet: string, sessionId: string, league: string) {
  // 1. Fetch positions from Adrena
  const positions = await fetchPositions(wallet)
  const closedPositions = positions.filter(p => p.status === 'closed')

  for (const pos of closedPositions) {
    // 2. Skip already scored
    const { data: existing } = await supabase
      .from('positions')
      .select('id, scored')
      .eq('id', pos.position_id)
      .single()

    if (existing?.scored) continue

    // 3. Classify asset to league
    const assetLeague = classifyAsset(pos.symbol)
    if (assetLeague !== league) continue

    // 4. Check market hours at time of close
    const marketOpen = await isMarketOpen(pos.symbol, pos.exit_date)

    // 5. Get CAN-normalized exit price
    const normalizedPrice = await getNormalizedPrice(pos.symbol)
    const pnlNormalized = pos.side === 'long'
      ? (normalizedPrice - pos.entry_price) / pos.entry_price * pos.collateral_amount * pos.entry_leverage
      : (pos.entry_price - normalizedPrice) / pos.entry_price * pos.collateral_amount * pos.entry_leverage

    // 6. Upsert position record
    await supabase.from('positions').upsert({
      id: pos.position_id,
      wallet_address: wallet,
      symbol: pos.symbol,
      league: assetLeague,
      side: pos.side,
      status: 'closed',
      entry_price: pos.entry_price,
      exit_price: pos.exit_price,
      exit_price_normalized: normalizedPrice,
      entry_size: pos.entry_size,
      collateral_amount: pos.collateral_amount,
      pnl: pos.pnl,
      pnl_normalized: pnlNormalized,
      entry_leverage: pos.entry_leverage,
      entry_date: pos.entry_date,
      exit_date: pos.exit_date,
      fees: pos.fees,
      market_open_at_close: marketOpen,
      scored: true,
      session_id: sessionId
    })

    // 7. Update raffle entries
    await updateRaffleEntries(supabase, wallet, sessionId, pos.fees)
  }

  // 8. Recompute leaderboard score for this wallet/session/league
  await updateLeaderboard(supabase, wallet, sessionId, league)
}

async function rankLeaderboard(sessionId: string, league: string) {
  const { data: scores } = await supabase
    .from('leaderboard_scores')
    .select('id, rar_score')
    .eq('session_id', sessionId)
    .eq('league', league)
    .order('rar_score', { ascending: false })

  if (!scores) return

  for (let i = 0; i < scores.length; i++) {
    await supabase
      .from('leaderboard_scores')
      .update({ rank: i + 1 })
      .eq('id', scores[i].id)
  }
}

async function runCycle() {
  console.log(`[${new Date().toISOString()}] Starting scoring cycle...`)

  try {
    const walletSessions = await getActiveSessionWallets()

    if (!walletSessions.length) {
      console.log('No active sessions or traders. Skipping.')
      return
    }

    // Process wallets (batched to avoid rate limits)
    const BATCH_SIZE = 5
    for (let i = 0; i < walletSessions.length; i += BATCH_SIZE) {
      const batch = walletSessions.slice(i, i + BATCH_SIZE)
      await Promise.allSettled(
        batch.map(({ wallet, sessionId, league }) =>
          processWallet(wallet, sessionId, league).catch(err =>
            console.error(`Error processing ${wallet}:`, err.message)
          )
        )
      )
    }

    // Re-rank all active sessions
    const { data: activeSessions } = await supabase
      .from('sessions')
      .select('id, league')
      .eq('status', 'active')

    for (const session of activeSessions || []) {
      await rankLeaderboard(session.id, session.league)
    }

    console.log(`[${new Date().toISOString()}] Cycle complete. Processed ${walletSessions.length} wallet-sessions.`)
  } catch (err) {
    console.error('Cycle error:', err)
  }
}

// Start
console.log('RWA Championship Scoring Engine starting...')
runCycle()
setInterval(runCycle, POLL_INTERVAL_MS)
