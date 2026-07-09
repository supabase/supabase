import './globals.css'

import type { Metadata, Viewport } from 'next'
import { SonnerToaster } from 'ui'

import { Providers } from './Providers'

export const metadata: Metadata = {
  title: 'Sales Dashboard',
  description: 'Track leads, quotes, and follow-ups on the go.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1c1c1c' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <Providers>
          {children}
          <SonnerToaster position="top-center" />
        </Providers>
      </body>
    </html>
  )
}
