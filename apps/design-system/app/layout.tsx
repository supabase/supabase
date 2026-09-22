import 'react-data-grid/lib/styles.css'
import '@/styles/globals.css'

import { genFaviconData } from 'common/MetaFavicons/app-router'
import type { Metadata, Viewport } from 'next'

import { Providers } from './Providers'
import { Toaster } from './toaster'
import { BASE_PATH } from '@/lib/constants'
import { inter, manrope, sourceCodePro } from '@/lib/fonts'

const className = `${inter.variable} ${manrope.variable} ${sourceCodePro.variable}`

export const metadata: Metadata = {
  applicationName: 'Supabase Design System',
  title: 'Supabase Design System',
  description: 'Design resources for building consistent user experiences at Supabase.',
  icons: genFaviconData(BASE_PATH),
}

export const viewport: Viewport = {
  themeColor: '#1E1E1E',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function Layout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className={className}>
      <head>
        {/* [Danny]: This has to be an inline style tag here and not a separate component due to next/font */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--font-sans:${inter.style.fontFamily};--font-heading:${manrope.style.fontFamily};--font-source-code-pro:${sourceCodePro.style.fontFamily};}`,
          }}
        />
      </head>
      <body>
        <Providers>
          <div vaul-drawer-wrapper="">
            <div className="relative flex min-h-screen flex-col bg-background">{children}</div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
