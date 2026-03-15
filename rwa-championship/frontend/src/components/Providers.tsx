'use client'

import { ThemeProvider } from './ThemeProvider'
import MobileNav from './MobileNav'
import TopNav from './TopNav'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TopNav />
      <div className="page-content">
        {children}
      </div>
      <MobileNav />
    </ThemeProvider>
  )
}
