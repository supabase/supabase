'use client'

import { useRouter } from 'next/router'
import { useLayoutEffect } from 'react'

import { useMobileSheet } from '../Navigation/NavigationBar/MobileSheetContext'
import { OrgMenuContent } from '../ProjectLayout/LayoutHeader/MobileMenuContent/OrgMenuContent'
import { getPathnameWithoutQuery, isOrgMenuScope } from './OrganizationLayout.utils'

/**
 * Registers the org menu with the mobile sheet when in org scope (/org/...).
 * Unregisters when navigating away. Call from OrganizationLayout.
 */
export function useRegisterOrgMenu() {
  const router = useRouter()
  const { setContent: setMobileSheetContent, registerOpenMenu } = useMobileSheet()

  useLayoutEffect(() => {
    const pathname = getPathnameWithoutQuery(router.asPath, router.pathname)
    if (!isOrgMenuScope(pathname)) return

    const unregister = registerOpenMenu(() => {
      setMobileSheetContent(<OrgMenuContent onCloseSheet={() => setMobileSheetContent(null)} />)
    })
    return unregister
  }, [router.asPath, router.pathname, registerOpenMenu, setMobileSheetContent])
}
