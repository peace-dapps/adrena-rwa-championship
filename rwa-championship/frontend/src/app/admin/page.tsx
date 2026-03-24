'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Simple admin password check — change this to your own password
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'rwa-admin-2026'

interface Session {
  id: string
  league: string
  week_number: number
  status: string
  start_time: string
  end_time: string
}

interface Season {
  id: string
  name: string
  status: string
  start_date: string
  end_date: string
}

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState('')

  const [sessions, setSessions] = useState<Session[]>([])
  const [seasons, setSeasons] = useState<Season[]>([])
  const [traders, setTraders] = useState<any[]>([])
  const [feedback, setFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState<'success' | 'error'>('success')

  // New session form
  const [newSession, setNewSession] = useState({
    league: 'equities',
    week_number: 1,
    start_time: '',
    end_time: '',
  })

  function notify(text: string, type: 'success' | 'error' = 'success') {
    setMsg(text)
    setMsgType(type)
    setTimeout(() => setMsg(''), 4000)
  }

  async function loadData() {
    setLoading(true)
    const [{ data: s }, { data: seas }, { data: t }, { data: f }] = await Promise.all([
      supabase.from('sessions').select('*').order('week_number', { ascending: false }),
      supabase.from('seasons').select('*').order('start_date', { ascending: false }),
      supabase.from('traders').select('*').order('registered_at', { ascending: false }),
      supabase.from('feedback').select('*').order('submitted_at', { ascending: false }),
    ])
    setSessions(s || [])
    setSeasons(seas || [])
    setTraders(t || [])
    setFeedback(f || [])
    setLoading(false)
  }

  useEffect(() => {
    if (authed) loadData()
  }, [authed])

  async function updateSessionStatus(id: string, status: string) {
    const { error } = await supabase.from('sessions').update({ status }).eq('id', id)
    if (error) { notify('Failed to update session', 'error'); return }
    notify(`Session set to ${status}`)
    loadData()
  }

  async function createSession() {
    if (!newSession.start_time || !newSession.end_time) {
      notify('Please fill in start and end times', 'error')
      return
    }

    // Get active season
    const { data: season } = await supabase.from('seasons').select('id').eq('status', 'active').single()
    if (!season) { notify('No active season found', 'error'); return }

    const { error } = await supabase.from('sessions').insert({
      season_id: season.id,
      league: newSession.league,
      week_number: newSession.week_number,
      start_time: new Date(newSession.start_time).toISOString(),
      end_time: new Date(newSession.end_time).toISOString(),
      status: 'upcoming',
    })
    if (error) { notify('Failed to create session: ' + error.message, 'error'); return }
    notify('Session created successfully')
    setNewSession({ league: 'equities', week_number: 1, start_time: '', end_time: '' })
    loadData()
  }

  async function triggerRaffle(sessionId: string) {
    // Get all entries for this session
    const { data: entries } = await supabase
      .from('raffle_entries')
      .select('wallet_address, entries')
      .eq('session_id', sessionId)
      .gt('entries', 0)

    if (!entries?.length) { notify('No raffle entries for this session', 'error'); return }

    // Build pool
    const pool: string[] = []
    for (const e of entries) {
      for (let i = 0; i < e.entries; i++) pool.push(e.wallet_address)
    }

    // Pick random winner (mock QRNG)
    const winnerIndex = Math.floor(Math.random() * pool.length)
    const winner = pool[winnerIndex]

    const { error } = await supabase.from('raffle_results').insert({
      session_id: sessionId,
      winner_wallet: winner,
      prize_adx: 500,
      qrng_proof: JSON.stringify({
        note: 'Mock QRNG — replace with Autonom QRNG key in production',
        random_index: winnerIndex,
        pool_size: pool.length,
        timestamp: new Date().toISOString(),
      }),
    })
    if (error) { notify('Failed to record raffle result', 'error'); return }
    notify(`Raffle drawn! Winner: ${winner.slice(0, 8)}...`)
    loadData()
  }

  async function deleteSession(id: string) {
    if (!confirm('Delete this session? This cannot be undone.')) return
    await supabase.from('leaderboard_scores').delete().eq('session_id', id)
    await supabase.from('raffle_entries').delete().eq('session_id', id)
    await supabase.from('positions').delete().eq('session_id', id)
    await supabase.from('sessions').delete().eq('id', id)
    notify('Session deleted')
    loadData()
  }

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setPwError('')
    } else {
      setPwError('Incorrect password')
    }
  }

  const STATUS_COLORS: Record<string, string> = {
    active: '#00D4AA',
    upcoming: 'var(--accent-orange)',
    completed: 'var(--text-muted)',
    market_closed: 'var(--accent-purple)',
  }

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 360, padding: 32, borderRadius: 16, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.12em', color: 'var(--accent-green)', marginBottom: 16 }}>ADMIN ACCESS</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.4rem', fontWeight: 800, marginBottom: 20, color: 'var(--text-primary)' }}>RWA Championship</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Admin password"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: "'Space Mono',monospace", fontSize: '0.9rem', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
          />
          {pwError && <div style={{ color: 'var(--negative)', fontSize: '0.78rem', fontFamily: "'Space Mono',monospace", marginBottom: 12 }}>{pwError}</div>}
          <button onClick={handleLogin} style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: 'var(--accent-green)', color: '#080B10', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
            Enter
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--accent-green)', padding: '2px 8px', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 4 }}>ADMIN</div>
          </div>
        </div>

        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.4rem,5vw,2rem)', fontWeight: 800, marginBottom: 4 }}>Competition Control</h1>
        <p style={{ color: 'var(--text-secondary)', fontFamily: "'Space Mono',monospace", fontSize: '0.78rem', marginBottom: 28 }}>
          {traders.length} traders registered · {sessions.filter(s => s.status === 'active').length} active sessions
        </p>

        {/* Notification */}
        {msg && (
          <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 20, background: msgType === 'success' ? 'rgba(0,212,170,0.1)' : 'rgba(255,96,96,0.1)', border: `1px solid ${msgType === 'success' ? 'rgba(0,212,170,0.3)' : 'rgba(255,96,96,0.3)'}`, color: msgType === 'success' ? 'var(--accent-green)' : 'var(--negative)', fontFamily: "'Space Mono',monospace", fontSize: '0.82rem' }}>
            {msg}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 28 }}>
          {[
            { label: 'TRADERS', value: traders.length, color: 'var(--accent-green)' },
            { label: 'SESSIONS', value: sessions.length, color: 'var(--accent-orange)' },
            { label: 'ACTIVE', value: sessions.filter(s => s.status === 'active').length, color: 'var(--accent-green)' },
            { label: 'COMPLETED', value: sessions.filter(s => s.status === 'completed').length, color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} style={{ padding: '12px 14px', borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.55rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Create session */}
        <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '1rem', marginBottom: 16, color: 'var(--text-primary)' }}>Create New Session</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: '0.6rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>LEAGUE</label>
              <select value={newSession.league} onChange={e => setNewSession(p => ({ ...p, league: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: "'Space Mono',monospace", fontSize: '0.82rem' }}>
                <option value="equities">Equities</option>
                <option value="commodities">Commodities</option>
                <option value="baskets">Baskets</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.6rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>WEEK</label>
              <input type="number" value={newSession.week_number} onChange={e => setNewSession(p => ({ ...p, week_number: parseInt(e.target.value) }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: "'Space Mono',monospace", fontSize: '0.82rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.6rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>START TIME</label>
              <input type="datetime-local" value={newSession.start_time} onChange={e => setNewSession(p => ({ ...p, start_time: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: "'Space Mono',monospace", fontSize: '0.78rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.6rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>END TIME</label>
              <input type="datetime-local" value={newSession.end_time} onChange={e => setNewSession(p => ({ ...p, end_time: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: "'Space Mono',monospace", fontSize: '0.78rem' }} />
            </div>
          </div>
          <button onClick={createSession} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-green)', color: '#080B10', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
            Create Session
          </button>
        </div>

        {/* Sessions list */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '1rem', marginBottom: 12, color: 'var(--text-secondary)' }}>ALL SESSIONS</h2>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {sessions.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem' }}>No sessions yet.</div>
            ) : sessions.map((session, i) => (
              <div key={session.id} style={{ padding: '14px 16px', borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'var(--bg-card)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.9rem', textTransform: 'capitalize' }}>{session.league}</span>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.7rem', color: 'var(--text-muted)' }}>Week {session.week_number}</span>
                    <span style={{ fontSize: '0.65rem', fontFamily: "'Space Mono',monospace", color: STATUS_COLORS[session.status] || 'var(--text-muted)', padding: '2px 6px', border: `1px solid ${STATUS_COLORS[session.status] || 'var(--border)'}30`, borderRadius: 4 }}>
                      {session.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {new Date(session.start_time).toLocaleDateString()} → {new Date(session.end_time).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {session.status !== 'active' && (
                    <button onClick={() => updateSessionStatus(session.id, 'active')} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(0,212,170,0.3)', background: 'rgba(0,212,170,0.08)', color: 'var(--accent-green)', fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', cursor: 'pointer' }}>
                      Activate
                    </button>
                  )}
                  {session.status === 'active' && (
                    <button onClick={() => updateSessionStatus(session.id, 'completed')} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(245,166,35,0.3)', background: 'rgba(245,166,35,0.08)', color: 'var(--accent-orange)', fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', cursor: 'pointer' }}>
                      End Session
                    </button>
                  )}
                  <button onClick={() => triggerRaffle(session.id)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(176,110,255,0.3)', background: 'rgba(176,110,255,0.08)', color: 'var(--accent-purple)', fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', cursor: 'pointer' }}>
                    Draw Raffle
                  </button>
                  <button onClick={() => deleteSession(session.id)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(255,96,96,0.3)', background: 'rgba(255,96,96,0.05)', color: 'var(--negative)', fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Registered traders */}
        <div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '1rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
            REGISTERED TRADERS ({traders.length})
          </h2>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px', padding: '10px 16px', background: 'var(--bg-card)', fontSize: '0.6rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              <span>WALLET</span><span>NAME</span><span style={{ textAlign: 'right' }}>REGISTERED</span>
            </div>
            {traders.slice(0, 20).map((t, i) => (
              <div key={t.wallet_address} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px', padding: '10px 16px', borderTop: '1px solid var(--border)', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : 'var(--bg-card)' }}>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.78rem', color: 'var(--text-primary)' }}>{t.wallet_address.slice(0, 16)}...</span>
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.display_name || '—'}</span>
                <span style={{ textAlign: 'right', fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', color: 'var(--text-muted)' }}>{new Date(t.registered_at).toLocaleDateString()}</span>
              </div>
            ))}
            {traders.length > 20 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center', fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                +{traders.length - 20} more traders
              </div>
            )}
          </div>
        </div>

        {/* Feedback */}
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '1rem', marginBottom: 12, color: 'var(--text-secondary)' }}>
            FEEDBACK ({feedback.length})
          </h2>
          {feedback.length === 0 ? (
            <div style={{ padding: 24, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem' }}>
              No feedback submitted yet. Share the feedback link with testers.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {feedback.map((f, i) => (
                <div key={f.id} style={{ padding: '16px 20px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {f.wallet_address.slice(0, 8)}...{f.wallet_address.slice(-6)}
                    </span>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {new Date(f.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 10, marginBottom: 12 }}>
                    {[
                      { label: 'Wallet Ease', value: f.q1_wallet_ease ? `${f.q1_wallet_ease}/5` : '—' },
                      { label: 'Trades Correct', value: f.q2_trades_correct || '—' },
                      { label: 'RAR Fairer', value: f.q3_rar_fairer || '—' },
                      { label: 'Overall Rating', value: f.q4_overall_rating ? `${f.q4_overall_rating}/5` : '—' },
                      { label: 'Would Return', value: f.q6_would_return || '—' },
                    ].map(item => (
                      <div key={item.label} style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.55rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 3 }}>{item.label.toUpperCase()}</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-green)' }}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                  {f.q5_improvements && (
                    <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: 8 }}>
                      <div style={{ fontSize: '0.55rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>IMPROVEMENTS</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: "'Space Mono',monospace" }}>{f.q5_improvements}</div>
                    </div>
                  )}
                  {f.q7_other && (
                    <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.55rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 4 }}>OTHER FEEDBACK</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: "'Space Mono',monospace" }}>{f.q7_other}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
