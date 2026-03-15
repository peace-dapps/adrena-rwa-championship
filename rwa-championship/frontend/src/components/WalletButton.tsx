'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Trader {
  wallet_address: string
  display_name: string | null
}

export default function WalletButton() {
  const router = useRouter()
  const [connected, setConnected] = useState(false)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [trader, setTrader] = useState<Trader | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [registering, setRegistering] = useState(false)
  const [status, setStatus] = useState('')

  const getPhantom = () => typeof window !== 'undefined' && (window as any).solana?.isPhantom ? (window as any).solana : null

  useEffect(() => {
    const phantom = getPhantom()
    if (!phantom) return
    if (phantom.isConnected && phantom.publicKey) {
      const pk = phantom.publicKey.toString()
      setConnected(true)
      setPublicKey(pk)
      loadTrader(pk)
    }
    phantom.on('connect', (pk: any) => {
      const key = pk.toString()
      setConnected(true)
      setPublicKey(key)
      setConnecting(false)
      loadTrader(key)
    })
    phantom.on('disconnect', () => {
      setConnected(false)
      setPublicKey(null)
      setTrader(null)
    })
  }, [])

  async function loadTrader(pk: string) {
    const { data } = await supabase.from('traders').select('*').eq('wallet_address', pk).single()
    if (data) setTrader(data)
  }

  async function connectWallet() {
    const phantom = getPhantom()
    if (!phantom) { window.open('https://phantom.app', '_blank'); return }
    try { setConnecting(true); await phantom.connect() } catch { setConnecting(false) }
  }

  async function registerTrader() {
    if (!publicKey) return
    setRegistering(true)
    setStatus('Signing...')
    try {
      const phantom = getPhantom()
      const message = new TextEncoder().encode(`Register for Adrena RWA Championship\nWallet: ${publicKey}\nTimestamp: ${Date.now()}`)
      await phantom.signMessage(message, 'utf8')
      setStatus('Registering...')

      // Check for referral param
      const params = new URLSearchParams(window.location.search)
      const refParam = params.get('ref')

      const { data, error } = await supabase.from('traders').upsert({
        wallet_address: publicKey,
        display_name: displayName.trim() || null,
        registered_at: new Date().toISOString(),
        ...(refParam ? { referred_by: refParam } : {}),
      }, { onConflict: 'wallet_address' }).select().single()

      if (error) throw error
      setTrader(data)
      setShowModal(false)
      setStatus('')
    } catch (err: any) {
      setStatus(err.message || 'Registration failed')
    } finally {
      setRegistering(false)
    }
  }

  const truncate = (k: string) => `${k.slice(0, 4)}...${k.slice(-4)}`

  if (!connected) {
    return (
      <button onClick={connectWallet} disabled={connecting} style={{
        padding: '8px 16px', borderRadius: 8,
        border: '1px solid rgba(0,212,170,0.4)',
        background: 'rgba(0,212,170,0.08)',
        color: 'var(--accent-green)',
        fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.82rem',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        transition: 'all 0.2s', flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
        {connecting ? 'Connecting...' : 'Connect'}
      </button>
    )
  }

  return (
    <>
      {!trader ? (
        <button onClick={() => setShowModal(true)} style={{
          padding: '8px 14px', borderRadius: 8,
          border: '1px solid rgba(245,166,35,0.4)',
          background: 'rgba(245,166,35,0.08)',
          color: 'var(--accent-orange)',
          fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.82rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
          Enter Championship
        </button>
      ) : (
        <button onClick={() => router.push('/profile')} style={{
          padding: '7px 12px', borderRadius: 8,
          border: '1px solid rgba(0,212,170,0.25)',
          background: 'rgba(0,212,170,0.06)',
          color: 'var(--accent-green)',
          fontFamily: "'Space Mono',monospace", fontSize: '0.75rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          transition: 'all 0.2s', flexShrink: 0,
        }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,212,170,0.15)', border: '1px solid rgba(0,212,170,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <span>{trader.display_name || truncate(publicKey!)}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      )}

      {/* Registration Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 0 60px rgba(0,212,170,0.1)' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.4rem', fontWeight: 800, marginBottom: 6, color: 'var(--text-primary)' }}>Enter the Championship</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: "'Space Mono',monospace", marginBottom: 20 }}>Sign with your wallet to register. No tokens required.</p>
            <label style={{ display: 'block', fontSize: '0.65rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6 }}>DISPLAY NAME (optional)</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. TraderPeace" maxLength={20}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: "'Space Mono',monospace", fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }} />
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace", marginBottom: 4 }}>WALLET</div>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{publicKey}</div>
            </div>
            {status && <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', color: 'var(--accent-orange)', fontSize: '0.8rem', fontFamily: "'Space Mono',monospace", marginBottom: 14 }}>{status}</div>}
            <button onClick={registerTrader} disabled={registering} style={{ width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: registering ? 'rgba(0,212,170,0.3)' : 'var(--accent-green)', color: '#080B10', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.95rem', cursor: registering ? 'not-allowed' : 'pointer' }}>
              {registering ? 'Registering...' : 'Sign & Enter Championship'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
