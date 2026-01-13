import '@/styles/globals.css'
import '../../studio/styles/typography.scss'
import type { Metadata } from 'next'
import { ThemeProvider } from './Providers'
import { SonnerToaster } from './SonnerToast'
import { customFont, sourceCodePro } from './fonts'

const className = `${customFont.variable} ${sourceCodePro.variable}`

export const metadata: Metadata = {
  title: 'Supabase Design System',
  description: 'Design resources for building consistent user experiences at Supabase.',
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
