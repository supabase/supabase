'use client'

import { ThemeProvider } from 'common'
import { Provider as JotaiProvider } from 'jotai'
import { TooltipProvider } from 'ui'

import { MobileSidebarProvider } from '@/context/mobile-sidebar-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <ThemeProvider>
        <TooltipProvider delayDuration={0}>
          <MobileSidebarProvider>{children}</MobileSidebarProvider>
        </TooltipProvider>
      </ThemeProvider>
    </JotaiProvider>
  )
}
