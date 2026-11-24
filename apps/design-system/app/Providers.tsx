'use client'

import { FrameworkProvider, ThemeProvider, type FrameworkContextValue } from 'common'
import { Provider as JotaiProvider } from 'jotai'
import NextImage from 'next/image'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { TooltipProvider } from 'ui'

import { MobileSidebarProvider } from '@/context/mobile-sidebar-context'

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const framework = useMemo<FrameworkContextValue>(
    () => ({
      Link: NextLink,
      Image: NextImage,
      pathname,
      asPath: pathname,
      push: (path) => router.push(path),
    }),
    [pathname, router]
  )

  return (
    <FrameworkProvider value={framework}>
      <JotaiProvider>
        <ThemeProvider>
          <TooltipProvider delayDuration={0}>
            <MobileSidebarProvider>{children}</MobileSidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </JotaiProvider>
    </FrameworkProvider>
  )
}
