'use client'

import { QueryClientProvider } from '@tanstack/react-query'
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
import { useRootQueryClient } from '@/lib/fetch/queryClient'

export function Providers({ children }: PropsWithChildren) {
  const queryClient = useRootQueryClient()
  const pathname = usePathname()
  const router = useRouter()

  const framework = useMemo<FrameworkContextValue>(
    () => ({
      Link: NextLink,
      Image: NextImage,
      pathname: pathname ?? undefined,
      asPath: pathname ?? undefined,
      isReady: true,
      push: (path: string) => router.push(path),
    }),
    [pathname, router]
  )

  return (
    <AppFrameworkProvider value={framework}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <JotaiProvider>
            <ThemeProvider>
              <MobileMenuProvider>
                <FrameworkProvider>
                  <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
                </FrameworkProvider>
              </MobileMenuProvider>
            </ThemeProvider>
          </JotaiProvider>
        </QueryClientProvider>
      </AuthProvider>
    </AppFrameworkProvider>
  )
}
