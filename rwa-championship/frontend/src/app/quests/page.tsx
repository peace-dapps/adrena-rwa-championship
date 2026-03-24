'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ALL_QUESTS = [
  // Daily
  { key: 'daily_3_trades',      name: 'Active Trader',    desc: 'Close 3 trades today',                          type: 'daily',  mutagen: 25,  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { key: 'daily_long_and_short', name: 'Both Sides',      desc: 'Open both a long and short position today',     type: 'daily',  mutagen: 25,  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 11 21 7 17 3"/><line x1="21" y1="7" x2="9" y2="7"/><polyline points="7 21 3 17 7 13"/><line x1="15" y1="17" x2="3" y2="17"/></svg> },
  { key: 'daily_market_hours',   name: 'Market Hours',    desc: 'Close a trade during active market hours',      type: 'daily',  mutagen: 15,  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  // Weekly
  { key: 'weekly_win_rate',      name: 'Sharp Shooter',   desc: '50%+ win rate over 10 trades this week',       type: 'weekly', mutagen: 200, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  { key: 'weekly_all_leagues',   name: 'League Explorer', desc: 'Trade in all 3 leagues this week',             type: 'weekly', mutagen: 150, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/><rect x="2" y="14" width="7" height="7"/><rect x="15" y="14" width="7" height="7"/></svg> },
  { key: 'weekly_streak',        name: 'Consistent',      desc: 'Maintain a 5-session trading streak',          type: 'weekly', mutagen: 100, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> },
]

export default function QuestsPage() {
  const router = useRouter()
  const [wallet, setWallet] = useState<string | null>(null)
  const [completions, setCompletions] = useState<any[]>([])
  const [totalMutagen, setTotalMutagen] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const phantom = (window as any).solana
    if (phantom?.isConnected && phantom?.publicKey) {
      const w = phantom.publicKey.toString()
      setWallet(w)
      loadCompletions(w)
    } else {
      setLoading(false)
    }
  }, [])

  async function loadCompletions(w: string) {
    const startOfWeek = new Date()
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay())
    startOfWeek.setUTCHours(0, 0, 0, 0)

    const { data } = await supabase
      .from('quest_completions')
      .select('*')
      .eq('wallet_address', w)
      .gte('completed_at', startOfWeek.toISOString())
      .order('completed_at', { ascending: false })

    setCompletions(data || [])
    setTotalMutagen((data || []).reduce((sum: number, q: any) => sum + (q.reward_mutagen || 0), 0))
    setLoading(false)
  }

  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)

  function isCompleted(questKey: string, type: string) {
    if (type === 'daily') {
      return completions.some(c => c.quest_key === questKey && new Date(c.completed_at) >= startOfDay)
    }
    return completions.some(c => c.quest_key === questKey)
  }

  const dailyQuests = ALL_QUESTS.filter(q => q.type === 'daily')
  const weeklyQuests = ALL_QUESTS.filter(q => q.type === 'weekly')
  const dailyCompleted = dailyQuests.filter(q => isCompleted(q.key, 'daily')).length
  const weeklyCompleted = weeklyQuests.filter(q => isCompleted(q.key, 'weekly')).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.62rem', letterSpacing: '0.12em', color: 'var(--accent-orange)', padding: '3px 8px', border: '1px solid rgba(245,166,35,0.3)', borderRadius: 3, display: 'inline-block', marginBottom: 10 }}>
            SEASON 1 QUESTS
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.6rem,6vw,2.4rem)', fontWeight: 800, marginBottom: 8 }}>
            Trading <span style={{ color: 'var(--accent-orange)' }}>Quests</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontFamily: "'Space Mono',monospace", fontSize: '0.78rem' }}>
            Complete quests to earn Mutagen points. Resets daily and weekly.
          </p>
        </div>

        {/* Stats */}
        {wallet && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
            {[
              { label: 'DAILY DONE', value: `${dailyCompleted}/${dailyQuests.length}`, color: 'var(--accent-orange)' },
              { label: 'WEEKLY DONE', value: `${weeklyCompleted}/${weeklyQuests.length}`, color: 'var(--accent-green)' },
              { label: 'MUTAGEN EARNED', value: totalMutagen, color: 'var(--accent-purple)' },
            ].map(s => (
              <div key={s.label} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.55rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Daily Quests */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>DAILY QUESTS</h2>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--text-muted)' }}>Resets at midnight UTC</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dailyQuests.map(quest => {
              const done = isCompleted(quest.key, 'daily')
              return (
                <div key={quest.key} style={{ padding: '16px 20px', borderRadius: 10, background: done ? 'rgba(0,212,170,0.06)' : 'var(--bg-card)', border: `1px solid ${done ? 'rgba(0,212,170,0.25)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ color: done ? 'var(--accent-green)' : 'var(--text-muted)', flexShrink: 0 }}>{quest.icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.9rem', marginBottom: 2, color: done ? 'var(--text-primary)' : 'var(--text-primary)' }}>{quest.name}</div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{quest.desc}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.82rem', fontWeight: 700, color: done ? 'var(--accent-green)' : 'var(--accent-orange)' }}>
                      {done ? '✓ Done' : `+${quest.mutagen} MG`}
                    </div>
                    {done && <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>+{quest.mutagen} Mutagen</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Weekly Quests */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>WEEKLY QUESTS</h2>
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--text-muted)' }}>Resets every Monday UTC</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {weeklyQuests.map(quest => {
              const done = isCompleted(quest.key, 'weekly')
              return (
                <div key={quest.key} style={{ padding: '16px 20px', borderRadius: 10, background: done ? 'rgba(0,212,170,0.06)' : 'var(--bg-card)', border: `1px solid ${done ? 'rgba(0,212,170,0.25)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ color: done ? 'var(--accent-green)' : 'var(--text-muted)', flexShrink: 0 }}>{quest.icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>{quest.name}</div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{quest.desc}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.82rem', fontWeight: 700, color: done ? 'var(--accent-green)' : 'var(--accent-purple)' }}>
                      {done ? '✓ Done' : `+${quest.mutagen} MG`}
                    </div>
                    {done && <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>+{quest.mutagen} Mutagen</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Not connected */}
        {!wallet && !loading && (
          <div style={{ padding: 32, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace", fontSize: '0.82rem', marginBottom: 16 }}>Connect your wallet to track quest progress</div>
            <button onClick={() => router.push('/')} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-green)', color: '#080B10', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
              Go to Leaderboard →
            </button>
          </div>
        )}

        {/* Recent completions */}
        {completions.length > 0 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>RECENT COMPLETIONS</h2>
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
              {completions.slice(0, 10).map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'var(--bg-card)' : 'transparent' }}>
                  <div>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.85rem' }}>{c.quest_name}</span>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 8 }}>{c.quest_type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.78rem', color: 'var(--accent-orange)', fontWeight: 700 }}>+{c.reward_mutagen} MG</span>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(c.completed_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
