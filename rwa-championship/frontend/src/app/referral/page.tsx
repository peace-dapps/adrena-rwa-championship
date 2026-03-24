'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BASE_URL = 'https://adrena-rwa-championship.vercel.app'

export default function ReferralPage() {
  const router = useRouter()
  const [wallet, setWallet] = useState<string | null>(null)
  const [referrals, setReferrals] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, bonus_entries: 0 })
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get connected wallet from Phantom
    const phantom = (window as any).solana
    if (phantom?.isConnected && phantom?.publicKey) {
      const w = phantom.publicKey.toString()
      setWallet(w)
      loadReferrals(w)
    } else {
      setLoading(false)
    }
  }, [])

  async function loadReferrals(w: string) {
    const { data } = await supabase
      .from('traders')
      .select('wallet_address, display_name, registered_at')
      .eq('referred_by', w)
      .order('registered_at', { ascending: false })

    setReferrals(data || [])
    setStats({
      total: data?.length || 0,
      bonus_entries: data?.length || 0, // 1 bonus raffle entry per referral
    })
    setLoading(false)
  }

  const referralLink = wallet ? `${BASE_URL}?ref=${wallet.slice(0, 8)}` : ''

  function copyLink() {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareOnX() {
    const text = `I'm competing in the Adrena × Autonom RWA Championship — the first on-chain trading competition for real-world assets.\n\nJoin using my referral link and we both get bonus raffle entries:\n${referralLink}`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px 80px' }}>

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
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.62rem', letterSpacing: '0.12em', color: 'var(--accent-green)', padding: '3px 8px', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 3, display: 'inline-block', marginBottom: 10 }}>
            REFERRAL PROGRAM
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 'clamp(1.6rem,6vw,2.4rem)', fontWeight: 800, marginBottom: 8 }}>
            Invite <span style={{ color: 'var(--accent-green)' }}>Traders</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontFamily: "'Space Mono',monospace", fontSize: '0.78rem', lineHeight: 1.6 }}>
            Refer traders to the championship. Every trader who registers with your link earns you 1 bonus raffle entry per week they compete.
          </p>
        </div>

        {!wallet ? (
          <div style={{ padding: 40, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace", fontSize: '0.82rem', marginBottom: 16 }}>
              Connect your wallet to get your referral link
            </div>
            <button
              onClick={() => router.push('/')}
              style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent-green)', color: '#080B10', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
            >
              Go to Leaderboard →
            </button>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              <div style={{ padding: '18px 20px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.6rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6 }}>TRADERS REFERRED</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-green)' }}>{stats.total}</div>
              </div>
              <div style={{ padding: '18px 20px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.6rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6 }}>BONUS RAFFLE ENTRIES</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-purple)' }}>{stats.bonus_entries}</div>
              </div>
            </div>

            {/* Referral link */}
            <div style={{ padding: '20px 24px', borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', marginBottom: 20 }}>
              <div style={{ fontSize: '0.65rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 10 }}>YOUR REFERRAL LINK</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--border)', fontFamily: "'Space Mono',monospace", fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {referralLink}
                </div>
                <button
                  onClick={copyLink}
                  style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--border)', background: copied ? 'rgba(0,212,170,0.1)' : 'var(--bg-card)', color: copied ? 'var(--accent-green)' : 'var(--text-secondary)', fontFamily: "'Space Mono',monospace", fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', flexShrink: 0 }}
                >
                  {copied ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={shareOnX}
                  style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: '#000', color: '#fff', fontFamily: "'Space Mono',monospace", fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share on X
                </button>
              </div>
            </div>

            {/* How it works */}
            <div style={{ padding: '16px 20px', borderRadius: 10, background: 'rgba(0,212,170,0.04)', border: '1px solid rgba(0,212,170,0.15)', marginBottom: 24 }}>
              <div style={{ fontSize: '0.65rem', fontFamily: "'Space Mono',monospace", color: 'var(--accent-green)', letterSpacing: '0.1em', marginBottom: 10 }}>HOW IT WORKS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Share your referral link with other traders',
                  'They register for the championship using your link',
                  'You earn 1 bonus raffle entry per week they compete',
                  'No limit — refer as many traders as you want',
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.65rem', color: 'var(--accent-green)', fontWeight: 700, minWidth: 20 }}>0{i + 1}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Referred traders list */}
            <div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>
                REFERRED TRADERS ({referrals.length})
              </h2>
              {loading ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem' }}>Loading...</div>
              ) : referrals.length === 0 ? (
                <div style={{ padding: 32, borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontFamily: "'Space Mono',monospace", fontSize: '0.8rem' }}>
                  No referrals yet. Share your link to get started.
                </div>
              ) : (
                <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px', padding: '10px 16px', background: 'var(--bg-card)', fontSize: '0.6rem', fontFamily: "'Space Mono',monospace", color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                    <span>TRADER</span><span>NAME</span><span style={{ textAlign: 'right' }}>JOINED</span>
                  </div>
                  {referrals.map((r, i) => (
                    <div
                      key={r.wallet_address}
                      onClick={() => router.push(`/trader/${r.wallet_address}`)}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px', padding: '12px 16px', borderTop: '1px solid var(--border)', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                    >
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                        {r.wallet_address.slice(0, 4)}...{r.wallet_address.slice(-4)}
                      </span>
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{r.display_name || '—'}</span>
                      <span style={{ textAlign: 'right', fontFamily: "'Space Mono',monospace", fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(r.registered_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
