import { type PropsWithChildren } from 'react'

import { CommandProvider } from '@ui-patterns/CommandMenu'
import { SearchWorkerProvider } from '@ui-patterns/CommandMenu/prepackaged/DocsSearchLocal'
import { ThemeProvider } from 'common'
import { PortalToast } from 'ui'
import { PromoToast } from 'ui-patterns'

import SiteLayout from '~/layouts/SiteLayout'
import { AuthContainer } from './auth/auth.client'
import { DocsCommandMenu } from './command'
import { QueryClientProvider } from './data/queryClient.client'
import { ShortcutPreviewBuild } from './envs/staging.client'
import { PageTelemetry } from './telemetry/telemetry.client'
import { ScrollRestoration } from './ui/helpers.scroll.client'
import { ThemeSandbox } from './ui/theme.client'

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
            <SearchWorkerProvider>
              <CommandProvider>
                <div className="flex flex-col">
                  <SiteLayout>
                    <PortalToast />
                    <PromoToast />
                    {children}
                    <DocsCommandMenu />
                  </SiteLayout>
                  <ThemeSandbox />
                </div>
              </CommandProvider>
            </SearchWorkerProvider>
          </ThemeProvider>
        </AuthContainer>
      </QueryClientProvider>
    </ShortcutPreviewBuild>
  )
}

export { GlobalProviders }
