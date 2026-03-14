'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

function truncate(w: string) {
  return `${w.slice(0, 4)}...${w.slice(-4)}`
}

export default function RafflePage() {
  const router = useRouter()
  const [entries, setEntries] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('status', 'active')
        .order('week_number', { ascending: false })
        .limit(1)
        .single()

      setSession(sessionData)

      if (sessionData) {
        const [{ data: entriesData }, { data: resultsData }] = await Promise.all([
          supabase.from('raffle_entries').select('*').eq('session_id', sessionData.id).order('entries', { ascending: false }),
          supabase.from('raffle_results').select('*').order('drawn_at', { ascending: false }).limit(5),
        ])
        setEntries(entriesData || [])
        setResults(resultsData || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const totalEntries = entries.reduce((sum, e) => sum + (e.entries || 0), 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080B10; color: #E8EAF0; font-family: 'Syne', sans-serif; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#080B10' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 60px' }}>

          <button onClick={() => router.push('/')} style={{
            background: 'none', border: 'none', color: '#555', cursor: 'pointer',
            fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            ← Back to Leaderboard
          </button>

          <div style={{ marginBottom: 32 }}>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: '0.7rem',
              letterSpacing: '0.15em', color: '#B06EFF',
              padding: '3px 10px', border: '1px solid rgba(176,110,255,0.3)',
              borderRadius: 3, display: 'inline-block', marginBottom: 12
            }}>
              POWERED BY AUTONOM QRNG
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>
              Weekly <span style={{ color: '#B06EFF' }}>Raffle</span>
            </h1>
            <p style={{ color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.8rem' }}>
              1 entry per $25 in trading fees · Quantum randomness via Autonom QRNG · Verifiably fair
            </p>
          </div>

          {/* How it works */}
          <div style={{
            padding: 20, borderRadius: 12, marginBottom: 24,
            background: 'rgba(176,110,255,0.05)',
            border: '1px solid rgba(176,110,255,0.15)'
          }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 12, fontSize: '0.9rem', color: '#B06EFF' }}>
              HOW IT WORKS
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { step: '01', text: 'Trade RWA assets on Adrena' },
                { step: '02', text: 'Earn 1 entry per $25 in fees paid' },
                { step: '03', text: 'Autonom QRNG draws winner each week' },
                { step: '04', text: 'Proof published on-chain for verification' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#B06EFF', fontWeight: 700, minWidth: 24 }}>
                    {item.step}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#888' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current session stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'TOTAL ENTRIES', value: totalEntries },
              { label: 'PARTICIPANTS', value: entries.length },
              { label: 'PRIZE POOL', value: '500 ADX' },
            ].map(stat => (
              <div key={stat.label} style={{
                padding: '16px 18px', borderRadius: 10,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.62rem', fontFamily: "'Space Mono', monospace", color: '#555', letterSpacing: '0.12em', marginBottom: 6 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#B06EFF' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Entry list */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#888' }}>
              CURRENT ENTRIES — WEEK {session?.week_number ?? 1}
            </h2>
            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 100px 120px 100px',
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.02)',
                fontSize: '0.62rem', fontFamily: "'Space Mono', monospace",
                color: '#555', letterSpacing: '0.08em'
              }}>
                <span>TRADER</span>
                <span style={{ textAlign: 'right' }}>ENTRIES</span>
                <span style={{ textAlign: 'right' }}>FEES PAID</span>
                <span style={{ textAlign: 'right' }}>WIN CHANCE</span>
              </div>
              {loading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#444', fontFamily: "'Space Mono', monospace", fontSize: '0.8rem' }}>
                  Loading...
                </div>
              ) : entries.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#444', fontFamily: "'Space Mono', monospace", fontSize: '0.8rem' }}>
                  No entries yet. Trade to earn raffle entries.
                </div>
              ) : (
                entries.map((entry, i) => (
                  <div key={entry.wallet_address} style={{
                    display: 'grid', gridTemplateColumns: '1fr 100px 120px 100px',
                    padding: '12px 16px',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    alignItems: 'center',
                    background: i === 0 ? 'rgba(176,110,255,0.04)' : 'transparent'
                  }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.85rem' }}>
                      {truncate(entry.wallet_address)}
                    </span>
                    <span style={{ textAlign: 'right', fontFamily: "'Space Mono', monospace", fontSize: '0.85rem', color: '#B06EFF', fontWeight: 700 }}>
                      {entry.entries}
                    </span>
                    <span style={{ textAlign: 'right', fontFamily: "'Space Mono', monospace", fontSize: '0.85rem', color: '#888' }}>
                      ${entry.total_fees_paid?.toFixed(0)}
                    </span>
                    <span style={{ textAlign: 'right', fontFamily: "'Space Mono', monospace", fontSize: '0.85rem', color: '#666' }}>
                      {totalEntries > 0 ? ((entry.entries / totalEntries) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Past winners */}
          {results.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: '#888' }}>
                PAST WINNERS
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {results.map(result => (
                  <div key={result.id} style={{
                    padding: '14px 18px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
                  }}>
                    <div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.85rem', fontWeight: 700, marginBottom: 2 }}>
                        🏆 {truncate(result.winner_wallet)}
                      </div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#555' }}>
                        {new Date(result.drawn_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '1rem', color: '#B06EFF', fontWeight: 700 }}>
                        {result.prize_adx} ADX
                      </div>
                      {result.qrng_proof && (
                        <div style={{ fontSize: '0.65rem', color: '#444', fontFamily: "'Space Mono', monospace", marginTop: 2 }}>
                          QRNG verified ✓
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
