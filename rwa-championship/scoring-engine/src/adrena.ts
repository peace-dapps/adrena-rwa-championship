const ADRENA_API = 'https://datapi.adrena.trade'

export interface AdrenaPosition {
  position_id: string
  user_id: string
  symbol: string
  side: 'long' | 'short'
  status: 'open' | 'closed'
  entry_price: number
  exit_price: number
  entry_size: number
  pnl: number
  entry_leverage: number
  entry_date: string
  exit_date: string
  fees: number
  collateral_amount: number
}

export async function fetchPositions(wallet: string, limit = 200): Promise<AdrenaPosition[]> {
  try {
    const res = await fetch(
      `${ADRENA_API}/position?user_wallet=${wallet}&limit=${limit}`,
      { headers: { 'Accept': 'application/json' } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (data.positions ?? [])
  } catch {
    return []
  }
}
