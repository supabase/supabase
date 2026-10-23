'use client'

import { useTheme } from 'next-themes'
import { SonnerToaster } from 'ui'

import { useConfig } from '@/hooks/use-config'

export function Toaster() {
  const [config] = useConfig()
  const { theme } = useTheme()
  return (
    <SonnerToaster
      position={config.sonnerPosition}
      expand={config.sonnerExpand}
      theme={theme as 'light' | 'dark' | 'system'}
    />
  )
}
