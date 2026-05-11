'use client'

import {
  AuthProvider,
  FeatureFlagProvider,
  IS_PLATFORM,
  PageTelemetry,
  TelemetryTagManager,
  ThemeProvider,
  useThemeSandbox,
} from 'common'
import { WwwCommandMenu } from 'components/CommandMenu'
import { FontDevtools } from 'components/FontDevtools'
import { DevToolbar, DevToolbarProvider } from 'dev-tools'
import { API_URL, IS_PROD } from 'lib/constants'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Suspense } from 'react'
import { themes, TooltipProvider } from 'ui'
import { CommandProvider } from 'ui-patterns/CommandMenu'
import { useConsentToast } from 'ui-patterns/consent'

import { Toaster } from './toaster'

function Providers({ children }: { children: React.ReactNode }) {
  useThemeSandbox()
  const { hasAcceptedConsent } = useConsentToast()

  return (
    <NuqsAdapter>
      <AuthProvider>
        <FeatureFlagProvider API_URL={API_URL} enabled={IS_PLATFORM}>
          <DevToolbarProvider apiUrl={API_URL}>
            <ThemeProvider
              themes={themes.map((t) => t.value)}
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider delayDuration={0}>
                <CommandProvider>
                  <TelemetryTagManager />
                  <Toaster />
                  <Suspense fallback={null}>{children}</Suspense>
                  <WwwCommandMenu />
                  <PageTelemetry
                    API_URL={API_URL}
                    hasAcceptedConsent={hasAcceptedConsent}
                    enabled={IS_PLATFORM}
                  />
                  <DevToolbar />
                  {!IS_PROD && <FontDevtools />}
                </CommandProvider>
              </TooltipProvider>
            </ThemeProvider>
          </DevToolbarProvider>
        </FeatureFlagProvider>
      </AuthProvider>
    </NuqsAdapter>
  )
}

export default Providers
