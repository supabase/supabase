import type { ReactNode } from 'react'

export interface OrgNavItem {
  label: string
  href: string
  key: string
  icon: ReactNode
}

/**
 * Returns the active route segment for org paths.
 * e.g. /org/my-org/team → 'team', /org/my-org → undefined
 */
export function getOrgActiveRoute(pathname: string): string | undefined {
  const segments = pathname.split('/').filter(Boolean)
  const orgIndex = segments.indexOf('org')
  if (orgIndex === -1 || segments.length <= orgIndex + 1) return undefined
  return segments[orgIndex + 2]
}

/** Org settings sub-route segments that map to the 'settings' section */
const ORG_SETTINGS_ROUTES = ['general', 'apps', 'audit', 'documents', 'security', 'sso'] as const

/**
 * Returns the org section key that has a submenu and matches the current route.
 * e.g. /org/my-org/general → 'settings', /org/my-org/team → null
 */
export function getOrgSectionKeyFromPathname(
  activeRoute: string | undefined
): string | null {
  if (activeRoute && ORG_SETTINGS_ROUTES.includes(activeRoute as any)) {
    return 'settings'
  }
  return null
}

/**
 * Pure function to determine if an org menu item is active.
 * First item (index 0) is active when activeRoute is undefined (org home).
 * Settings item is active when pathname includes settings sub-routes.
 */
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
    return ORG_SETTINGS_ROUTES.some((route) => pathname.includes(`/${route}`))
  }
  return activeRoute === item.key
}
