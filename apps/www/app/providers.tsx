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
import { DevToolbar, DevToolbarProvider } from 'dev-tools'
import { API_URL } from 'lib/constants'
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
                  {/* Each side-effect-y component gets its own Suspense so any
                      bailout (e.g. a child reading useSearchParams or hitting a
                      hydration mismatch) stays contained and doesn't propagate
                      up past the provider chain to hide the page from crawlers
                      (FE-3079). */}
                  <Suspense fallback={null}>
                    <TelemetryTagManager />
                  </Suspense>
                  <Suspense fallback={null}>
                    <Toaster />
                  </Suspense>
                  <Suspense fallback={null}>{children}</Suspense>
                  <Suspense fallback={null}>
                    <WwwCommandMenu />
                  </Suspense>
                  <Suspense fallback={null}>
                    <PageTelemetry
                      API_URL={API_URL}
                      hasAcceptedConsent={hasAcceptedConsent}
                      enabled={IS_PLATFORM}
                    />
                  </Suspense>
                  <Suspense fallback={null}>
                    <DevToolbar />
                  </Suspense>
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
