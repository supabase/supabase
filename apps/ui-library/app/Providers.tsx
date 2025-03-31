'use client'

import { Provider as JotaiProvider } from 'jotai'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'

import { FrameworkProvider } from '@/context/framework-context'
import { MobileMenuProvider } from '@/context/mobile-menu-context'
import { AuthProvider, IS_PLATFORM, PageTelemetry } from 'common'
import { TooltipProvider } from 'ui'
import { useConsent } from 'ui-patterns/ConsentToast'
import { API_URL } from '@/lib/constants'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const { hasAcceptedConsent } = useConsent()

  return (
    <AuthProvider>
      <JotaiProvider>
        <NextThemesProvider {...props}>
          <MobileMenuProvider>
            <FrameworkProvider>
              <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
            </FrameworkProvider>
          </MobileMenuProvider>
        </NextThemesProvider>
        <PageTelemetry
          API_URL={API_URL}
          hasAcceptedConsent={hasAcceptedConsent}
          enabled={IS_PLATFORM}
        />
      </JotaiProvider>
    </AuthProvider>
  )
}
