'use client'

import { useState, useEffect, useRef } from 'react'

const FEED_IDS: Record<string, number> = {
  AAPL: 1030, TSLA: 1029, NVDA: 1022, MSFT: 1002,
  GOLD: 2056, OIL: 2003, NATGAS: 2025, SILVER: 2069,
}

const LEAGUE_ASSETS: Record<string, string[]> = {
  equities:    ['AAPL', 'TSLA', 'NVDA', 'MSFT'],
  commodities: ['GOLD', 'OIL', 'SILVER', 'NATGAS'],
  baskets:     ['GOLD', 'SILVER'],
}

const DISPLAY_NAMES: Record<string, string> = {
  GOLD: 'XAU', NATGAS: 'NATGAS', SILVER: 'XAG', OIL: 'OIL',
}

const FALLBACK: Record<string, number> = {
  AAPL: 254.32, TSLA: 397.79, NVDA: 183.13, MSFT: 399.96,
  GOLD: 5020.37, OIL: 97.20, SILVER: 81.03, NATGAS: 3.02,
}

interface PriceData {
  symbol: string
  price: number
  change: number
}

function parseAutonomPrice(raw: number, expo: number): number {
  return raw * Math.pow(10, expo)
}

export default function PriceTicker({ league }: { league: string }) {
  const [prices, setPrices] = useState<PriceData[]>([])
  const prevPricesRef = useRef<Record<string, number>>({})
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  async function fetchPrices() {
    const assets = LEAGUE_ASSETS[league] || []
    const feedIds = assets.map(s => FEED_IDS[s]).filter(Boolean).join(',')

    try {
      const res = await fetch(`/api/prices?feed_ids=${feedIds}`)
      if (res.ok) {
        const data = await res.json()

        // Autonom returns { prices: [{ feed_id, price, expo, timestamp }] }
        const priceMap: Record<number, number> = {}
        if (data.prices && Array.isArray(data.prices)) {
          for (const item of data.prices) {
            if (item.feed_id && item.price !== undefined && item.expo !== undefined) {
              priceMap[item.feed_id] = parseAutonomPrice(item.price, item.expo)
            }
          }
        }

        const updated: PriceData[] = assets.map(symbol => {
          const feedId = FEED_IDS[symbol]
          const price = priceMap[feedId] ?? FALLBACK[symbol] ?? 100
          const prev = prevPricesRef.current[symbol] || price
          const change = prev > 0 ? ((price - prev) / prev) * 100 : 0
          prevPricesRef.current[symbol] = price
          return { symbol, price, change }
        })

        setPrices(updated)
        return
      }
    } catch {}

    // Fallback
    const updated = (LEAGUE_ASSETS[league] || []).map(symbol => {
      const price = FALLBACK[symbol] || 100
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
            {Math.abs(p.change).toFixed(3)}%
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
