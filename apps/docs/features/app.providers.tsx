import { type PropsWithChildren } from 'react'

import { ThemeProvider } from 'common'
import { SonnerToaster } from 'ui'
import { CommandProvider } from 'ui-patterns/CommandMenu'
// import { PromoToast } from 'ui-patterns/PromoToast'
import SiteLayout from '~/layouts/SiteLayout'
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
        <PageTelemetry />
        <ScrollRestoration />
        <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
          <CommandProvider>
            <div className="flex flex-col">
              <SiteLayout>
                {/* <PromoToast /> */}
                {children}
                <DocsCommandMenu />
              </SiteLayout>
              <ThemeSandbox />
            </div>
          </CommandProvider>
          <SonnerToaster position="top-right" />
        </ThemeProvider>
      </AuthContainer>
    </QueryClientProvider>
  )
}

export { GlobalProviders }
