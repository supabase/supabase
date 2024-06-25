import PromoToast from '@ui-patterns/PromoToast'
import { ThemeProvider } from 'common'
import { PortalToast } from 'ui'
import { type PropsWithChildren } from 'react'

import SiteLayout from '~/layouts/SiteLayout'
import { AuthContainer } from './auth/auth.client'
import { QueryClientProvider } from './data/queryClient.client'
import { ShortcutPreviewBuild } from './envs/staging.client'
import { PageTelemetry } from './telemetry/telemetry.client'
import { ScrollRestoration } from './ui/helpers.scroll.client'
import { ThemeSandbox } from './ui/theme.client'
import { CommandProvider } from '@ui-patterns/CommandMenu'
import { DocsCommandMenu } from '~/components/CommandMenu'

/**
 * Global providers that wrap the entire app
 */
function GlobalProviders({ children }: PropsWithChildren) {
  return (
    <ShortcutPreviewBuild>
      <QueryClientProvider>
        <AuthContainer>
          <PageTelemetry />
          <ScrollRestoration />
          <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
            <CommandProvider>
              <div className="h-screen flex flex-col">
                <SiteLayout>
                  <PortalToast />
                  <PromoToast />
                  {children}
                  <DocsCommandMenu />
                </SiteLayout>
                <ThemeSandbox />
              </div>
            </CommandProvider>
          </ThemeProvider>
        </AuthContainer>
      </QueryClientProvider>
    </ShortcutPreviewBuild>
  )
}

export { GlobalProviders }
