'use client'

import {
  AuthProvider,
  FeatureFlagProvider,
  IS_PLATFORM,
  PageTelemetry,
  ThemeProvider,
  useThemeSandbox,
  TelemetryTagManager,
} from 'common'
import { themes, TooltipProvider, SonnerToaster } from 'ui'
import { CommandProvider } from 'ui-patterns/CommandMenu'
import { useConsentToast } from 'ui-patterns/consent'
import { API_URL } from '~/lib/constants'
import { WwwCommandMenu } from '~/components/CommandMenu'

function Providers({ children }: { children: React.ReactNode }) {
  useThemeSandbox()
  const { hasAcceptedConsent } = useConsentToast()

  return (
    <AuthProvider>
      <FeatureFlagProvider API_URL={API_URL} enabled={IS_PLATFORM}>
        <ThemeProvider themes={themes.map((t) => t.value)} enableSystem disableTransitionOnChange>
          <TooltipProvider delayDuration={0}>
            <CommandProvider>
              <TelemetryTagManager />
              <SonnerToaster position="top-right" />
              {children}
              <WwwCommandMenu />
              <PageTelemetry
                API_URL={API_URL}
                hasAcceptedConsent={hasAcceptedConsent}
                enabled={IS_PLATFORM}
              />
            </CommandProvider>
          </TooltipProvider>
        </ThemeProvider>
      </FeatureFlagProvider>
    </AuthProvider>
  )
}

export default Providers
