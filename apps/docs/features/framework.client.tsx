'use client'

import { FrameworkProvider, type FrameworkContextValue } from 'common'
import NextImage from 'next/image'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, type ReactNode } from 'react'

export function DocsFrameworkProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const value = useMemo<FrameworkContextValue>(
    () => ({
      Link: NextLink,
      Image: NextImage,
      pathname,
      asPath: pathname,
      push: (path) => router.push(path),
    }),
    [pathname, router]
  )

  return <FrameworkProvider value={value}>{children}</FrameworkProvider>
}
