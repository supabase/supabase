import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from './Providers'
import { SonnerToaster } from './SonnerToast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Supabase Design System',
  description: 'Design resources for building consistent user experiences at Supabase.',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function Layout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
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
