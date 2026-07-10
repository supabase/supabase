import { useCallback } from 'react'

import { useMobileSheet } from '../NavigationBar/MobileSheetContext'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

export function useFloatingToolbarSidebarClick() {
  const { setContent: setSheetContent } = useMobileSheet()
  const { activeSidebar } = useSidebarManagerSnapshot()

  return useCallback(
    (e: React.MouseEvent) => {
      const target = (e.target as HTMLElement).closest?.('[data-sidebar-id]')
      const sidebarId = target?.getAttribute('data-sidebar-id')
      if (sidebarId && activeSidebar?.id !== sidebarId) {
        setSheetContent(sidebarId)
      }
    },
    [activeSidebar?.id, setSheetContent]
  )
}
