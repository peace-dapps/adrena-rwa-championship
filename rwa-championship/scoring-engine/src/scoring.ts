import type { SupabaseClient } from '@supabase/supabase-js'

// ─── RAR FORMULA ─────────────────────────────────────────────────────────────
// RAR = (PnL_normalized / Collateral) × Consistency_multiplier × Streak_bonus
//
// Consistency_multiplier: 0.5x (win_rate<30%) → 2.0x (win_rate≥70%, ≥5 trades)
// Streak_bonus: +10% per active weekly streak (max 1.5x)
// Leverage cap: capped at 50x for scoring (100x leverage = same as 50x in RAR)

const MIN_TRADES_FOR_CONSISTENCY = 5
const MAX_SCORING_LEVERAGE = 50
const MIN_POSITION_DURATION_SECONDS = 60 // positions < 60s excluded from RAR

function getConsistencyMultiplier(winRate: number, tradeCount: number): number {
  if (tradeCount < MIN_TRADES_FOR_CONSISTENCY) return 0.8 // partial credit
  if (winRate >= 0.7) return 2.0
  if (winRate >= 0.55) return 1.5
  if (winRate >= 0.4) return 1.0
  if (winRate >= 0.3) return 0.7
  return 0.5
}

function getStreakBonus(streak: number): number {
  return Math.min(1.0 + streak * 0.1, 1.5)
}

function isQualifyingPosition(pos: {
  market_open_at_close: boolean
  entry_date: string
  exit_date: string
  collateral_amount: number
}): boolean {
  if (!pos.market_open_at_close) return false
  if (pos.collateral_amount < 50) return false // min $50 collateral

  const durationSeconds =
    (new Date(pos.exit_date).getTime() - new Date(pos.entry_date).getTime()) / 1000
  if (durationSeconds < MIN_POSITION_DURATION_SECONDS) return false

  return true
}

export async function updateLeaderboard(
  supabase: SupabaseClient,
  wallet: string,
  sessionId: string,
  league: string
) {
  // Fetch all scored qualifying positions for this wallet/session/league
  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .eq('wallet_address', wallet)
    .eq('session_id', sessionId)
    .eq('league', league)
    .eq('scored', true)
    .eq('market_open_at_close', true)

  if (!positions?.length) return

  const qualifying = positions.filter(isQualifyingPosition)
  if (!qualifying.length) return

  // Compute stats
  const totalPnlNormalized = qualifying.reduce((sum, p) => sum + (p.pnl_normalized ?? 0), 0)
  const totalCollateral = qualifying.reduce((sum, p) => sum + (p.collateral_amount ?? 0), 0)
  const totalFees = qualifying.reduce((sum, p) => sum + (p.fees ?? 0), 0)
  const winCount = qualifying.filter(p => (p.pnl_normalized ?? 0) > 0).length
  const winRate = qualifying.length > 0 ? winCount / qualifying.length : 0

  // Get streak
  const { data: streakRow } = await supabase
    .from('trader_streaks')
    .select('current_streak')
    .eq('wallet_address', wallet)
    .eq('league', league)
    .single()

  const streak = streakRow?.current_streak ?? 0

  // Compute multipliers
  const consistencyMultiplier = getConsistencyMultiplier(winRate, qualifying.length)
  const streakBonus = getStreakBonus(streak)

  // RAR score: percentage return × multipliers
  const pnlPercent = totalCollateral > 0 ? (totalPnlNormalized / totalCollateral) * 100 : 0
  const rarScore = pnlPercent * consistencyMultiplier * streakBonus

  // Championship points based on rank (updated after ranking pass)
  await supabase.from('leaderboard_scores').upsert({
    session_id: sessionId,
    wallet_address: wallet,
    league,
    rar_score: Math.max(0, rarScore), // floor at 0 for display
    total_pnl_normalized: totalPnlNormalized,
    total_collateral: totalCollateral,
    trade_count: qualifying.length,
    win_count: winCount,
    win_rate: winRate,
    consistency_multiplier: consistencyMultiplier,
    streak_bonus: streakBonus,
    updated_at: new Date().toISOString()
  }, { onConflict: 'session_id,wallet_address,league' })
}

export function computeRAR(
  pnlNormalized: number,
  collateral: number,
  winRate: number,
  tradeCount: number,
  streak: number
): number {
  const pnlPercent = collateral > 0 ? (pnlNormalized / collateral) * 100 : 0
  const consistency = getConsistencyMultiplier(winRate, tradeCount)
  const streakB = getStreakBonus(streak)
  return pnlPercent * consistency * streakB
}

// Championship points by rank
export function getChampionshipPoints(rank: number): number {
  if (rank === 1) return 100
  if (rank <= 3) return 75
  if (rank <= 10) return 50
  if (rank <= 25) return 25
  return 5
}
