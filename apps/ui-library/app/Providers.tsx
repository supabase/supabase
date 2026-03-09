'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from 'common'
import { Provider as JotaiProvider } from 'jotai'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { TooltipProvider } from 'ui'

import { FrameworkProvider } from '@/context/framework-context'
import { MobileMenuProvider } from '@/context/mobile-menu-context'
import { useRootQueryClient } from '@/lib/fetch/queryClient'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const queryClient = useRootQueryClient()

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <NextThemesProvider {...props}>
            <MobileMenuProvider>
              <FrameworkProvider>
                <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
              </FrameworkProvider>
            </MobileMenuProvider>
          </NextThemesProvider>
        </JotaiProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}
