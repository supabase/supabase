import { createContext, useContext, type ReactNode } from 'react'

import type {
  PlatformAdapter,
  PlatformFeatures,
} from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/types'

const PlatformContext = createContext<PlatformAdapter | null>(null)

export function PlatformProvider({
  adapter,
  children,
}: {
  adapter: PlatformAdapter
  children: ReactNode
}) {
  return <PlatformContext.Provider value={adapter}>{children}</PlatformContext.Provider>
}

export function usePlatformAdapter(): PlatformAdapter {
  const adapter = useContext(PlatformContext)
  if (!adapter) {
    throw new Error('usePlatformAdapter must be used within a <PlatformProvider>')
  }
  return adapter
}

export function useFeatures(): PlatformFeatures {
  return usePlatformAdapter().features
}
