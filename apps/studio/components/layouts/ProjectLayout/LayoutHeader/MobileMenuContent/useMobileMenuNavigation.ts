'use client'

import { useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'

import { getProductMenuComponent } from './mobileProductMenuRegistry'
import type { Route } from '@/components/ui/ui.types'
import { navigateToUrl } from '@/lib/navigation'

const TOP_LEVEL_DIRECT_LINK_KEYS = ['editor', 'sql', 'issues'] as const

export function isDirectLinkAtTopLevel(route: Route): boolean {
  return TOP_LEVEL_DIRECT_LINK_KEYS.includes(
    route.key as (typeof TOP_LEVEL_DIRECT_LINK_KEYS)[number]
  )
}

export function routeHasSubmenu(route: Route): boolean {
  if (route.items && Array.isArray(route.items) && route.items.length > 0) return true
  return getProductMenuComponent(route.key) !== null
}

interface UseMobileMenuNavigationParams {
  currentSectionKey: string | null
  hasCurrentProductMenu: boolean
  onCloseSheet?: () => void
}

export function useMobileMenuNavigation({
  currentSectionKey,
  hasCurrentProductMenu,
  onCloseSheet,
}: UseMobileMenuNavigationParams) {
  const navigate = useNavigate()

  const [viewLevel, setViewLevel] = useState<'top' | 'section'>(
    hasCurrentProductMenu && currentSectionKey ? 'section' : 'top'
  )
  const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(null)

  const handleTopLevelClick = useCallback(
    (route: Route) => {
      if (route.disabled) return

      if (isDirectLinkAtTopLevel(route) && route.link) {
        void navigateToUrl(navigate, route.link)
        onCloseSheet?.()
        return
      }

      if (routeHasSubmenu(route)) {
        setSelectedSectionKey(route.key)
        setViewLevel('section')
        return
      }

      if (route.link) {
        void navigateToUrl(navigate, route.link)
        onCloseSheet?.()
      }
    },
    [navigate, onCloseSheet]
  )

  const handleBackToTop = useCallback(() => {
    setViewLevel('top')
    setSelectedSectionKey(null)
  }, [])

  return {
    viewLevel,
    selectedSectionKey,
    handleTopLevelClick,
    handleBackToTop,
  }
}
