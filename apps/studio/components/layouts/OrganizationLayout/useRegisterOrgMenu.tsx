'use client'

import { useLocation } from '@tanstack/react-router'
import { useLayoutEffect } from 'react'

import { useMobileSheet } from '../Navigation/NavigationBar/MobileSheetContext'
import { OrgMenuContent } from '../ProjectLayout/LayoutHeader/MobileMenuContent/OrgMenuContent'
import { isOrgMenuScope } from './OrganizationLayout.utils'

/**
 * Registers the org menu with the mobile sheet when in org scope (/org/...).
 * Unregisters when navigating away. Call from OrganizationLayout.
 */
export function useRegisterOrgMenu() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { setContent: setMobileSheetContent, registerOpenMenu } = useMobileSheet()

  useLayoutEffect(() => {
    if (!isOrgMenuScope(pathname)) return

    const unregister = registerOpenMenu(() => {
      setMobileSheetContent(<OrgMenuContent onCloseSheet={() => setMobileSheetContent(null)} />)
    })
    return unregister
  }, [pathname, registerOpenMenu, setMobileSheetContent])
}
