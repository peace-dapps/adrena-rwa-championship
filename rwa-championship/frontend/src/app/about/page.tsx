'use client'

import { useRouter } from 'next/navigation'

const LEAGUES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
    label: 'Equities',
    assets: 'AAPL · TSLA · NVDA · MSFT',
    color: '#00D4AA',
    bg: 'rgba(0,212,170,0.06)',
    border: 'rgba(0,212,170,0.2)',
    desc: 'Trade stock perpetuals powered by Autonom\'s CAN-normalized price feeds. Corporate actions like splits and dividends are absorbed automatically.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
    label: 'Commodities',
    assets: 'GOLD · OIL · SILVER · NATGAS',
    color: '#F5A623',
    bg: 'rgba(245,166,35,0.06)',
    border: 'rgba(245,166,35,0.2)',
    desc: 'Trade commodity perpetuals using Autonom\'s CFD benchmark feeds — aligned with how perpetuals price commodities in DeFi.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B06EFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/>
        <rect x="2" y="14" width="7" height="7"/><rect x="15" y="14" width="7" height="7"/>
      </svg>
    ),
    label: 'Baskets',
    assets: 'EV METALS · SEMICONDUCTORS',
    color: '#B06EFF',
    bg: 'rgba(176,110,255,0.06)',
    border: 'rgba(176,110,255,0.2)',
    desc: 'First-ever on-chain basket trading competition. Trade EV metals or semiconductor themes as a single perpetual. Scored by directional accuracy.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Connect Your Wallet',
    desc: 'Connect your Phantom wallet and register for the competition. No tokens required — just a signature.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Choose Your League',
    desc: 'Pick Equities, Commodities, or Baskets. Each league has separate leaderboards — compete against traders in your asset class.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h18v4H3z"/><path d="M3 10h12v4H3z"/><path d="M3 17h6v4H3z"/>
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Trade on Adrena',
    desc: 'Open and close RWA perpetual positions on Adrena during active market hours. Every closed trade counts toward your score.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    num: '04',
    title: 'Win by Skill',
    desc: 'Scored by Risk-Adjusted Return — a 15% gain on $5k beats a 3% gain on $500k. Capital doesn\'t buy rank. Skill does.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
  },
]

const FEATURES = [
  {
    title: 'Risk-Adjusted Scoring',
    desc: 'RAR formula: PnL% × Consistency multiplier × Streak bonus. Your percentage return wins — not your position size.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
  {
    title: 'Market Hours Aware',
    desc: 'Scoring pauses when NYSE closes. Autonom\'s market status API ensures you can\'t game the spread on stale prices.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
  {
    title: 'Corporate Action Safe',
    desc: 'Apple does a 4:1 split mid-competition? No problem. Autonom\'s CAN normalization absorbs it automatically.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B06EFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    title: 'QRNG Verified Raffles',
    desc: 'Weekly prize draws powered by Autonom\'s quantum randomness — sourced from ANU, committed on-chain. Provably fair.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D4AA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    title: 'Streak Bonuses',
    desc: 'Trade every market session and earn streak multipliers on your RAR score. Consistency is rewarded.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
  {
    title: 'Achievements & Badges',
    desc: 'Unlock exclusive RWA titles: Equity Analyst, Commodity Trader, Basket Weaver, RWA Leviathan.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B06EFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
      </svg>
    ),
  },
]

export default function AboutPage() {
  const router = useRouter()

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-text-size-adjust: 100%; }
        body { background: #080B10; color: #E8EAF0; font-family: 'Syne', sans-serif; overflow-x: hidden; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fade { animation: fadeUp 0.5s ease forwards; }
        .btn { cursor: pointer; border: none; transition: all 0.2s; -webkit-tap-highlight-color: transparent; }
        .btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .card { transition: border-color 0.2s, transform 0.2s; }
        .card:hover { transform: translateY(-2px); }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#080B10', overflowX: 'hidden' }}>

        {/* Background */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)`, backgroundSize: '48px 48px' }} />
        <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', zIndex: 0, pointerEvents: 'none', background: 'radial-gradient(circle,rgba(0,212,170,0.08) 0%,transparent 70%)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', padding: '0 16px 80px' }}>

          {/* Back */}
          <div style={{ paddingTop: 20, marginBottom: 32 }}>
            <button className="btn" onClick={() => router.push('/')} style={{ background: 'none', color: '#555', fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Leaderboard
            </button>
          </div>

          {/* Hero */}
          <div className="fade" style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.15em', color: '#00D4AA', padding: '3px 10px', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 3, display: 'inline-block', marginBottom: 16 }}>
              ADRENA × AUTONOM
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 7vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 16 }}>
              The First RWA<br /><span style={{ color: '#00D4AA' }}>Trading Championship</span>
            </h1>
            <p style={{ color: '#888', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', fontFamily: "'Space Mono', monospace", maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.7 }}>
              Compete in Equities, Commodities, and Basket Perps. Scored by skill — not capital. The first on-chain competition built for real-world assets.
            </p>
            <button className="btn" onClick={() => router.push('/')} style={{
              padding: '12px 28px', borderRadius: 8,
              background: '#00D4AA', color: '#080B10',
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '0.95rem',
              letterSpacing: '0.02em'
            }}>
              View Leaderboard →
            </button>
          </div>

          {/* How it works */}
          <div style={{ marginBottom: 64 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>
              How It Works
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {STEPS.map((step, i) => (
                <div key={i} className="card" style={{
                  padding: '20px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  animationDelay: `${i * 0.1}s`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#00D4AA', fontWeight: 700 }}>{step.num}</span>
                    <span style={{ color: '#555' }}>{step.icon}</span>
                  </div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>{step.title}</div>
                  <div style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.6 }}>{step.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Leagues */}
          <div style={{ marginBottom: 64 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
              Three Leagues
            </h2>
            <p style={{ color: '#666', fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', textAlign: 'center', marginBottom: 32 }}>
              Each league has its own leaderboard. Compete in your domain.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {LEAGUES.map((league, i) => (
                <div key={i} className="card" style={{
                  padding: '24px', borderRadius: 12,
                  background: league.bg,
                  border: `1px solid ${league.border}`,
                }}>
                  <div style={{ marginBottom: 12 }}>{league.icon}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: league.color, marginBottom: 4 }}>{league.label}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.65rem', color: '#666', letterSpacing: '0.08em', marginBottom: 12 }}>{league.assets}</div>
                  <div style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.6 }}>{league.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring */}
          <div style={{ marginBottom: 64, padding: '28px', borderRadius: 16, background: 'rgba(0,212,170,0.04)', border: '1px solid rgba(0,212,170,0.15)' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)', fontWeight: 800, marginBottom: 8 }}>
              The Scoring Formula
            </h2>
            <p style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 20 }}>
              We score by Risk-Adjusted Return (RAR) — not raw dollar profit. This means a skilled trader with a small account can beat a whale who barely moved the needle.
            </p>
            <div style={{ padding: '16px', borderRadius: 8, background: 'rgba(0,0,0,0.3)', fontFamily: "'Space Mono', monospace", fontSize: 'clamp(0.7rem, 2vw, 0.85rem)', color: '#00D4AA', marginBottom: 20, overflowX: 'auto', whiteSpace: 'nowrap' }}>
              RAR = (PnL_normalized / Collateral × 100) × Consistency × Streak_bonus
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: 'PnL_normalized', desc: 'Uses Autonom CAN-adjusted prices. Splits and dividends don\'t break your score.' },
                { label: 'Consistency (0.5×–2.0×)', desc: 'Based on win rate over min 5 trades. Lucky one-offs don\'t dominate.' },
                { label: 'Streak bonus (1.0×–1.5×)', desc: '+10% per active market session streak. Rewards daily engagement.' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#00D4AA', marginBottom: 6, fontWeight: 700 }}>{item.label}</div>
                  <div style={{ color: '#888', fontSize: '0.78rem', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Features grid */}
          <div style={{ marginBottom: 64 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.2rem, 4vw, 1.6rem)', fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>
              What Makes This Different
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              {FEATURES.map((f, i) => (
                <div key={i} className="card" style={{ padding: '18px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    {f.icon}
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.9rem' }}>{f.title}</span>
                  </div>
                  <div style={{ color: '#888', fontSize: '0.8rem', lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', padding: '40px 20px', borderRadius: 16, background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.15)' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: 800, marginBottom: 12 }}>
              Ready to Compete?
            </h2>
            <p style={{ color: '#888', fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', marginBottom: 24 }}>
              Season 1 is live. Connect your wallet and enter the championship.
            </p>
            <button className="btn" onClick={() => router.push('/')} style={{
              padding: '12px 32px', borderRadius: 8,
              background: '#00D4AA', color: '#080B10',
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1rem',
            }}>
              Enter the Championship →
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
