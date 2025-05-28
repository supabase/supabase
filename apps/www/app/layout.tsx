import '@code-hike/mdx/styles'
import 'config/code-hike.scss'
import '../styles/index.css'

import {
  AuthProvider,
  FeatureFlagProvider,
  IS_PLATFORM,
  PageTelemetry,
  ThemeProvider,
} from 'common'
import { Metadata } from 'next'
import { SonnerToaster, themes, TooltipProvider } from 'ui'
import { CommandProvider } from 'ui-patterns'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'

import {
  DEFAULT_FAVICON_ROUTE,
  DEFAULT_FAVICON_THEME_COLOR,
} from 'common/MetaFavicons/pages-router'
import { WwwCommandMenu } from '~/components/CommandMenu'
import { API_URL, APP_NAME, DEFAULT_META_DESCRIPTION } from '~/lib/constants'
import { ConsentWrapper } from './ConsentWrapper'

const site_title = `${APP_NAME} | The Open Source Firebase Alternative`

export const metadata: Metadata = {
  title: site_title,
  description: DEFAULT_META_DESCRIPTION,
  openGraph: {
    type: 'website',
    url: 'https://supabase.com/',
    siteName: 'Supabase',
    images: [
      {
        url: 'https://supabase.com/images/og/supabase-og.png',
        width: 800,
        height: 600,
        alt: 'Supabase Og Image',
      },
    ],
  },
  twitter: {
    creator: '@supabase',
    site: '@supabase',
    card: 'summary_large_image',
  },
  viewport: 'width=device-width, initial-scale=1.0',
  icons: {
    icon: '/favicon/favicon.ico',
    shortcut: '/favicon/favicon.ico',
    apple: '/favicon/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <FeatureFlagProvider API_URL={API_URL} enabled={IS_PLATFORM}>
            <ThemeProvider
              themes={themes.map((theme) => theme.value)}
              enableSystem
              disableTransitionOnChange
            >
              <TooltipProvider delayDuration={0}>
                <CommandProvider>
                  <ConsentWrapper>
                    <SonnerToaster position="top-right" />
                    {children}
                    <WwwCommandMenu />
                  </ConsentWrapper>
                </CommandProvider>
              </TooltipProvider>
            </ThemeProvider>
          </FeatureFlagProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
