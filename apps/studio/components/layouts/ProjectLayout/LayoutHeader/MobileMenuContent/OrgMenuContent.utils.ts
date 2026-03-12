import type { ReactNode } from 'react'

export interface OrgNavItem {
  label: string
  href: string
  key: string
  icon: ReactNode
}

export function getOrgActiveRoute(pathname: string): string | undefined {
  const segments = pathname.split('/').filter(Boolean)
  const orgIndex = segments.indexOf('org')
  if (orgIndex === -1 || segments.length <= orgIndex + 1) return undefined
  return segments[orgIndex + 2]
}

const ORG_SETTINGS_ROUTES: string[] = [
  'general',
  'apps',
  'audit',
  'documents',
  'security',
  'sso',
] as const

export function getOrgSectionKeyFromPathname(activeRoute: string | undefined): string | null {
  if (activeRoute && ORG_SETTINGS_ROUTES.includes(activeRoute)) {
    return 'settings'
  }
  return null
}

export function isOrgMenuActive(
  item: OrgNavItem,
  index: number,
  pathname: string,
  activeRoute: string | undefined
): boolean {
  if (index === 0) {
    return activeRoute === undefined
  }
  if (item.key === 'settings') {
    const route = activeRoute ?? getOrgActiveRoute(pathname)
    if (route === undefined) return false
    return (
      route === 'settings' ||
      ORG_SETTINGS_ROUTES.includes(route as (typeof ORG_SETTINGS_ROUTES)[number])
    )
  }
  return activeRoute === item.key
}
