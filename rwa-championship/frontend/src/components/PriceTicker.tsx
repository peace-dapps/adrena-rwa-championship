'use client'

import { useState, useEffect, useRef } from 'react'

// Mock prices — will be replaced by Autonom API when key arrives
const MOCK_PRICES: Record<string, { price: number; change: number }> = {
  AAPL:          { price: 213.45, change: 1.2  },
  TSLA:          { price: 248.92, change: -2.4 },
  NVDA:          { price: 875.30, change: 3.1  },
  MSFT:          { price: 412.18, change: 0.8  },
  GOLD:          { price: 2340.5, change: 0.4  },
  OIL:           { price: 82.40,  change: -1.1 },
  SILVER:        { price: 28.75,  change: 0.6  },
  NATGAS:        { price: 2.18,   change: -0.9 },
  EV_METALS:     { price: 142.30, change: 1.8  },
  SEMICONDUCTORS:{ price: 287.90, change: 2.3  },
}

const LEAGUE_ASSETS: Record<string, string[]> = {
  equities:    ['AAPL', 'TSLA', 'NVDA', 'MSFT'],
  commodities: ['GOLD', 'OIL', 'SILVER', 'NATGAS'],
  baskets:     ['EV_METALS', 'SEMICONDUCTORS'],
}

const DISPLAY_NAMES: Record<string, string> = {
  EV_METALS: 'EV METALS',
  SEMICONDUCTORS: 'SEMIS',
}

interface PriceData {
  symbol: string
  price: number
  change: number
}

export default function PriceTicker({ league }: { league: string }) {
  const [prices, setPrices] = useState<PriceData[]>([])
  const intervalRef = useRef<NodeJS.Timeout>()

  function fetchPrices() {
    const assets = LEAGUE_ASSETS[league] || []
    const updated = assets.map(symbol => {
      const base = MOCK_PRICES[symbol] || { price: 100, change: 0 }
      // Simulate small price movements
      const jitter = (Math.random() - 0.5) * 0.002
      return {
        symbol,
        price: base.price * (1 + jitter),
        change: base.change + (Math.random() - 0.5) * 0.2,
      }
    })
    setPrices(updated)
  }

  useEffect(() => {
    fetchPrices()
    intervalRef.current = setInterval(fetchPrices, 15000) // update every 15s
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [league])

  if (!prices.length) return null

  return (
    <div style={{
      display: 'flex',
      gap: 0,
      overflowX: 'auto',
      scrollbarWidth: 'none',
      borderRadius: 8,
      border: '1px solid var(--border)',
      background: 'var(--bg-card)',
      marginBottom: 16,
    }}>
      <style>{`.price-ticker::-webkit-scrollbar{display:none}`}</style>
      {prices.map((p, i) => (
        <div
          key={p.symbol}
          style={{
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
            borderRight: i < prices.length - 1 ? '1px solid var(--border)' : 'none',
          }}
        >
          <span style={{
            fontFamily: "'Space Mono',monospace",
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
          }}>
            {DISPLAY_NAMES[p.symbol] || p.symbol}
          </span>
          <span style={{
            fontFamily: "'Space Mono',monospace",
            fontSize: '0.82rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            ${p.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span style={{
            fontFamily: "'Space Mono',monospace",
            fontSize: '0.7rem',
            fontWeight: 600,
            color: p.change >= 0 ? 'var(--positive)' : 'var(--negative)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            {p.change >= 0 ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            )}
            {Math.abs(p.change).toFixed(2)}%
          </span>
        </div>
      ))}
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        marginLeft: 'auto',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: "'Space Mono',monospace",
          fontSize: '0.58rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
        }}>
          AUTONOM · LIVE
        </span>
      </div>
    </div>
  )
}
