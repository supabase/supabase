import { type PropsWithChildren } from 'react'

import { FeatureFlagProvider, ThemeProvider } from 'common'
import { SonnerToaster } from 'ui'
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
        <FeatureFlagProvider API_URL={API_URL}>
          <PageTelemetry />
          <ScrollRestoration />
          <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
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
          </ThemeProvider>
        </FeatureFlagProvider>
      </AuthContainer>
    </QueryClientProvider>
  )
}

export { GlobalProviders }
