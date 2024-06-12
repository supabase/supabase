import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../styles/main.scss'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

import { ThemeProvider } from 'common'
import { genFaviconData } from 'common/MetaFavicons/app-router'
import { type Metadata, type Viewport } from 'next'
import { PortalToast } from 'ui'
import { CommandMenuProvider } from 'ui-patterns/Cmdk'
import { AuthContainer } from '~/features/auth/auth.client'
import { QueryClientProvider } from '~/features/data/queryClient.client'
import { ShortcutPreviewBuild } from '~/features/envs/staging.client'
import { PageTelemetry } from '~/features/telemetry/telemetry.client'
import { ThemeSandbox } from '~/features/ui/theme.client'
import { ScrollRestoration } from '~/features/ui/helpers.scroll.client'
import SiteLayout from '~/layouts/SiteLayout'
import { BASE_PATH } from '~/lib/constants'

const metadata: Metadata = {
  applicationName: 'Supabase Docs',
  title: 'Supabase Docs',
  description:
    'Supabase is an open source Firebase alternative providing all the backend features you need to build a product.',
  metadataBase: new URL('https://supabase.com'),
  icons: genFaviconData(BASE_PATH),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'article',
    authors: 'Supabase',
    url: `${BASE_PATH}`,
    images: `${BASE_PATH}/img/supabase-og-image.png`,
    publishedTime: new Date().toISOString(),
    modifiedTime: new Date().toISOString(),
  },
  twitter: {
    card: 'summary_large_image',
    site: '@supabase',
    creator: '@supabase',
    images: `${BASE_PATH}/img/supabase-og-image.png`,
  },
}

const viewport: Viewport = {
  themeColor: '#1E1E1E',
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ShortcutPreviewBuild>
      <QueryClientProvider>
        <AuthContainer>
          <PageTelemetry />
          <ScrollRestoration />
          <html lang="en">
            <body>
              <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
                <CommandMenuProvider site="docs">
                  <div className="h-screen flex flex-col">
                    <SiteLayout>
                      <PortalToast />
                      {children}
                    </SiteLayout>
                  </div>
                </CommandMenuProvider>
                <ThemeSandbox />
              </ThemeProvider>
            </body>
          </html>
        </AuthContainer>
      </QueryClientProvider>
    </ShortcutPreviewBuild>
  )
}

export { metadata, viewport }
export default RootLayout
