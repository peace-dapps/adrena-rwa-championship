'use client'

import { useRouter, usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    label: 'Leaderboard',
    href: '/',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent-green)' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    )
  },
  {
    label: 'Season',
    href: '/season',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent-orange)' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    )
  },
  {
    label: 'Raffle',
    href: '/raffle',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent-purple)' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    )
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent-green)' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    )
  },
  {
    label: 'Quests',
    href: '/quests',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--accent-orange)' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    )
  },
]

export default function MobileNav() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <>
      <style>{`
        .mobile-nav { display: none; }
        @media (max-width: 768px) {
          .mobile-nav { display: flex; }
          .page-content { padding-bottom: 72px !important; }
        }
      `}</style>
      <div className="mobile-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--nav-bg)',
        borderTop: '1px solid var(--border)',
        alignItems: 'center', justifyContent: 'space-around',
        padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
        backdropFilter: 'blur(12px)',
      }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <button key={item.href} onClick={() => router.push(item.href)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 16px',
              borderRadius: 8, WebkitTapHighlightColor: 'transparent',
            }}>
              {item.icon(active)}
              <span style={{
                fontSize: '0.6rem', fontFamily: "'Space Mono', monospace",
                color: active ? 'var(--text-primary)' : '#666',
                letterSpacing: '0.05em', fontWeight: active ? 700 : 400,
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
