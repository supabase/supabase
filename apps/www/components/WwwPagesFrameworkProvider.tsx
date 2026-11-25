'use client'

import { FrameworkProvider, type FrameworkContextValue } from 'common'
import NextImage from 'next/image'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, type ReactNode } from 'react'

export function WwwPagesFrameworkProvider({ children }: { children: ReactNode }) {
  const router = useRouter()

  const value = useMemo<FrameworkContextValue>(
    () => ({
      Link: NextLink,
      Image: NextImage,
      pathname: router.pathname,
      asPath: router.asPath,
      isReady: router.isReady,
      params: router.query,
      push: (path: string) => router.push(path),
    }),
    [router]
  )

  return <FrameworkProvider value={value}>{children}</FrameworkProvider>
}
