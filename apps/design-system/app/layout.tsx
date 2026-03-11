import '@/styles/globals.css'
import '../../studio/styles/typography.scss'

import type { Metadata, Viewport } from 'next'

import { customFont, sourceCodePro } from './fonts'
import { ThemeProvider } from './Providers'
import { SonnerToaster } from './SonnerToast'

const className = `${customFont.variable} ${sourceCodePro.variable}`

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/design-system'

const genFaviconData = (basePath: string): Metadata['icons'] => ({
  icon: {
    url: `${basePath}/favicon/favicon.ico`,
    type: 'image/x-icon',
  },
  shortcut: `${basePath}/favicon/favicon.ico`,
  apple: `${basePath}/favicon/favicon.ico`,
  other: [
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-icon-57x57.png`,
      sizes: '57x57',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-icon-60x60.png`,
      sizes: '60x60',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-icon-72x72.png`,
      sizes: '72x72',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-icon-76x76.png`,
      sizes: '76x76',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-icon-114x114.png`,
      sizes: '114x114',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-icon-120x120.png`,
      sizes: '120x120',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-icon-144x144.png`,
      sizes: '144x144',
    },
    {
      rel: 'apple-touch-icon-precomposed',
      url: `${basePath}/favicon/apple-icon-152x152.png`,
      sizes: '152x152',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-16x16.png`,
      type: 'image/png',
      sizes: '16x16',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-32x32.png`,
      type: 'image/png',
      sizes: '32x32',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-48x48.png`,
      type: 'image/png',
      sizes: '48x48',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-96x96.png`,
      type: 'image/png',
      sizes: '96x96',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-128x128.png`,
      type: 'image/png',
      sizes: '128x128',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-180x180.png`,
      type: 'image/png',
      sizes: '180x180',
    },
    {
      rel: 'icon',
      url: `${basePath}/favicon/favicon-196x196.png`,
      type: 'image/png',
      sizes: '196x196',
    },
  ],
})

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
            __html: `:root{--font-custom:${customFont.style.fontFamily};--font-source-code-pro:${sourceCodePro.style.fontFamily};}`,
          }}
        />
      </head>
      <body>
        <ThemeProvider
          themes={['dark', 'light', 'classic-dark']}
          defaultTheme="system"
          enableSystem
        >
          <div vaul-drawer-wrapper="">
            <div className="relative flex min-h-screen flex-col bg-background">{children}</div>
          </div>
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
