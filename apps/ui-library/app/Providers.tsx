'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, ThemeProvider } from 'common'
import { Provider as JotaiProvider } from 'jotai'
import { PropsWithChildren } from 'react'
import { TooltipProvider } from 'ui'

import { FrameworkProvider } from '@/context/framework-context'
import { MobileMenuProvider } from '@/context/mobile-menu-context'
import { useRootQueryClient } from '@/lib/fetch/queryClient'

export function Providers({ children }: PropsWithChildren) {
  const queryClient = useRootQueryClient()

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <ThemeProvider>
            <MobileMenuProvider>
              <FrameworkProvider>
                <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
              </FrameworkProvider>
            </MobileMenuProvider>
          </ThemeProvider>
        </JotaiProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}
