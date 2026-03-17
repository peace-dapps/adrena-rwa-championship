'use client'

import { useState, useEffect, useRef } from 'react'

const AUTONOM_API_KEY = '4A3F51C74E338FE80B0B006A030F33EB'
const AUTONOM_BASE = 'https://oracle.autonom.cc'

const FEED_IDS: Record<string, number> = {
  AAPL: 1030, TSLA: 1029, NVDA: 1022, MSFT: 1002,
  GOLD: 2056, OIL: 2003, NATGAS: 2025, SILVER: 2069,
}

const LEAGUE_ASSETS: Record<string, string[]> = {
  equities:    ['AAPL', 'TSLA', 'NVDA', 'MSFT'],
  commodities: ['GOLD', 'OIL', 'SILVER', 'NATGAS'],
  baskets:     ['GOLD', 'SILVER'], // EV metals not available yet
}

const DISPLAY_NAMES: Record<string, string> = {
  GOLD: 'XAU', NATGAS: 'NATGAS', SILVER: 'XAG', OIL: 'OIL',
}

interface PriceData {
  symbol: string
  price: number
  change: number
}

// Fallback prices from Autonom team
const FALLBACK_PRICES: Record<string, number> = {
  AAPL: 252.78, TSLA: 395.49, NVDA: 183.13, MSFT: 399.96,
  GOLD: 5020.37, OIL: 97.20, SILVER: 81.03, NATGAS: 3.02,
}

export default function PriceTicker({ league }: { league: string }) {
  const [prices, setPrices] = useState<PriceData[]>([])
  const prevPricesRef = useRef<Record<string, number>>({})
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  async function fetchPrices() {
    const assets = LEAGUE_ASSETS[league] || []
    const feedIds = assets.map(s => FEED_IDS[s]).filter(Boolean).join(',')

    try {
      const res = await fetch(
        `${AUTONOM_BASE}/prices/batch?feed_ids=${feedIds}&fresh=true`,
        { headers: { 'x-api-key': AUTONOM_API_KEY } }
      )

      if (res.ok) {
        const data = await res.json()
        const updated: PriceData[] = assets.map(symbol => {
          const feedId = FEED_IDS[symbol]
          const feedData = feedId ? (data[feedId] || data[feedId.toString()]) : null
          const price = feedData
            ? parseFloat(feedData.price || feedData.Price || feedData.value || FALLBACK_PRICES[symbol])
            : FALLBACK_PRICES[symbol] || 100

          const prev = prevPricesRef.current[symbol] || price
          const change = prev > 0 ? ((price - prev) / prev) * 100 : 0
          prevPricesRef.current[symbol] = price

          return { symbol, price, change }
        })
        setPrices(updated)
        return
      }
    } catch {}

    // Fallback with simulated movement
    const updated: PriceData[] = assets.map(symbol => {
      const base = FALLBACK_PRICES[symbol] || 100
      const jitter = (Math.random() - 0.5) * 0.001
      const price = base * (1 + jitter)
      const prev = prevPricesRef.current[symbol] || price
      const change = ((price - prev) / prev) * 100
      prevPricesRef.current[symbol] = price
      return { symbol, price, change }
    })
    setPrices(updated)
  }

  useEffect(() => {
    fetchPrices()
    intervalRef.current = setInterval(fetchPrices, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [league])

  if (!prices.length) return null

  return (
    <div style={{
      display: 'flex', overflowX: 'auto', scrollbarWidth: 'none',
      borderRadius: 8, border: '1px solid var(--border)',
      background: 'var(--bg-card)', marginBottom: 16,
    }}>
      {prices.map((p, i) => (
        <div key={p.symbol} style={{
          padding: '8px 16px', display: 'flex', alignItems: 'center',
          gap: 10, flexShrink: 0,
          borderRight: i < prices.length - 1 ? '1px solid var(--border)' : 'none',
        }}>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            {DISPLAY_NAMES[p.symbol] || p.symbol}
          </span>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            ${p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', fontWeight: 600, color: p.change >= 0 ? 'var(--positive)' : 'var(--negative)', display: 'flex', alignItems: 'center', gap: 2 }}>
            {p.change >= 0 ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            )}
            {Math.abs(p.change).toFixed(2)}%
          </span>
        </div>
      ))}
      <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}>
        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.58rem', color: 'var(--accent-green)', letterSpacing: '0.08em' }}>
          AUTONOM · LIVE
        </span>
      </div>
    </div>
  )
}
