'use client'

import { usePathname } from 'next/navigation'
import { useRouter as useCompatRouter } from 'next/compat/router'
import { useLayoutEffect } from 'react'

import { useMobileSheet } from '../Navigation/NavigationBar/MobileSheetContext'
import { OrgMenuContent } from '../ProjectLayout/LayoutHeader/MobileMenuContent/OrgMenuContent'
import { getPathnameWithoutQuery, isOrgMenuScope } from './OrganizationLayout.utils'

/**
 * Registers the org menu with the mobile sheet when in org scope (/org/... or /v2/org/...).
 * Unregisters when navigating away. Call from OrganizationLayout.
 */
export function useRegisterOrgMenu() {
  const compatRouter = useCompatRouter()
  const appPathname = usePathname() ?? ''
  const { setContent: setMobileSheetContent, registerOpenMenu } = useMobileSheet()

  useLayoutEffect(() => {
    const pathname =
      getPathnameWithoutQuery(compatRouter?.asPath, compatRouter?.pathname) || appPathname
    if (!isOrgMenuScope(pathname)) return

    const unregister = registerOpenMenu(() => {
      setMobileSheetContent(<OrgMenuContent onCloseSheet={() => setMobileSheetContent(null)} />)
    })
    return unregister
  }, [
    appPathname,
    compatRouter?.asPath,
    compatRouter?.pathname,
    registerOpenMenu,
    setMobileSheetContent,
  ])
}
