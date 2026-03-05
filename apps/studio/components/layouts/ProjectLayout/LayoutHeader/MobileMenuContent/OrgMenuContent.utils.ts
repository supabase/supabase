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
    return (
      pathname.includes('/general') ||
      pathname.includes('/apps') ||
      pathname.includes('/audit') ||
      pathname.includes('/documents') ||
      pathname.includes('/security')
    )
  }
  return activeRoute === item.key
}
