'use client'

import { useTheme } from 'next-themes'
import { SonnerToaster } from 'ui'

export function Toaster() {
  const { theme } = useTheme()

  return <SonnerToaster position="top-center" theme={(theme as 'light' | 'dark' | 'system') ?? 'system'} />
}
