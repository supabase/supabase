import { type PropsWithChildren } from 'react'

import { FeatureFlagProvider, IS_PLATFORM, ThemeProvider } from 'common'
import { SonnerToaster, TooltipProvider } from 'ui'
import { CommandProvider } from 'ui-patterns/CommandMenu'
import SiteLayout from '~/layouts/SiteLayout'
import { API_URL } from '~/lib/constants'
import { AuthContainer } from './auth/auth.client'
import { DocsCommandMenu } from './command'
import { QueryClientProvider } from './data/queryClient.client'
import { PageTelemetry } from './telemetry/telemetry.client'
import { ScrollRestoration } from './ui/helpers.scroll.client'
import { ThemeSandbox } from './ui/theme.client'

/**
 * Global providers that wrap the entire app
 */
function GlobalProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider>
      <AuthContainer>
        <FeatureFlagProvider API_URL={API_URL} enabled={IS_PLATFORM}>
          <PageTelemetry />
          <ScrollRestoration />
          <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
            <TooltipProvider delayDuration={0}>
              <CommandProvider>
                <div className="flex flex-col">
                  <SiteLayout>
                    {children}
                    <DocsCommandMenu />
                  </SiteLayout>
                  <ThemeSandbox />
                </div>
              </CommandProvider>
              <SonnerToaster position="top-right" />
            </TooltipProvider>
          </ThemeProvider>
        </FeatureFlagProvider>
      </AuthContainer>
    </QueryClientProvider>
  )
}

export { GlobalProviders }
