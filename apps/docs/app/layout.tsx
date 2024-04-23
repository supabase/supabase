import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../styles/main.scss'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

import { ThemeProvider } from 'common'
import { type Metadata, type Viewport } from 'next'
import { PortalToast, TabsProvider } from 'ui'
import { CommandMenuProvider } from 'ui-patterns/Cmdk'

import { AuthContainer, SignOutHandler } from '~/features/auth/auth.client'
import { QueryClientProvider } from '~/features/data/queryClient.client'
import { RefDocHistoryHandler } from '~/features/docs/reference/navigation.client'
import { ShortcutPreviewBuild } from '~/features/staging/staging.client'
import { PageTelemetry } from '~/features/telemetry/telemetry.client'
import { favicons } from '~/features/ui/favicons/faviconData'
import { ThemeSandbox } from '~/features/ui/theme/theme.client'
import { ScrollRestoration } from '~/features/ui/utils/scroll.client'
import SiteLayout from '~/layouts/SiteLayout'
import { BASE_PATH } from '~/lib/constants'

const metadata: Metadata = {
  applicationName: 'Supabase Docs',
  title: 'Supabase Docs',
  description:
    'Supabase is an open source Firebase alternative providing all the backend features you need to build a product.',
  metadataBase: new URL('https://supabase.com'),
  icons: {
    other: favicons,
  },
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
          <SignOutHandler>
            <PageTelemetry />
            <ScrollRestoration />
            <RefDocHistoryHandler />
            <html lang="en">
              <body>
                <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
                  <CommandMenuProvider site="docs">
                    <TabsProvider>
                      <div className="h-screen flex flex-col">
                        <SiteLayout>
                          <PortalToast />
                          {children}
                        </SiteLayout>
                      </div>
                    </TabsProvider>
                  </CommandMenuProvider>
                  <ThemeSandbox />
                </ThemeProvider>
              </body>
            </html>
          </SignOutHandler>
        </AuthContainer>
      </QueryClientProvider>
    </ShortcutPreviewBuild>
  )
}

export { metadata, viewport }
export default RootLayout
