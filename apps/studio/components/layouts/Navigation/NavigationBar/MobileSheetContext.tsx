import type { PropsWithChildren, ReactNode } from 'react'
import { createContext, useCallback, useContext, useRef, useState } from 'react'

import type { TYPEOF_SIDEBAR_KEYS } from '../../ProjectLayout/LayoutSidebar/LayoutSidebarProvider'

/**
 * Sheet content: null = closed; sidebar id = one of SIDEBAR_KEYS; ReactNode = custom content (menu, search, etc.).
 */
export type MobileSheetContentType = null | TYPEOF_SIDEBAR_KEYS | ReactNode

type MobileSheetContextValue = {
  content: MobileSheetContentType
  setContent: (content: MobileSheetContentType) => void
  isOpen: boolean
  /** Open the sheet with the current menu content. Registered by ProjectLayout (project menu) or OrganizationLayout (org menu). */
  openMenu: () => void
  /** Register the callback run when openMenu() is called (e.g. from MobileNavigationBar). Returns an unregister function. */
  registerOpenMenu: (fn: () => void) => () => void
}

const MobileSheetContext = createContext<MobileSheetContextValue | null>(null)

export function MobileSheetProvider({ children }: PropsWithChildren) {
  const [content, setContentState] = useState<MobileSheetContentType>(null)
  const openMenuRef = useRef<() => void>(() => {})

  const isOpen = content !== null

  const setContent = useCallback((next: MobileSheetContentType) => {
    setContentState(next)
  }, [])

  const openMenu = useCallback(() => {
    openMenuRef.current()
  }, [])

  const registerOpenMenu = useCallback((fn: () => void) => {
    openMenuRef.current = fn
    return () => {
      openMenuRef.current = () => {}
    }
  }, [])

  return (
    <MobileSheetContext.Provider
      value={{ content, setContent, isOpen, openMenu, registerOpenMenu }}
    >
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
