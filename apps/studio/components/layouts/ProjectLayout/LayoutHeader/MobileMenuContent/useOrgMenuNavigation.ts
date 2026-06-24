'use client'

import { useCallback, useState } from 'react'

import { getOrgMenuComponent } from './mobileOrgMenuRegistry'
import type { OrgNavItem } from './OrgMenuContent.utils'

export function orgItemHasSubmenu(item: OrgNavItem): boolean {
  return getOrgMenuComponent(item.key) !== null
}

interface UseOrgMenuNavigationParams {
  initialSectionKey: string | null
}

export function useOrgMenuNavigation({ initialSectionKey }: UseOrgMenuNavigationParams) {
  const [viewLevel, setViewLevel] = useState<'top' | 'section'>(
    initialSectionKey ? 'section' : 'top'
  )
  const [selectedSectionKey, setSelectedSectionKey] = useState<string | null>(initialSectionKey)

  const handleSubmenuClick = useCallback((item: OrgNavItem) => {
    setSelectedSectionKey(item.key)
    setViewLevel('section')
  }, [])

  const handleBackToTop = useCallback(() => {
    setViewLevel('top')
    setSelectedSectionKey(null)
  }, [])

  return {
    viewLevel,
    selectedSectionKey,
    handleSubmenuClick,
    handleBackToTop,
  }
}
