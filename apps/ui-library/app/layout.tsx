import type { Metadata } from 'next'

import '@/styles/globals.css'
import { genFaviconData } from 'common/MetaFavicons/app-router'
import { Inter } from 'next/font/google'
import { ThemeProvider } from './Providers'
import { SonnerToaster } from './SonnerToast'

const inter = Inter({ subsets: ['latin'] })

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export const metadata: Metadata = {
  applicationName: 'Supabase UI Library',
  title: 'Supabase UI Library',
  description: 'Provides a library of components for your project',
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
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          themes={['dark', 'light', 'classic-dark']}
          defaultTheme="system"
          enableSystem
        >
          {children}
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
