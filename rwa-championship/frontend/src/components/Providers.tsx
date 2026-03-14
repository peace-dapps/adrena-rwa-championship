'use client'

import { ThemeProvider } from './ThemeProvider'
import MobileNav from './MobileNav'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="page-content">
        {children}
      </div>
      <MobileNav />
    </ThemeProvider>
  )
}
