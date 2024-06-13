import 'katex/dist/katex.min.css'
import './globals.css'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cn } from 'ui'
import Providers from '~/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DB Playground',
  description: 'In-browser Postgres sandbox with AI assistance',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
