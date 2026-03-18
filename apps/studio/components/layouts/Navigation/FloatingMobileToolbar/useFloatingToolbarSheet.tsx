import { useRouter } from 'next/router'
import { useCallback } from 'react'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'

import { useMobileSheet } from '../NavigationBar/MobileSheetContext'
import { isMenuContent, shouldShowMenuButton } from './FloatingMobileToolbar.utils'

export function useFloatingToolbarSheet(hideMobileMenu?: boolean) {
  const router = useRouter()
  const pathname = router.asPath?.split('?')[0] ?? router.pathname
  const { content: sheetContent, setContent: setSheetContent, openMenu } = useMobileSheet()
  const { clearActiveSidebar, closeActive, activeSidebar } = useSidebarManagerSnapshot()

  const isSheetOpen = sheetContent !== null
  const isMenuOpen = isMenuContent(sheetContent)
  const isSearchOpen = sheetContent === 'search'
  const showMenuButton = shouldShowMenuButton(pathname) && !hideMobileMenu

  const handleMenuClick = useCallback(() => {
    if (isMenuOpen) {
      clearActiveSidebar()
      setSheetContent(null)
      return
    }
    clearActiveSidebar()
    openMenu()
  }, [isMenuOpen, clearActiveSidebar, openMenu, setSheetContent])

  const handleClose = useCallback(() => {
    if (activeSidebar) {
      closeActive()
    } else {
      setSheetContent(null)
    }
  }, [activeSidebar, closeActive, setSheetContent])

  const handleSearchClick = useCallback(() => {
    if (isSearchOpen) {
      clearActiveSidebar()
      setSheetContent(null)
      return
    }
    clearActiveSidebar()
    setSheetContent('search')
  }, [isSearchOpen, clearActiveSidebar, setSheetContent])

  return {
    isSheetOpen,
    isMenuOpen,
    isSearchOpen,
    showMenuButton,
    handleMenuClick,
    handleClose,
    handleSearchClick,
  }
}
