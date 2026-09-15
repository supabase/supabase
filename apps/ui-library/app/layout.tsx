import type { Metadata } from 'next'

import '@/styles/globals.css'

import { FeatureFlagProvider, TelemetryTagManager } from 'common'
import { genFaviconData } from 'common/MetaFavicons/app-router'
import { Inter, Manrope, Source_Code_Pro } from 'next/font/google'

import { Providers } from './Providers'
import { Toaster } from './toaster'
import { API_URL } from '@/lib/constants'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' })
const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
  display: 'swap',
})

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const metadata: Metadata = {
  applicationName: 'Supabase Library',
  title: 'Supabase Library',
  description: 'Supabase blocks and starter apps for authentication, storage, realtime, and more',
  metadataBase: new URL('https://supabase.com'),
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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head />
      <body
        className={`${inter.variable} ${manrope.variable} ${sourceCodePro.variable} font-sans antialiased`}
      >
        <TelemetryTagManager />
        <FeatureFlagProvider API_URL={API_URL}>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </FeatureFlagProvider>
      </body>
    </html>
  )
}
