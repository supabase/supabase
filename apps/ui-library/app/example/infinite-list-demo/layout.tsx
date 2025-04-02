import type { Metadata } from 'next'

import { ThemeProvider } from '@/app/Providers'

import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Infinite Data Table Demo',
  description: 'Demonstration of the Infinite Data Table component.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
