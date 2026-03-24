'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type League = 'equities' | 'commodities' | 'baskets' | 'overall'

const LEAGUE_CONFIG = {
  overall:     { label: 'Overall',     color: 'var(--accent-green)',  border: 'rgba(0,212,170,0.2)',   bg: 'rgba(0,212,170,0.06)'   },
  equities:    { label: 'Equities',    color: 'var(--accent-green)',  border: 'rgba(0,212,170,0.2)',   bg: 'rgba(0,212,170,0.06)'   },
  commodities: { label: 'Commodities', color: 'var(--accent-orange)', border: 'rgba(245,166,35,0.2)',  bg: 'rgba(245,166,35,0.06)'  },
  baskets:     { label: 'Baskets',     color: 'var(--accent-purple)', border: 'rgba(176,110,255,0.2)', bg: 'rgba(176,110,255,0.06)' },
}

const LEAGUE_ICONS = {
  overall: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  equities: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  commodities: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  baskets: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/>
      <rect x="2" y="14" width="7" height="7"/><rect x="15" y="14" width="7" height="7"/>
    </svg>
  ),
}

function truncate(w: string) { return `${w.slice(0,4)}...${w.slice(-4)}` }

function Badge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: '1.2rem' }}>🥇</span>
  if (rank === 2) return <span style={{ fontSize: '1.2rem' }}>🥈</span>
  if (rank === 3) return <span style={{ fontSize: '1.2rem' }}>🥉</span>
  return <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>#{rank}</span>
}

export default function SeasonPage() {
  const router = useRouter()
  const [league, setLeague] = useState<League>('overall')
  const [seasonData, setSeasonData] = useState<any[]>([])
  const [season, setSeason] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const cfg = LEAGUE_CONFIG[league]

  useEffect(() => {
    async function load() {
      setLoading(true)

      // Get active season
      const { data: seasonRow } = await supabase
        .from('seasons')
        .select('*')
        .eq('status', 'active')
        .single()

      setSeason(seasonRow)
      if (!seasonRow) { setLoading(false); return }

      if (league === 'overall') {
        // Aggregate all leagues per wallet
        const { data: allScores } = await supabase
          .from('leaderboard_scores')
          .select('wallet_address, rar_score, championship_points, trade_count, win_rate')

        if (!allScores) { setSeasonData([]); setLoading(false); return }

        // Group by wallet
        const map: Record<string, any> = {}
        for (const s of allScores) {
          if (!map[s.wallet_address]) {
            map[s.wallet_address] = { wallet_address: s.wallet_address, total_rar: 0, total_points: 0, total_trades: 0, sessions: 0 }
          }
          map[s.wallet_address].total_rar += s.rar_score || 0
          map[s.wallet_address].total_points += s.championship_points || 0
          map[s.wallet_address].total_trades += s.trade_count || 0
          map[s.wallet_address].sessions += 1
        }

        const sorted = Object.values(map)
          .sort((a: any, b: any) => b.total_points - a.total_points)
          .map((row: any, i) => ({ ...row, rank: i + 1 }))

        setSeasonData(sorted)
      } else {
        // Per-league season aggregate
        const { data: scores } = await supabase
          .from('leaderboard_scores')
          .select('wallet_address, rar_score, championship_points, trade_count, win_rate, streak_bonus')
          .eq('league', league)

        if (!scores) { setSeasonData([]); setLoading(false); return }

        const map: Record<string, any> = {}
        for (const s of scores) {
          if (!map[s.wallet_address]) {
            map[s.wallet_address] = { wallet_address: s.wallet_address, total_rar: 0, total_points: 0, total_trades: 0, sessions: 0, best_rar: 0 }
          }
          map[s.wallet_address].total_rar += s.rar_score || 0
          map[s.wallet_address].total_points += s.championship_points || 0
          map[s.wallet_address].total_trades += s.trade_count || 0
          map[s.wallet_address].sessions += 1
          map[s.wallet_address].best_rar = Math.max(map[s.wallet_address].best_rar, s.rar_score || 0)
        }

        const sorted = Object.values(map)
          .sort((a: any, b: any) => b.total_points - a.total_points)
          .map((row: any, i) => ({ ...row, rank: i + 1 }))

        setSeasonData(sorted)
      }

      setLoading(false)
    }
    load()
  }, [league])

  const topTrader = seasonData[0]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.62rem', letterSpacing: '0.12em', color: cfg.color, padding: '3px 8px', border: `1px solid ${cfg.color}40`, borderRadius: 3, display: 'inline-block', marginBottom: 10 }}>
            SEASON 1 · EXPANSE
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.6rem,7vw,2.8rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>
            Season <span style={{ color: cfg.color }}>Standings</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', fontFamily: "'Space Mono',monospace" }}>
            Cumulative championship points across all weekly sessions
          </p>
        </div>

        {/* Leader spotlight */}
        {topTrader && (
          <div style={{ padding: '20px 24px', borderRadius: 12, background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: '2rem' }}>🥇</span>
              <div>
                <div style={{ fontSize: '0.65rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>CURRENT LEADER</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '1rem', fontWeight: 700 }}>{truncate(topTrader.wallet_address)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'POINTS', value: topTrader.total_points },
                { label: 'TOTAL RAR', value: `${topTrader.total_rar.toFixed(1)}%` },
                { label: 'SESSIONS', value: topTrader.sessions },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.6rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{s.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: cfg.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* League tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {(Object.entries(LEAGUE_CONFIG) as [League, typeof LEAGUE_CONFIG.overall][]).map(([key, c]) => (
            <button key={key} onClick={() => setLeague(key)} style={{
              padding: '8px 14px', borderRadius: 8, flexShrink: 0,
              border: `1px solid ${key === league ? c.color : 'var(--border)'}`,
              background: key === league ? c.bg : 'var(--bg-card)',
              color: key === league ? c.color : 'var(--text-muted)',
              fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.82rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s',
            }}>
              <span style={{ color: key === league ? c.color : 'var(--text-muted)' }}>{LEAGUE_ICONS[key]}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${cfg.border}`, background: 'var(--bg-card)' }}>
          {/* Desktop header */}
          <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 100px 110px 80px 80px', padding: '10px 16px', background: cfg.bg, borderBottom: `1px solid ${cfg.border}`, fontSize: '0.6rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
            <span>RANK</span>
            <span>TRADER</span>
            <span style={{ textAlign: 'right' }}>POINTS</span>
            <span style={{ textAlign: 'right' }}>TOTAL RAR</span>
            <span style={{ textAlign: 'right' }}>TRADES</span>
            <span style={{ textAlign: 'right' }}>SESSIONS</span>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem' }}>Loading...</div>
          ) : seasonData.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem' }}>No data yet. Compete in weekly sessions to earn points.</div>
          ) : seasonData.map((row, i) => (
            <div
              key={row.wallet_address}
              onClick={() => router.push(`/trader/${row.wallet_address}`)}
              style={{ padding: '0 16px', borderBottom: i < seasonData.length - 1 ? '1px solid var(--border)' : 'none', background: i < 3 ? cfg.bg : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 100px 110px 80px 80px', alignItems: 'center', padding: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}><Badge rank={row.rank} /></div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {truncate(row.wallet_address)}
                </div>
                <div style={{ textAlign: 'right', fontFamily: "'Space Mono',monospace", fontSize: '1rem', fontWeight: 700, color: cfg.color }}>
                  {row.total_points}
                </div>
                <div style={{ textAlign: 'right', fontFamily: "'Space Mono',monospace", fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {row.total_rar.toFixed(1)}%
                </div>
                <div style={{ textAlign: 'right', fontFamily: "'Space Mono',monospace", fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {row.total_trades}
                </div>
                <div style={{ textAlign: 'right', fontFamily: "'Space Mono',monospace", fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {row.sessions}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Points guide */}
        <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.65rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>CHAMPIONSHIP POINTS GUIDE</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { rank: '1st', pts: '100 pts' },
              { rank: '2nd–3rd', pts: '75 pts' },
              { rank: '4th–10th', pts: '50 pts' },
              { rank: '11th–25th', pts: '25 pts' },
              { rank: 'All others', pts: '5 pts' },
            ].map(item => (
              <div key={item.rank} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.rank}</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', color: cfg.color, fontWeight: 700 }}>{item.pts}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
