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
import { themes, TooltipProvider } from 'ui'
import { CommandProvider } from 'ui-patterns/CommandMenu'
import { useConsentToast } from 'ui-patterns/consent'

import { Toaster } from './toaster'

function Providers({ children }: { children: React.ReactNode }) {
  useThemeSandbox()
  const { hasAcceptedConsent } = useConsentToast()

  return (
    <AuthProvider>
      <FeatureFlagProvider API_URL={API_URL} enabled={IS_PLATFORM}>
        <DevToolbarProvider apiUrl={API_URL}>
          <ThemeProvider themes={themes.map((t) => t.value)} enableSystem disableTransitionOnChange>
            <TooltipProvider delayDuration={0}>
              <CommandProvider>
                <TelemetryTagManager />
                <Toaster />
                {children}
                <WwwCommandMenu />
                <PageTelemetry
                  API_URL={API_URL}
                  hasAcceptedConsent={hasAcceptedConsent}
                  enabled={IS_PLATFORM}
                />
                <DevToolbar />
              </CommandProvider>
            </TooltipProvider>
          </ThemeProvider>
        </DevToolbarProvider>
      </FeatureFlagProvider>
    </AuthProvider>
  )
}

export default Providers
