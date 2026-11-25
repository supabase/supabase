'use client'

import { AuthProvider, FrameworkProvider, ThemeProvider, type FrameworkContextValue } from 'common'
import { Provider as JotaiProvider } from 'jotai'
import NextImage from 'next/image'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { PropsWithChildren, useMemo } from 'react'
import { TooltipProvider } from 'ui'

import { MobileMenuProvider } from '@/context/mobile-menu-context'

export function Providers({ children }: PropsWithChildren) {
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
      <AuthProvider>
        <JotaiProvider>
          <ThemeProvider>
            <MobileMenuProvider>
              <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
            </MobileMenuProvider>
          </ThemeProvider>
        </JotaiProvider>
      </AuthProvider>
    </FrameworkProvider>
  )
}
