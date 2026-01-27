'use client'

import { SonnerToaster as Toaster } from 'ui'

import { useConfig } from '@/hooks/use-config'

export function SonnerToaster() {
  const [config] = useConfig()
  return <Toaster position={config.sonnerPosition} expand={config.sonnerExpand} />
}
