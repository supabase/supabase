import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useState } from 'react'

export type MobileSheetContentType = null | string

type MobileSidebarSheetContextValue = {
  content: MobileSheetContentType
  setContent: (content: MobileSheetContentType) => void
}

const MobileSidebarSheetContext = createContext<MobileSidebarSheetContextValue | null>(null)

export function MobileSidebarSheetProvider({ children }: PropsWithChildren) {
  const [content, setContentState] = useState<MobileSheetContentType>(null)

  const setContent = useCallback((next: MobileSheetContentType) => {
    setContentState(next)
  }, [])

  return (
    <MobileSidebarSheetContext.Provider value={{ content, setContent }}>
      {children}
    </MobileSidebarSheetContext.Provider>
  )
}

export function useMobileSidebarSheet(): MobileSidebarSheetContextValue {
  const ctx = useContext(MobileSidebarSheetContext)
  if (!ctx) {
    throw new Error('useMobileSidebarSheet must be used within MobileSidebarSheetProvider')
  }
  return ctx
}
