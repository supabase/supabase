import type { Metadata } from 'next'
import { ThemeProvider } from 'next-themes'

import './globals.css'
import '../../studio/styles/typography.scss'
import { customFont, sourceCodePro } from './fonts'

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Supabase Marketplace',
  description: 'Marketplace experience powered by Supabase',
}

const className = `${customFont.variable} ${sourceCodePro.variable}`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={className}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--font-custom:${customFont.style.fontFamily};--font-source-code-pro:${sourceCodePro.style.fontFamily};}`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          themes={['dark', 'light', 'classic-dark']}
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
