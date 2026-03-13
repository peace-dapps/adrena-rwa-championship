'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import WalletButton from '../components/WalletButton'

type League = 'equities' | 'commodities' | 'baskets'

interface LeaderboardEntry {
  rank: number
  wallet_address: string
  rar_score: number
  total_pnl_normalized: number
  trade_count: number
  win_rate: number
  consistency_multiplier: number
  streak_bonus: number
  championship_points: number
}

interface SessionInfo {
  id: string
  league: League
  status: string
  start_time: string
  end_time: string
  week_number: number
}

const LEAGUE_CONFIG = {
  equities: {
    label: 'Equities',
    icon: '📈',
    desc: 'AAPL · TSLA · NVDA',
    color: '#00D4AA',
    glow: '0 0 30px rgba(0,212,170,0.3)',
    bg: 'rgba(0,212,170,0.06)',
    border: 'rgba(0,212,170,0.2)',
  },
  commodities: {
    label: 'Commodities',
    icon: '⚡',
    desc: 'GOLD · OIL · SILVER',
    color: '#F5A623',
    glow: '0 0 30px rgba(245,166,35,0.3)',
    bg: 'rgba(245,166,35,0.06)',
    border: 'rgba(245,166,35,0.2)',
  },
  baskets: {
    label: 'Baskets',
    icon: '🧺',
    desc: 'EV METALS · SEMIS',
    color: '#B06EFF',
    glow: '0 0 30px rgba(176,110,255,0.3)',
    bg: 'rgba(176,110,255,0.06)',
    border: 'rgba(176,110,255,0.2)',
  },
}

function truncateWallet(wallet: string) {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
}

function formatPnl(pnl: number) {
  const sign = pnl >= 0 ? '+' : ''
  return `${sign}$${Math.abs(pnl).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function RankBadge({ rank }: { rank: number }) {
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }
  if (medals[rank]) return (
    <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{medals[rank]}</span>
  )
  return (
    <span style={{
      fontFamily: 'monospace', fontSize: '0.9rem',
      color: '#666', fontWeight: 700, minWidth: 24, textAlign: 'center'
    }}>#{rank}</span>
  )
}

function MarketStatus({ session }: { session: SessionInfo | null }) {
  if (!session) return null
  const isActive = session.status === 'active'
  const end = new Date(session.end_time)
  const now = new Date()
  const diff = end.getTime() - now.getTime()
  const hours = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', borderRadius: 999,
      background: isActive ? 'rgba(0,212,170,0.1)' : 'rgba(255,80,80,0.1)',
      border: `1px solid ${isActive ? 'rgba(0,212,170,0.3)' : 'rgba(255,80,80,0.3)'}`,
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: isActive ? '#00D4AA' : '#FF5050',
        boxShadow: isActive ? '0 0 8px #00D4AA' : '0 0 8px #FF5050',
        animation: isActive ? 'pulse 2s infinite' : 'none'
      }} />
      <span style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', color: isActive ? '#00D4AA' : '#FF5050' }}>
        {isActive ? `MARKET OPEN · ${hours}h ${mins}m left` : 'MARKET CLOSED'}
      </span>
    </div>
  )
}

export default function LeaderboardPage() {
  const [league, setLeague] = useState<League>('equities')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const config = LEAGUE_CONFIG[league]

  const loadData = useCallback(async () => {
    // Get active session for this league
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('league', league)
      .in('status', ['active', 'market_closed'])
      .order('week_number', { ascending: false })
      .limit(1)
      .single()

    if (!sessionData) { setEntries([]); setSession(null); setLoading(false); return }
    setSession(sessionData)

    // Get leaderboard
    const { data: scores } = await supabase
      .from('leaderboard_scores')
      .select('*')
      .eq('session_id', sessionData.id)
      .eq('league', league)
      .order('rar_score', { ascending: false })
      .limit(50)

    setEntries(scores || [])
    setLastUpdated(new Date())
    setLoading(false)
  }, [league])

  useEffect(() => {
    setLoading(true)
    loadData()

    // Realtime subscription
    const channel = supabase
      .channel(`leaderboard:${league}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'leaderboard_scores',
        filter: `league=eq.${league}`
      }, () => loadData())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [league, loadData])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080B10; color: #E8EAF0; font-family: 'Syne', sans-serif; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanline {
          0%{transform:translateY(-100%)}
          100%{transform:translateY(100vh)}
        }
        .row-enter { animation: fadeSlideIn 0.3s ease forwards; }
        .tab-btn { background:none; border:none; cursor:pointer; transition: all 0.2s; }
        .tab-btn:hover { opacity:0.8; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#080B10', position: 'relative', overflow: 'hidden' }}>

        {/* Background grid */}
        <div style={{
          position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          pointerEvents: 'none'
        }} />

        {/* Glow orb */}
        <div style={{
          position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
          background: `radial-gradient(circle, ${config.color}18 0%, transparent 70%)`,
          transition: 'background 0.5s ease'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px' }}>

          {/* ── HEADER ── */}
          <div style={{ paddingTop: 40, paddingBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: '0.7rem',
                  letterSpacing: '0.15em', color: config.color,
                  padding: '3px 10px', border: `1px solid ${config.color}40`,
                  borderRadius: 3
                }}>
                  ADRENA × AUTONOM
                </div>
              </div>
              <MarketStatus session={session} />
<WalletButton />
            </div>

            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05,
              marginBottom: 6
            }}>
              RWA <span style={{ color: config.color }}>Championship</span>
            </h1>
            <p style={{ color: '#888', fontSize: '0.9rem', fontFamily: "'Space Mono', monospace" }}>
              Season 1 · Week {session?.week_number ?? 1} · Risk-adjusted returns, not raw capital
            </p>
          </div>

          {/* ── LEAGUE TABS ── */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            {(Object.entries(LEAGUE_CONFIG) as [League, typeof LEAGUE_CONFIG.equities][]).map(([key, cfg]) => (
              <button
                key={key}
                className="tab-btn"
                onClick={() => setLeague(key)}
                style={{
                  padding: '10px 20px', borderRadius: 8,
                  border: `1px solid ${key === league ? cfg.color : 'rgba(255,255,255,0.08)'}`,
                  background: key === league ? cfg.bg : 'rgba(255,255,255,0.03)',
                  color: key === league ? cfg.color : '#888',
                  fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  fontSize: '0.85rem', letterSpacing: '0.03em',
                  boxShadow: key === league ? cfg.glow : 'none',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                <span style={{ fontSize: '0.72rem', opacity: 0.7, fontFamily: "'Space Mono', monospace" }}>
                  {cfg.desc}
                </span>
              </button>
            ))}
          </div>

          {/* ── STATS BAR ── */}
          {session && (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: 12, marginBottom: 28
            }}>
              {[
                { label: 'TRADERS', value: entries.length },
                { label: 'TOP RAR', value: entries[0] ? `${entries[0].rar_score.toFixed(2)}%` : '—' },
                { label: 'WEEK', value: `#${session.week_number}` },
                { label: 'UPDATED', value: lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
              ].map(stat => (
                <div key={stat.label} style={{
                  padding: '14px 18px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <div style={{ fontSize: '0.65rem', fontFamily: "'Space Mono', monospace", color: '#555', letterSpacing: '0.12em', marginBottom: 4 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: config.color }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── TABLE ── */}
          <div style={{
            borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${config.border}`,
            background: 'rgba(255,255,255,0.02)'
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 120px 100px 80px 80px 90px',
              padding: '12px 20px',
              background: config.bg,
              borderBottom: `1px solid ${config.border}`,
              fontSize: '0.65rem', fontFamily: "'Space Mono', monospace",
              color: '#666', letterSpacing: '0.1em'
            }}>
              <span>RANK</span>
              <span>TRADER</span>
              <span style={{ textAlign: 'right' }}>RAR SCORE</span>
              <span style={{ textAlign: 'right' }}>PNL</span>
              <span style={{ textAlign: 'right' }}>TRADES</span>
              <span style={{ textAlign: 'right' }}>WIN%</span>
              <span style={{ textAlign: 'right' }}>POINTS</span>
            </div>

            {/* Rows */}
            {loading ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#444', fontFamily: "'Space Mono', monospace", fontSize: '0.8rem' }}>
                Loading leaderboard...
              </div>
            ) : entries.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center', color: '#444', fontFamily: "'Space Mono', monospace", fontSize: '0.8rem' }}>
                No trades yet. Be the first to compete.
              </div>
            ) : (
              entries.map((entry, i) => (
                <div
                  key={entry.wallet_address}
                  className="row-enter"
                  style={{
                    animationDelay: `${i * 0.04}s`,
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 120px 100px 80px 80px 90px',
                    padding: '14px 20px',
                    borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: i < 3 ? `${config.bg}` : 'transparent',
                    alignItems: 'center',
                    transition: 'background 0.2s'
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <RankBadge rank={entry.rank ?? i + 1} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.85rem', fontWeight: 700 }}>
                      {truncateWallet(entry.wallet_address)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#555', marginTop: 2 }}>
                      {entry.streak_bonus > 1 && <span style={{ color: '#F5A623' }}>🔥 {((entry.streak_bonus - 1) * 10).toFixed(0)}% streak</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontFamily: "'Space Mono', monospace", fontSize: '1rem',
                      fontWeight: 700, color: config.color
                    }}>
                      {entry.rar_score.toFixed(2)}%
                    </span>
                  </div>
                  <div style={{
                    textAlign: 'right',
                    fontFamily: "'Space Mono', monospace", fontSize: '0.85rem',
                    color: entry.total_pnl_normalized >= 0 ? '#00D4AA' : '#FF6060',
                    fontWeight: 600
                  }}>
                    {formatPnl(entry.total_pnl_normalized)}
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: "'Space Mono', monospace", fontSize: '0.85rem', color: '#888' }}>
                    {entry.trade_count}
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: "'Space Mono', monospace", fontSize: '0.85rem', color: '#888' }}>
                    {(entry.win_rate * 100).toFixed(0)}%
                  </div>
                  <div style={{
                    textAlign: 'right',
                    fontFamily: "'Space Mono', monospace", fontSize: '0.85rem',
                    color: '#fff', fontWeight: 700
                  }}>
                    {entry.championship_points ?? 0} pts
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── FOOTER NOTE ── */}
          <p style={{
            marginTop: 20, fontSize: '0.72rem', color: '#444',
            fontFamily: "'Space Mono', monospace", textAlign: 'center'
          }}>
            Scoring powered by Autonom CAN-normalized prices · QRNG raffle draws · Updates every 60s
          </p>
        </div>
      </div>
    </>
  )
}
