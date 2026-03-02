import type { PropsWithChildren, ReactNode } from 'react'
import { createContext, useCallback, useContext, useState } from 'react'

import type { TYPEOF_SIDEBAR_KEYS } from '../LayoutSidebar/LayoutSidebarProvider'

/**
 * Sheet content: null = closed; sidebar id = one of SIDEBAR_KEYS; ReactNode = custom content (menu, search, etc.).
 */
export type MobileSheetContentType = null | TYPEOF_SIDEBAR_KEYS | ReactNode

type MobileSheetContextValue = {
  content: MobileSheetContentType
  setContent: (content: MobileSheetContentType) => void
  isOpen: boolean
}

const MobileSheetContext = createContext<MobileSheetContextValue | null>(null)

export function MobileSheetProvider({ children }: PropsWithChildren) {
  const [content, setContentState] = useState<MobileSheetContentType>(null)
  const isOpen = content !== null

  const setContent = useCallback((next: MobileSheetContentType) => {
    setContentState(next)
  }, [])

  return (
    <MobileSheetContext.Provider value={{ content, setContent, isOpen }}>
      {children}
    </MobileSheetContext.Provider>
  )
}

export function useMobileSheet(): MobileSheetContextValue {
  const ctx = useContext(MobileSheetContext)
  if (!ctx) {
    throw new Error('useMobileSheet must be used within MobileSheetProvider')
  }
  return ctx
}
