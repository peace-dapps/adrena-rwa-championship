'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeProvider'
import WalletButton from './WalletButton'

const NAV_ITEMS = [
  {
    label: 'Leaderboard',
    href: '/',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    )
  },
  {
    label: 'Season',
    href: '/season',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    )
  },
  {
    label: 'Raffle',
    href: '/raffle',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    )
  },
  {
    label: 'How It Works',
    href: '/about',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    )
  },
]

export default function TopNav() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <>
      <style>{`
        .top-nav { display: flex; }
        .top-nav-links { display: flex; }
        @media (max-width: 768px) {
          .top-nav { display: none !important; }
        }
      `}</style>

      <div className="top-nav" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--nav-bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 52, width: '100%',
        }}>
          {/* Logo */}
          <button onClick={() => router.push('/')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Space Mono', monospace", fontSize: '0.72rem',
            letterSpacing: '0.1em', color: 'var(--accent-green)', fontWeight: 700,
            flexShrink: 0,
          }}>
            ADRENA × AUTONOM
          </button>

          {/* Nav links */}
          <div className="top-nav-links" style={{ alignItems: 'center', gap: 2 }}>
            {NAV_ITEMS.map(item => {
              const active = pathname === item.href
              return (
                <button key={item.href} onClick={() => router.push(item.href)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 6,
                  background: active ? 'var(--bg-card)' : 'none',
                  border: active ? '1px solid var(--border)' : '1px solid transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontFamily: "'Syne', sans-serif", fontWeight: active ? 700 : 500,
                  fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <span style={{ color: active ? 'var(--accent-green)' : 'var(--text-muted)' }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <ThemeToggle />
            <WalletButton />
          </div>
        </div>
      </div>
    </>
  )
}
