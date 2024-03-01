import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../styles/main.scss'
import '../styles/new-docs.scss'
import '../styles/prism-okaidia.scss'

import { type Metadata } from 'next'

import { ThemeProvider } from 'common'
import { PortalToast, TabsProvider } from 'ui'

import { AuthContainer, SignOutHandler } from '~/features/auth/auth.client'
import { QueryClientProvider } from '~/features/data/queryClient.client'
import { RefDocHistoryHandler } from '~/features/docs/reference/navigation.client'
import { alternates, metadata as generalMetadata } from '~/features/robots/metadata'
import { ShortcutPreviewBuild } from '~/features/staging/staging.client'
import { PageTelemetry } from '~/features/telemetry/telemetry.client'
import { favicons } from '~/features/ui/favicons/faviconData'
import { ThemeSandbox } from '~/features/ui/theme/theme.client'
import { ScrollRestoration } from '~/features/ui/utils/scroll.client'
import SiteLayout from '~/layouts/SiteLayout'
import { CommandMenuProvider } from 'ui-patterns/Cmdk'

const metadata: Metadata = {
  title: 'Supabase Docs',
  description:
    'Supabase is an open source Firebase alternative providing all the backend features you need to build a product.',
  ...generalMetadata,
  ...alternates,
  icons: {
    other: favicons,
  },
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

export { metadata }
export default RootLayout
