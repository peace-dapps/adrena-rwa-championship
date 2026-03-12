// Autonom API client
// Real API: api.autonom.cc — swap AUTONOM_API_KEY env var when received
// Falls back to realistic mock prices until API key is available

const AUTONOM_BASE = 'https://api.autonom.cc/v1'
const AUTONOM_API_KEY = process.env.AUTONOM_API_KEY || ''

// Asset classification map
const EQUITY_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META']
const COMMODITY_SYMBOLS = ['GOLD', 'SILVER', 'OIL', 'NATGAS', 'WHEAT', 'COPPER']
const BASKET_SYMBOLS = ['EV_METALS', 'SEMICONDUCTORS', 'FAANG', 'ENERGY_TRANSITION']
const CRYPTO_SYMBOLS = ['BTC', 'SOL', 'BONK', 'ETH']

// Market hours config (UTC)
const MARKET_HOURS: Record<string, { open: number; close: number; days: number[] }> = {
  equities: { open: 13.5, close: 20, days: [1, 2, 3, 4, 5] },   // NYSE 9:30–4pm EST
  commodities: { open: 22, close: 21, days: [0, 1, 2, 3, 4, 5] }, // CME ~22h (previous day open)
}

// Mock prices for development (replaced by Autonom API in production)
const MOCK_PRICES: Record<string, number> = {
  AAPL: 213.45, TSLA: 248.92, NVDA: 875.30, MSFT: 412.18,
  AMZN: 198.74, GOOGL: 175.23, META: 512.40,
  GOLD: 2340.50, SILVER: 28.75, OIL: 82.40, NATGAS: 2.18,
  WHEAT: 545.25, COPPER: 4.25,
  EV_METALS: 142.30, SEMICONDUCTORS: 287.90,
  BTC: 87400, SOL: 142.50, BONK: 0.000024, ETH: 3200,
}

export function classifyAsset(symbol: string): 'equities' | 'commodities' | 'baskets' | 'crypto' {
  const s = symbol.toUpperCase()
  if (EQUITY_SYMBOLS.includes(s)) return 'equities'
  if (COMMODITY_SYMBOLS.includes(s)) return 'commodities'
  if (BASKET_SYMBOLS.includes(s)) return 'baskets'
  return 'crypto'
}

export async function getNormalizedPrice(symbol: string): Promise<number> {
  if (AUTONOM_API_KEY) {
    try {
      const res = await fetch(`${AUTONOM_BASE}/prices/${symbol.toUpperCase()}`, {
        headers: {
          'Authorization': `Bearer ${AUTONOM_API_KEY}`,
          'Accept': 'application/json'
        }
      })
      if (res.ok) {
        const data = await res.json()
        // Autonom returns CAN-adjusted price
        return data.Price ?? data.price ?? MOCK_PRICES[symbol] ?? 0
      }
    } catch {
      // fall through to mock
    }
  }
  // Mock: add small random variation to simulate live prices
  const base = MOCK_PRICES[symbol.toUpperCase()] ?? 100
  return base * (1 + (Math.random() - 0.5) * 0.001)
}

export async function isMarketOpen(symbol: string, timestamp: string): Promise<boolean> {
  const league = classifyAsset(symbol)
  const date = new Date(timestamp)
  const dayOfWeek = date.getUTCDay() // 0=Sun, 6=Sat
  const hourUTC = date.getUTCHours() + date.getUTCMinutes() / 60

  if (AUTONOM_API_KEY) {
    try {
      const res = await fetch(`${AUTONOM_BASE}/hours/${symbol.toUpperCase()}`, {
        headers: { 'Authorization': `Bearer ${AUTONOM_API_KEY}` }
      })
      if (res.ok) {
        const data = await res.json()
        return data.status === 'open'
      }
    } catch {
      // fall through to local check
    }
  }

  // Local market hours check
  if (league === 'crypto') return true // crypto never closes
  const hours = league === 'equities' ? MARKET_HOURS.equities : MARKET_HOURS.commodities
  if (!hours.days.includes(dayOfWeek)) return false
  return hourUTC >= hours.open && hourUTC < hours.close
}

export async function getAllPrices(): Promise<Record<string, number>> {
  if (AUTONOM_API_KEY) {
    try {
      const res = await fetch(`${AUTONOM_BASE}/prices`, {
        headers: { 'Authorization': `Bearer ${AUTONOM_API_KEY}` }
      })
      if (res.ok) return res.json()
    } catch {}
  }
  return MOCK_PRICES
}
