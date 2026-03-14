'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useParams, useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ACHIEVEMENTS = [
  { key: 'equity_analyst', name: 'Equity Analyst', desc: '10+ equity trades', icon: '📈' },
  { key: 'commodity_trader', name: 'Commodity Trader', desc: '10+ commodity trades', icon: '⚡' },
  { key: 'basket_weaver', name: 'Basket Weaver', desc: 'First basket trade', icon: '🧺' },
  { key: 'rwa_leviathan', name: 'RWA Leviathan', desc: 'Top 3 in any league', icon: '🐉' },
  { key: 'consistent', name: 'Consistent', desc: '70%+ win rate over 10 trades', icon: '🎯' },
  { key: 'streak_master', name: 'Streak Master', desc: '3 week streak', icon: '🔥' },
]

function truncate(w: string) {
  return `${w.slice(0, 6)}...${w.slice(-6)}`
}

export default function TraderProfile() {
  const params = useParams()
  const router = useRouter()
  const wallet = decodeURIComponent(params.wallet as string)

  const [trader, setTrader] = useState<any>(null)
  const [scores, setScores] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: traderData }, { data: scoresData }, { data: posData }, { data: achData }] =
        await Promise.all([
          supabase.from('traders').select('*').eq('wallet_address', wallet).single(),
          supabase.from('leaderboard_scores').select('*').eq('wallet_address', wallet).order('updated_at', { ascending: false }),
          supabase.from('positions').select('*').eq('wallet_address', wallet).order('exit_date', { ascending: false }).limit(20),
          supabase.from('trader_achievements').select('*').eq('wallet_address', wallet),
        ])

      setTrader(traderData)
      setScores(scoresData || [])
      setPositions(posData || [])
      setAchievements(achData || [])
      setLoading(false)
    }
    load()
  }, [wallet])

  const totalRar = scores.reduce((sum, s) => sum + (s.rar_score || 0), 0)
  const totalPnl = scores.reduce((sum, s) => sum + (s.total_pnl_normalized || 0), 0)
  const totalTrades = scores.reduce((sum, s) => sum + (s.trade_count || 0), 0)
  const totalPoints = scores.reduce((sum, s) => sum + (s.championship_points || 0), 0)
  const avgWinRate = scores.length > 0 ? scores.reduce((sum, s) => sum + (s.win_rate || 0), 0) / scores.length : 0

  const LEAGUE_COLORS: Record<string, string> = {
    equities: '#00D4AA',
    commodities: '#F5A623',
    baskets: '#B06EFF',
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080B10; color: #E8EAF0; font-family: 'Syne', sans-serif; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#080B10' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px' }}>

          {/* Back */}
          <button onClick={() => router.push('/')} style={{
            background: 'none', border: 'none', color: '#555', cursor: 'pointer',
            fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            ← Back to Leaderboard
          </button>

          {loading ? (
            <div style={{ color: '#444', fontFamily: "'Space Mono', monospace" }}>Loading...</div>
          ) : (
            <div className="fade">

              {/* Header */}
              <div style={{
                padding: 28, borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>
                      {trader?.display_name || truncate(wallet)}
                    </h1>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#555' }}>
                      {wallet}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#444', marginTop: 4 }}>
                      Registered {trader?.registered_at ? new Date(trader.registered_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#00D4AA' }}>
                      {totalPoints}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#555', letterSpacing: '0.1em' }}>
                      CHAMPIONSHIP PTS
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'TOTAL RAR', value: `${totalRar.toFixed(2)}%`, color: '#00D4AA' },
                  { label: 'TOTAL PNL', value: `${totalPnl >= 0 ? '+' : ''}$${Math.abs(totalPnl).toFixed(0)}`, color: totalPnl >= 0 ? '#00D4AA' : '#FF6060' },
                  { label: 'TOTAL TRADES', value: totalTrades, color: '#E8EAF0' },
                  { label: 'AVG WIN RATE', value: `${(avgWinRate * 100).toFixed(0)}%`, color: '#F5A623' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    padding: '16px 18px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div style={{ fontSize: '0.62rem', fontFamily: "'Space Mono', monospace", color: '#555', letterSpacing: '0.12em', marginBottom: 6 }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: stat.color }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* League scores */}
              {scores.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#888' }}>
                    LEAGUE SCORES
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    {scores.map(score => (
                      <div key={score.id} style={{
                        padding: '18px 20px', borderRadius: 10,
                        background: `rgba(${score.league === 'equities' ? '0,212,170' : score.league === 'commodities' ? '245,166,35' : '176,110,255'},0.06)`,
                        border: `1px solid ${LEAGUE_COLORS[score.league] || '#333'}30`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: LEAGUE_COLORS[score.league] }}>
                            {score.league?.toUpperCase()}
                          </span>
                          {score.rank && (
                            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#666' }}>
                              Rank #{score.rank}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: LEAGUE_COLORS[score.league], marginBottom: 8 }}>
                          {score.rar_score?.toFixed(2)}%
                        </div>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <div>
                            <div style={{ fontSize: '0.6rem', color: '#555', fontFamily: "'Space Mono', monospace" }}>TRADES</div>
                            <div style={{ fontSize: '0.9rem', color: '#888' }}>{score.trade_count}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.6rem', color: '#555', fontFamily: "'Space Mono', monospace" }}>WIN%</div>
                            <div style={{ fontSize: '0.9rem', color: '#888' }}>{((score.win_rate || 0) * 100).toFixed(0)}%</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.6rem', color: '#555', fontFamily: "'Space Mono', monospace" }}>POINTS</div>
                            <div style={{ fontSize: '0.9rem', color: '#888' }}>{score.championship_points}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#888' }}>
                  ACHIEVEMENTS
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {ACHIEVEMENTS.map(ach => {
                    const unlocked = achievements.some(a => a.achievement_key === ach.key)
                    return (
                      <div key={ach.key} style={{
                        padding: '10px 16px', borderRadius: 8,
                        background: unlocked ? 'rgba(0,212,170,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${unlocked ? 'rgba(0,212,170,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        opacity: unlocked ? 1 : 0.4,
                        display: 'flex', alignItems: 'center', gap: 8
                      }}>
                        <span style={{ fontSize: '1.1rem' }}>{ach.icon}</span>
                        <div>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.8rem', fontWeight: 700, color: unlocked ? '#E8EAF0' : '#555' }}>
                            {ach.name}
                          </div>
                          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#555' }}>
                            {ach.desc}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent positions */}
              {positions.length > 0 && (
                <div>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#888' }}>
                    RECENT TRADES
                  </h2>
                  <div style={{
                    borderRadius: 10, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '80px 80px 1fr 100px 80px',
                      padding: '10px 16px',
                      background: 'rgba(255,255,255,0.02)',
                      fontSize: '0.62rem', fontFamily: "'Space Mono', monospace",
                      color: '#555', letterSpacing: '0.08em'
                    }}>
                      <span>SYMBOL</span>
                      <span>SIDE</span>
                      <span>DATE</span>
                      <span style={{ textAlign: 'right' }}>PNL</span>
                      <span style={{ textAlign: 'right' }}>LEVERAGE</span>
                    </div>
                    {positions.map((pos, i) => (
                      <div key={pos.id} style={{
                        display: 'grid', gridTemplateColumns: '80px 80px 1fr 100px 80px',
                        padding: '12px 16px',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.85rem', fontWeight: 700 }}>
                          {pos.symbol}
                        </span>
                        <span style={{
                          fontFamily: "'Space Mono', monospace", fontSize: '0.75rem',
                          color: pos.side === 'long' ? '#00D4AA' : '#FF6060',
                          fontWeight: 700
                        }}>
                          {pos.side?.toUpperCase()}
                        </span>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#555' }}>
                          {pos.exit_date ? new Date(pos.exit_date).toLocaleDateString() : '—'}
                        </span>
                        <span style={{
                          textAlign: 'right',
                          fontFamily: "'Space Mono', monospace", fontSize: '0.85rem',
                          color: (pos.pnl_normalized || pos.pnl || 0) >= 0 ? '#00D4AA' : '#FF6060',
                          fontWeight: 600
                        }}>
                          {(pos.pnl_normalized || pos.pnl || 0) >= 0 ? '+' : ''}${Math.abs(pos.pnl_normalized || pos.pnl || 0).toFixed(0)}
                        </span>
                        <span style={{ textAlign: 'right', fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#666' }}>
                          {pos.entry_leverage?.toFixed(1)}x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </>
  )
}
