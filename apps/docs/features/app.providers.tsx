import type { PropsWithChildren } from 'react'

import { FeatureFlagProvider, IS_PLATFORM, ThemeProvider } from 'common'
import { DevToolbar, DevToolbarProvider } from 'dev-tools'
import { SonnerToaster, TooltipProvider } from 'ui'
import SiteLayout from '~/layouts/SiteLayout'
import { API_URL } from '~/lib/constants'
import { AuthContainer } from './auth/auth.client'
import { DocsCommandMenu, DocsCommandProvider } from './command'
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
          <DevToolbarProvider apiUrl={API_URL}>
            <PageTelemetry />
            <ScrollRestoration />
            <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
              <TooltipProvider delayDuration={0}>
                <DocsCommandProvider>
                  <div className="flex flex-col">
                    <SiteLayout>
                      {children}
                      <DocsCommandMenu />
                    </SiteLayout>
                    <ThemeSandbox />
                  </div>
                </DocsCommandProvider>
                <SonnerToaster position="top-right" />
                <DevToolbar />
              </TooltipProvider>
            </ThemeProvider>
          </DevToolbarProvider>
        </FeatureFlagProvider>
      </AuthContainer>
    </QueryClientProvider>
  )
}

export { GlobalProviders }
