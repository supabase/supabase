import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../styles/main.scss'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

import Head from 'next/head'
import { ThemeProvider } from 'common'
import { PortalToast, PromoToast, TabsProvider } from 'ui'

import MetaFaviconsPagesRouter from 'common/MetaFavicons/pages-router'
import { AuthContainer, SignOutHandler } from '~/features/auth/auth.client'
import { QueryClientProvider } from '~/features/data/queryClient.client'
import { RefDocHistoryHandler } from '~/features/docs/reference/navigation.client'
import { ShortcutPreviewBuild } from '~/features/staging/staging.client'
import { PageTelemetry } from '~/features/telemetry/telemetry.client'
import { ThemeSandbox } from '~/features/ui/theme/theme.client'
import { ScrollRestoration } from '~/features/ui/utils/scroll.client'
import SiteLayout from '~/layouts/SiteLayout'
import type { AppPropsWithLayout } from '~/types'
import { CommandMenuProvider } from 'ui-patterns/Cmdk'

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  return (
    <ShortcutPreviewBuild>
      <MetaFaviconsPagesRouter applicationName="Supabase Docs" />
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <QueryClientProvider>
        <AuthContainer>
          <SignOutHandler>
            <PageTelemetry />
            <ScrollRestoration />
            <RefDocHistoryHandler />
            <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
              <CommandMenuProvider site="docs">
                <TabsProvider>
                  <div className="h-screen flex flex-col">
                    <SiteLayout>
                      <PortalToast />
                      <PromoToast />
                      <Component {...pageProps} />
                    </SiteLayout>
                    <ThemeSandbox />
                  </div>
                </TabsProvider>
              </CommandMenuProvider>
            </ThemeProvider>
          </SignOutHandler>
        </AuthContainer>
      </QueryClientProvider>
    </ShortcutPreviewBuild>
  )
}

export default MyApp
