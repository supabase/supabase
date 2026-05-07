import { useCallback } from 'react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'

import { useMobileSheet } from '../NavigationBar/MobileSheetContext'

export function useFloatingToolbarSidebarClick() {
  const { setContent: setSheetContent } = useMobileSheet()
  const { activeSidebar, openSidebar } = useSidebarManagerSnapshot()

  return useCallback(
    (e: React.MouseEvent) => {
      const target = (e.target as HTMLElement).closest?.('[data-sidebar-id]')
      const sidebarId = target?.getAttribute('data-sidebar-id')
      if (sidebarId && activeSidebar?.id !== sidebarId) {
        e.preventDefault()
        e.stopPropagation()
        openSidebar(sidebarId)
        setSheetContent(sidebarId)
      }
    },
    [activeSidebar?.id, openSidebar, setSheetContent]
  )
}
