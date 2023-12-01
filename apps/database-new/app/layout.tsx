import '@ui/layout/ai-icon-animation/ai-icon-animation-style.module.css'
import './globals.css'

import Header from '@/components/Header/Header'
import { ReactQueryProvider, ThemeProvider } from '@/components/providers'
import type { Metadata } from 'next'
import Footer from '@/components/Footer'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'database.design',
  description: 'Generate schemas from your ideas',
}

// supressHydrationWarning:
// https://github.com/pacocoursey/next-themes#with-app
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark bg-background" suppressHydrationWarning>
      <body className="flex flex-col grow h-full">
        <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            <Header />
            {children}
            <Footer />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
