import type { Metadata } from 'next'

import '@/styles/globals.css'
import { API_URL } from '@/lib/constants'
import { FeatureFlagProvider, TelemetryTagManager } from 'common'
import { genFaviconData } from 'common/MetaFavicons/app-router'
import { Inter } from 'next/font/google'
import { ThemeProvider } from './Providers'
import { SonnerToaster } from './SonnerToast'

const inter = Inter({ subsets: ['latin'] })

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const metadata: Metadata = {
  applicationName: 'Learn Supabase',
  title: 'Learn Supabase',
  description: 'Learn Supabase.',
  metadataBase: new URL('https://supabase.com/learn'),
  icons: genFaviconData(BASE_PATH),
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

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function Layout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} antialiased`}>
        <TelemetryTagManager />
        <FeatureFlagProvider API_URL={API_URL}>
          <ThemeProvider
            themes={['dark', 'light', 'classic-dark']}
            defaultTheme="system"
            enableSystem
          >
            {children}
            <SonnerToaster />
          </ThemeProvider>
        </FeatureFlagProvider>
      </body>
    </html>
  )
}
