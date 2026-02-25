import type { PropsWithChildren, ReactNode } from 'react'
import { createContext, useCallback, useContext, useState } from 'react'

export type MobileSheetContentType = null | 'menu' | string

type MobileSidebarSheetContextValue = {
  /** What is shown in the sheet: null = closed, 'menu' = nav menu, string = sidebar id */
  content: MobileSheetContentType
  setContent: (content: MobileSheetContentType) => void
  /** True when the sheet is open (content !== null) */
  isOpen: boolean
  /** @deprecated Use setContent(null) to close, setContent('menu' | sidebarId) to open */
  setOpen: (open: boolean) => void
  /** Menu content (project or org nav) shown when content === 'menu'. Set by ProjectLayout / OrganizationLayout. */
  menuContent: ReactNode
  setMenuContent: (content: ReactNode) => void
}

const MobileSidebarSheetContext = createContext<MobileSidebarSheetContextValue | null>(null)

export function MobileSidebarSheetProvider({ children }: PropsWithChildren) {
  const [content, setContentState] = useState<MobileSheetContentType>(null)
  const [menuContent, setMenuContentState] = useState<ReactNode>(null)
  const isOpen = content !== null

  const setOpen = useCallback((open: boolean) => {
    if (!open) setContentState(null)
  }, [])

  const setContent = useCallback((next: MobileSheetContentType) => {
    setContentState(next)
  }, [])

  const setMenuContent = useCallback((next: ReactNode) => {
    setMenuContentState(next)
  }, [])

  return (
    <MobileSidebarSheetContext.Provider
      value={{ content, setContent, isOpen, setOpen, menuContent, setMenuContent }}
    >
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
