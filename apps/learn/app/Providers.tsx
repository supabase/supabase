'use client'

import {
  AuthProvider,
  FrameworkProvider as AppFrameworkProvider,
  ThemeProvider,
  type FrameworkContextValue,
} from 'common'
import { Provider as JotaiProvider } from 'jotai'
import NextImage from 'next/image'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { PropsWithChildren, useMemo } from 'react'
import { TooltipProvider } from 'ui'

import { FrameworkProvider } from '@/context/framework-context'
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
    <AppFrameworkProvider value={framework}>
      <AuthProvider>
        <JotaiProvider>
          <ThemeProvider>
            <MobileMenuProvider>
              <FrameworkProvider>
                <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
              </FrameworkProvider>
            </MobileMenuProvider>
          </ThemeProvider>
        </JotaiProvider>
      </AuthProvider>
    </AppFrameworkProvider>
  )
}
