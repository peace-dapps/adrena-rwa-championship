import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RWA Championship | Adrena × Autonom',
  description: 'The first on-chain trading competition for real-world assets. Equities, commodities, and basket perps — scored by skill, not capital.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#080B10' }}>
        {children}
      </body>
    </html>
  )
}
