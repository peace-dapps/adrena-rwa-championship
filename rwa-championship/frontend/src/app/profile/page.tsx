'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '../../components/ThemeProvider'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BASE_URL = 'https://adrena-rwa-championship.vercel.app'

const ACHIEVEMENTS = [
  { key: 'equity_analyst',   name: 'Equity Analyst',   desc: '10+ equity trades',        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
  { key: 'commodity_trader', name: 'Commodity Trader', desc: '10+ commodity trades',      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
  { key: 'basket_weaver',    name: 'Basket Weaver',    desc: 'First basket trade',        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/><rect x="2" y="14" width="7" height="7"/><rect x="15" y="14" width="7" height="7"/></svg> },
  { key: 'rwa_leviathan',    name: 'RWA Leviathan',    desc: 'Top 3 in any league',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
  { key: 'consistent',       name: 'Consistent',       desc: '70%+ win rate, 10 trades',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> },
  { key: 'streak_master',    name: 'Streak Master',    desc: '3 week streak',             icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
]

const LEAGUE_COLORS: Record<string, string> = {
  equities: 'var(--accent-green)',
  commodities: 'var(--accent-orange)',
  baskets: 'var(--accent-purple)',
}

export default function ProfilePage() {
  const router = useRouter()
  const [wallet, setWallet] = useState<string | null>(null)
  const [trader, setTrader] = useState<any>(null)
  const [scores, setScores] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])
  const [referrals, setReferrals] = useState<any[]>([])
  const [raffleEntries, setRaffleEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const phantom = (window as any).solana
    if (phantom?.isConnected && phantom?.publicKey) {
      const w = phantom.publicKey.toString()
      setWallet(w)
      loadAll(w)
    } else {
      setLoading(false)
    }
  }, [])

  async function loadAll(w: string) {
    const [
      { data: t },
      { data: s },
      { data: a },
      { data: r },
      { data: re },
    ] = await Promise.all([
      supabase.from('traders').select('*').eq('wallet_address', w).single(),
      supabase.from('leaderboard_scores').select('*').eq('wallet_address', w).order('updated_at', { ascending: false }),
      supabase.from('trader_achievements').select('*').eq('wallet_address', w),
      supabase.from('traders').select('wallet_address, display_name, registered_at').eq('referred_by', w),
      supabase.from('raffle_entries').select('entries, total_fees_paid, session_id').eq('wallet_address', w),
    ])
    setTrader(t)
    setScores(s || [])
    setAchievements(a || [])
    setReferrals(r || [])
    setRaffleEntries(re || [])
    setNewName(t?.display_name || '')
    setLoading(false)
  }

  async function saveName() {
    if (!wallet) return
    setSaving(true)
    await supabase.from('traders').upsert({ wallet_address: wallet, display_name: newName.trim() || null }, { onConflict: 'wallet_address' })
    setTrader((t: any) => ({ ...t, display_name: newName.trim() || null }))
    setEditingName(false)
    setSaving(false)
  }

  async function disconnect() {
    const phantom = (window as any).solana
    if (phantom) await phantom.disconnect()
    router.push('/')
  }

  const referralLink = wallet ? `${BASE_URL}?ref=${wallet.slice(0, 8)}` : ''
  const totalPoints = scores.reduce((sum, s) => sum + (s.championship_points || 0), 0)
  const totalTrades = scores.reduce((sum, s) => sum + (s.trade_count || 0), 0)
  const totalRaffleEntries = raffleEntries.reduce((sum, e) => sum + (e.entries || 0), 0)
  const bestScore = scores.reduce((best, s) => s.rar_score > best ? s.rar_score : best, 0)

  function copyLink() {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!wallet) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace", fontSize: '0.82rem', marginBottom: 16 }}>Connect your wallet to view your profile</div>
          <button onClick={() => router.push('/')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-green)', color: '#080B10', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
            Go to Leaderboard →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <ThemeToggle />
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace", padding: 40, textAlign: 'center' }}>Loading...</div>
        ) : (
          <>
            {/* Profile card */}
            <div style={{ padding: '24px', borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Avatar */}
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,212,170,0.1)', border: '2px solid rgba(0,212,170,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div>
                    {/* Display name */}
                    {editingName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <input
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          maxLength={20}
                          autoFocus
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--accent-green)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '1rem', width: 160, outline: 'none' }}
                        />
                        <button onClick={saveName} disabled={saving} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--accent-green)', color: '#080B10', fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', cursor: 'pointer' }}>
                          {saving ? '...' : 'Save'}
                        </button>
                        <button onClick={() => setEditingName(false)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', cursor: 'pointer' }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.4rem', fontWeight: 800 }}>
                          {trader?.display_name || 'Anonymous Trader'}
                        </h1>
                        <button onClick={() => setEditingName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </div>
                    )}
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {wallet.slice(0, 8)}...{wallet.slice(-8)}
                    </div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Joined {trader?.registered_at ? new Date(trader.registered_at).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
                <button onClick={disconnect} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,96,96,0.3)', background: 'rgba(255,96,96,0.05)', color: 'var(--negative)', fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Disconnect
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'TOTAL POINTS', value: totalPoints, color: 'var(--accent-green)' },
                { label: 'BEST RAR', value: `${bestScore.toFixed(1)}%`, color: 'var(--accent-orange)' },
                { label: 'TOTAL TRADES', value: totalTrades, color: 'var(--text-primary)' },
                { label: 'RAFFLE ENTRIES', value: totalRaffleEntries, color: 'var(--accent-purple)' },
                { label: 'REFERRALS', value: referrals.length, color: 'var(--accent-green)' },
              ].map(stat => (
                <div key={stat.label} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.55rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* League scores */}
            {scores.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>LEAGUE SCORES</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 10 }}>
                  {scores.map(score => (
                    <div key={score.id} style={{ padding: '16px', borderRadius: 10, background: 'var(--bg-card)', border: `1px solid ${LEAGUE_COLORS[score.league] || 'var(--border)'}30` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.82rem', color: LEAGUE_COLORS[score.league], textTransform: 'uppercase' }}>{score.league}</span>
                        {score.rank && <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{score.rank}</span>}
                      </div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: LEAGUE_COLORS[score.league], marginBottom: 6 }}>{score.rar_score?.toFixed(2)}%</div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {[{ l: 'TRADES', v: score.trade_count }, { l: 'WIN%', v: `${((score.win_rate||0)*100).toFixed(0)}%` }, { l: 'PTS', v: score.championship_points }].map(item => (
                          <div key={item.l}>
                            <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace" }}>{item.l}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>ACHIEVEMENTS</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ACHIEVEMENTS.map(ach => {
                  const unlocked = achievements.some(a => a.achievement_key === ach.key)
                  return (
                    <div key={ach.key} style={{ padding: '8px 14px', borderRadius: 8, background: unlocked ? 'rgba(0,212,170,0.08)' : 'var(--bg-card)', border: `1px solid ${unlocked ? 'rgba(0,212,170,0.3)' : 'var(--border)'}`, opacity: unlocked ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: unlocked ? 'var(--accent-green)' : 'var(--text-muted)' }}>{ach.icon}</span>
                      <div>
                        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.78rem', fontWeight: 700, color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>{ach.name}</div>
                        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.6rem', color: 'var(--text-muted)' }}>{ach.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Referral section */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.9rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>YOUR REFERRAL LINK</h2>
              <div style={{ padding: '16px 20px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 12 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontFamily: "'Space Mono',monospace", marginBottom: 12, lineHeight: 1.6 }}>
                  Earn 1 bonus raffle entry per week for every trader you refer.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', fontFamily: "'Space Mono',monospace", fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {referralLink}
                  </div>
                  <button onClick={copyLink} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid var(--border)', background: copied ? 'rgba(0,212,170,0.1)' : 'var(--bg-card)', color: copied ? 'var(--accent-green)' : 'var(--text-secondary)', fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {copied ? (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Copied</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</>
                    )}
                  </button>
                  <button onClick={() => { const text = `Join me on Adrena × Autonom RWA Championship — skill-based trading competition for real-world assets.\n${referralLink}`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank') }}
                    style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', background: '#000', color: '#fff', fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    Share
                  </button>
                </div>
              </div>

              {referrals.length > 0 && (
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px', padding: '8px 14px', background: 'var(--bg-card)', fontSize: '0.6rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                    <span>REFERRED TRADER</span><span>NAME</span><span style={{ textAlign: 'right' }}>JOINED</span>
                  </div>
                  {referrals.map((r, i) => (
                    <div key={r.wallet_address} onClick={() => router.push(`/trader/${r.wallet_address}`)} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px', padding: '10px 14px', borderTop: '1px solid var(--border)', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.78rem', color: 'var(--text-primary)' }}>{r.wallet_address.slice(0,4)}...{r.wallet_address.slice(-4)}</span>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{r.display_name || '—'}</span>
                      <span style={{ textAlign: 'right', fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(r.registered_at).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => router.push(`/trader/${wallet}`)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                Full Trade History
              </button>
              <button onClick={() => router.push('/season')} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                Season Standings
              </button>
              <button onClick={() => router.push('/raffle')} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid rgba(176,110,255,0.3)', background: 'rgba(176,110,255,0.05)', color: 'var(--accent-purple)', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
                Weekly Raffle
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
