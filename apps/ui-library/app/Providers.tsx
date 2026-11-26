'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, FrameworkProvider, ThemeProvider, type FrameworkContextValue } from 'common'
import { Provider as JotaiProvider } from 'jotai'
import NextImage from 'next/image'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { PropsWithChildren, useMemo } from 'react'
import { TooltipProvider } from 'ui'

import { FrameworkPreferenceProvider } from '@/context/framework-preference-context'
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
      pathname,
      asPath: pathname,
      push: (path) => router.push(path),
    }),
    [pathname, router]
  )

  return (
    <FrameworkProvider value={framework}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <JotaiProvider>
            <ThemeProvider>
              <MobileMenuProvider>
                <FrameworkPreferenceProvider>
                  <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
                </FrameworkPreferenceProvider>
              </MobileMenuProvider>
            </ThemeProvider>
          </JotaiProvider>
        </QueryClientProvider>
      </AuthProvider>
    </FrameworkProvider>
  )
}
