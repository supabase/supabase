'use client'

import { AuthProvider, ThemeProvider } from 'common'
import { Provider as JotaiProvider } from 'jotai'
import { PropsWithChildren } from 'react'
import { TooltipProvider } from 'ui'

import { FrameworkProvider } from '@/context/framework-context'
import { MobileMenuProvider } from '@/context/mobile-menu-context'

export function Providers({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <JotaiProvider>
        <ThemeProvider>
          <MobileMenuProvider>
            <FrameworkProvider>
              <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
            </FrameworkProvider>
          </MobileMenuProvider>
        </ThemeProvider>
      </JotaiProvider>
    </AuthProvider>
  )
}
