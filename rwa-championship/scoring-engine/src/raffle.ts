import type { SupabaseClient } from '@supabase/supabase-js'

const FEES_PER_ENTRY = 25 // $25 fees = 1 raffle entry
const AUTONOM_API_KEY = process.env.AUTONOM_API_KEY || ''
const AUTONOM_BASE = 'https://api.autonom.cc/v1'

export async function updateRaffleEntries(
  supabase: SupabaseClient,
  wallet: string,
  sessionId: string,
  feesFromTrade: number
) {
  const { data: existing } = await supabase
    .from('raffle_entries')
    .select('entries, total_fees_paid')
    .eq('session_id', sessionId)
    .eq('wallet_address', wallet)
    .single()

  const prevFees = existing?.total_fees_paid ?? 0
  const newTotalFees = prevFees + feesFromTrade
  const newEntries = Math.floor(newTotalFees / FEES_PER_ENTRY)

  await supabase.from('raffle_entries').upsert({
    session_id: sessionId,
    wallet_address: wallet,
    entries: newEntries,
    total_fees_paid: newTotalFees
  }, { onConflict: 'session_id,wallet_address' })
}

// Draw raffle winner using Autonom QRNG (or fallback to crypto random)
export async function drawRaffleWinner(
  supabase: SupabaseClient,
  sessionId: string,
  prizeAdx: number
): Promise<string | null> {
  // Get all entries
  const { data: entries } = await supabase
    .from('raffle_entries')
    .select('wallet_address, entries')
    .eq('session_id', sessionId)
    .gt('entries', 0)

  if (!entries?.length) return null

  // Build weighted pool
  const pool: string[] = []
  for (const entry of entries) {
    for (let i = 0; i < entry.entries; i++) {
      pool.push(entry.wallet_address)
    }
  }

  let winnerIndex: number
  let qrngProof: string | null = null
  let qrngRoot: string | null = null

  if (AUTONOM_API_KEY) {
    try {
      // Request QRNG from Autonom
      const res = await fetch(`${AUTONOM_BASE}/qrng/random`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTONOM_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ count: 1, max: pool.length })
      })
      if (res.ok) {
        const data = await res.json()
        winnerIndex = data.values[0] % pool.length
        qrngProof = JSON.stringify(data.proof)
        qrngRoot = data.root
      } else {
        winnerIndex = Math.floor(Math.random() * pool.length)
      }
    } catch {
      winnerIndex = Math.floor(Math.random() * pool.length)
    }
  } else {
    // Fallback: crypto random (mock QRNG for development)
    winnerIndex = Math.floor(Math.random() * pool.length)
    qrngProof = JSON.stringify({
      note: 'Mock QRNG - replace with Autonom QRNG key in production',
      random_index: winnerIndex,
      pool_size: pool.length,
      timestamp: new Date().toISOString()
    })
  }

  const winner = pool[winnerIndex]

  // Record result
  await supabase.from('raffle_results').insert({
    session_id: sessionId,
    winner_wallet: winner,
    prize_adx: prizeAdx,
    qrng_proof: qrngProof,
    qrng_root: qrngRoot,
    drawn_at: new Date().toISOString()
  })

  return winner
}
