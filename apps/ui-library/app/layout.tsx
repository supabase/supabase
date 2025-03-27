import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from './Providers'
import { SonnerToaster } from './SonnerToast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Supabase UI Library',
  description: 'Provides a library of components for your project',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function Layout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          themes={['dark', 'light', 'classic-dark']}
          defaultTheme="system"
          enableSystem
        >
          {children}

          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
