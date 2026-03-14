import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RWA Championship | Adrena × Autonom',
  description: 'The first on-chain trading competition for real-world assets. Equities, commodities, and basket perps — scored by skill, not capital.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="page-content">
          {children}
        </div>
      </body>
    </html>
  )
}