import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../styles/main.scss'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

import { ThemeProvider } from 'common'
import MetaFaviconsPagesRouter from 'common/MetaFavicons/pages-router'
import Head from 'next/head'
import { PortalToast } from 'ui'
import { PromoToast } from 'ui-patterns/PromoToast'
import { CommandMenuProvider } from 'ui-patterns/Cmdk'
import { AuthContainer } from '~/features/auth/auth.client'
import { QueryClientProvider } from '~/features/data/queryClient.client'
import { ShortcutPreviewBuild } from '~/features/envs/staging.client'
import { PageTelemetry } from '~/features/telemetry/telemetry.client'
import { ThemeSandbox } from '~/features/ui/theme.client'
import { ScrollRestoration } from '~/features/ui/helpers.scroll.client'
import SiteLayout from '~/layouts/SiteLayout'
import type { AppPropsWithLayout } from '~/types'

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  return (
    <ShortcutPreviewBuild>
      <MetaFaviconsPagesRouter applicationName="Supabase Docs" />
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <QueryClientProvider>
        <AuthContainer>
          <PageTelemetry />
          <ScrollRestoration />
          <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
            <CommandMenuProvider site="docs">
              <div className="h-screen flex flex-col">
                <SiteLayout>
                  <PortalToast />
                  <PromoToast />
                  <Component {...pageProps} />
                </SiteLayout>
                <ThemeSandbox />
              </div>
            </CommandMenuProvider>
          </ThemeProvider>
        </AuthContainer>
      </QueryClientProvider>
    </ShortcutPreviewBuild>
  )
}

export default MyApp
