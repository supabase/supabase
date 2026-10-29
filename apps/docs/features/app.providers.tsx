import { FeedbackDockProvider } from '~/components/Feedback/FeedbackDockProvider'
import SiteLayout from '~/layouts/SiteLayout'
import { API_URL } from '~/lib/constants'
import { FeatureFlagProvider, IS_PLATFORM, ThemeProvider } from 'common'
import { DevToolbar, DevToolbarProvider } from 'dev-tools'
import type { PropsWithChildren } from 'react'
import { TooltipProvider } from 'ui'

import { AuthContainer } from './auth/auth.client'
import { QueryClientProvider } from './data/queryClient.client'
import { PageTelemetry } from './telemetry/telemetry.client'
import { Toaster } from './toaster'
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
            <ThemeProvider>
              <TooltipProvider delayDuration={0}>
                <FeedbackDockProvider>
                  <div className="flex flex-col">
                    <SiteLayout>{children}</SiteLayout>
                    <ThemeSandbox />
                  </div>
                </FeedbackDockProvider>
                <Toaster />
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
