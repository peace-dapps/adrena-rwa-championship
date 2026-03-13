'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface WalletState {
  connected: boolean
  publicKey: string | null
  connecting: boolean
}

interface Trader {
  wallet_address: string
  display_name: string | null
  registered_at: string
  total_championship_points: number
}

export default function WalletButton() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    publicKey: null,
    connecting: false
  })
  const [trader, setTrader] = useState<Trader | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [registering, setRegistering] = useState(false)
  const [status, setStatus] = useState('')

  // Check if Phantom is installed
  const getPhantom = () => {
    if (typeof window !== 'undefined' && (window as any).solana?.isPhantom) {
      return (window as any).solana
    }
    return null
  }

  // Check existing connection on load
  useEffect(() => {
    const phantom = getPhantom()
    if (!phantom) return

    if (phantom.isConnected && phantom.publicKey) {
      const pubkey = phantom.publicKey.toString()
      setWallet({ connected: true, publicKey: pubkey, connecting: false })
      loadTrader(pubkey)
    }

    phantom.on('connect', (pubkey: any) => {
      const key = pubkey.toString()
      setWallet({ connected: true, publicKey: key, connecting: false })
      loadTrader(key)
    })

    phantom.on('disconnect', () => {
      setWallet({ connected: false, publicKey: null, connecting: false })
      setTrader(null)
    })
  }, [])

  const loadTrader = async (pubkey: string) => {
    const { data } = await supabase
      .from('traders')
      .select('*')
      .eq('wallet_address', pubkey)
      .single()
    if (data) setTrader(data)
  }

  const connectWallet = async () => {
    const phantom = getPhantom()
    if (!phantom) {
      window.open('https://phantom.app', '_blank')
      return
    }
    try {
      setWallet(w => ({ ...w, connecting: true }))
      await phantom.connect()
    } catch {
      setWallet(w => ({ ...w, connecting: false }))
    }
  }

  const disconnectWallet = async () => {
    const phantom = getPhantom()
    if (phantom) await phantom.disconnect()
  }

  const registerTrader = async () => {
    if (!wallet.publicKey) return
    setRegistering(true)
    setStatus('Signing registration...')

    try {
      const phantom = getPhantom()
      const message = new TextEncoder().encode(
        `Register for Adrena RWA Championship\nWallet: ${wallet.publicKey}\nTimestamp: ${Date.now()}`
      )
      await phantom.signMessage(message, 'utf8')

      setStatus('Registering...')
      const { data, error } = await supabase
        .from('traders')
        .upsert({
          wallet_address: wallet.publicKey,
          display_name: displayName.trim() || null,
          registered_at: new Date().toISOString(),
        }, { onConflict: 'wallet_address' })
        .select()
        .single()

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

  const truncate = (key: string) => `${key.slice(0, 4)}...${key.slice(-4)}`

  if (!wallet.connected) {
    return (
      <button
        onClick={connectWallet}
        disabled={wallet.connecting}
        style={{
          padding: '10px 20px',
          borderRadius: 8,
          border: '1px solid rgba(0,212,170,0.4)',
          background: 'rgba(0,212,170,0.08)',
          color: '#00D4AA',
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: 'pointer',
          letterSpacing: '0.03em',
          transition: 'all 0.2s',
        }}>
        {wallet.connecting ? 'Connecting...' : '⚡ Connect Wallet'}
      </button>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!trader ? (
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid rgba(245,166,35,0.4)',
              background: 'rgba(245,166,35,0.08)',
              color: '#F5A623',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}>
            🏆 Enter Competition
          </button>
        ) : (
          <div style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid rgba(0,212,170,0.2)',
            background: 'rgba(0,212,170,0.05)',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.78rem',
            color: '#00D4AA',
          }}>
            ✓ {trader.display_name || truncate(wallet.publicKey!)}
          </div>
        )}
        <button
          onClick={disconnectWallet}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'transparent',
            color: '#555',
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.75rem',
            cursor: 'pointer',
          }}>
          {truncate(wallet.publicKey!)}
        </button>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: '#0F1520',
            border: '1px solid rgba(0,212,170,0.2)',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            maxWidth: 440,
            boxShadow: '0 0 60px rgba(0,212,170,0.1)',
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '1.4rem',
              fontWeight: 800,
              marginBottom: 8,
              color: '#E8EAF0',
            }}>
              Enter the Championship
            </h2>
            <p style={{
              color: '#666',
              fontSize: '0.85rem',
              fontFamily: "'Space Mono', monospace",
              marginBottom: 24,
            }}>
              Sign with your wallet to register. No tokens required.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: '0.72rem',
                fontFamily: "'Space Mono', monospace",
                color: '#555',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}>
                DISPLAY NAME (optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. TraderPeace"
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#E8EAF0',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: 20,
            }}>
              <div style={{ fontSize: '0.65rem', color: '#555', fontFamily: "'Space Mono', monospace", marginBottom: 4 }}>WALLET</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.85rem', color: '#888' }}>
                {wallet.publicKey}
              </div>
            </div>

            {status && (
              <div style={{
                padding: '8px 12px',
                borderRadius: 6,
                background: 'rgba(245,166,35,0.08)',
                border: '1px solid rgba(245,166,35,0.2)',
                color: '#F5A623',
                fontSize: '0.8rem',
                fontFamily: "'Space Mono', monospace",
                marginBottom: 16,
              }}>
                {status}
              </div>
            )}

            <button
              onClick={registerTrader}
              disabled={registering}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                border: 'none',
                background: registering ? 'rgba(0,212,170,0.3)' : '#00D4AA',
                color: '#080B10',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: registering ? 'not-allowed' : 'pointer',
                letterSpacing: '0.02em',
              }}>
              {registering ? 'Registering...' : 'Sign & Enter Championship'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}