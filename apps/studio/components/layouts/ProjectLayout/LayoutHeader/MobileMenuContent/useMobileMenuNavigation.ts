'use client'

import type { Route } from 'components/ui/ui.types'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'

import { getProductMenuComponent } from './mobileProductMenuRegistry'

const TOP_LEVEL_DIRECT_LINK_KEYS = ['editor', 'sql'] as const

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
  const router = useRouter()

  const [viewLevel, setViewLevel] = useState<'top' | 'section'>(
    hasCurrentProductMenu && currentSectionKey ? 'section' : 'top'
  )
  const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(null)

  const handleTopLevelClick = useCallback(
    (route: Route) => {
      if (route.disabled) return

      if (isDirectLinkAtTopLevel(route) && route.link) {
        router.push(route.link)
        onCloseSheet?.()
        return
      }

      if (routeHasSubmenu(route)) {
        setSelectedSectionKey(route.key)
        setViewLevel('section')
        return
      }

      if (route.link) {
        router.push(route.link)
        onCloseSheet?.()
      }
    },
    [router, onCloseSheet]
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
