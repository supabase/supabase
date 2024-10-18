'use client'

import { useConfig } from '@/hooks/use-config'
import { SonnerToaster as Toaster } from 'ui'

export function SonnerToaster() {
  const [config] = useConfig()
  return <Toaster position={config.sonnerPosition} expand={config.sonnerExpand} />
}
