import '@ui/layout/ai-icon-animation/ai-icon-animation-style.module.css'
import './globals.css'

import Footer from '@/components/Footer'
import Header from '@/components/Header/Header'
import { ThemeProvider } from '@/components/providers'
import type { Metadata } from 'next'
import { LoadingLine } from './LoadingLine'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'database.design',
  description: 'Generate schemas from your ideas',
}

// suppressHydrationWarning:
// https://github.com/pacocoursey/next-themes#with-app
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark h-full bg-background" suppressHydrationWarning>
      <body className="flex flex-col h-full">
        <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
          <Header />
          <LoadingLine />
          <main role="main" className="h-full w-full flex flex-col grow">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
