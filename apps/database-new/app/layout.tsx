import '@ui/layout/ai-icon-animation/ai-icon-animation-style.module.css'
import './globals.css'

import Header from '@/components/Header'
import { ReactQueryProvider, ThemeProvider } from '@/components/providers'
import type { Metadata } from 'next'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'database.new',
  description: 'Generate schemas from your ideas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <ThemeProvider defaultTheme="system" enableSystem disableTransitionOnChange>
          <ReactQueryProvider>
            <div className="flex flex-col h-full">
              <Header />
              <main role="main" className="grow">
                {children}
              </main>
            </div>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
