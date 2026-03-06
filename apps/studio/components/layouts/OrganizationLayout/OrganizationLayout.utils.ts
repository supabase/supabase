/**
 * Organization layout path and scope utilities.
 * Defensive helpers for pathname parsing and route scope checks.
 */

/**
 * Extracts pathname without query string. Safely handles undefined inputs.
 */
export function getPathnameWithoutQuery(
  asPath: string | undefined,
  fallback: string | undefined
): string {
  const path = asPath ?? fallback ?? ''
  if (typeof path !== 'string' || path.length === 0) return ''

  const withoutQuery = path.split('?')[0]
  return withoutQuery ?? path
}

/**
 * Returns true when the current route is in org scope and the org menu should be registered.
 * Organization menu is shown for /org/[slug] and children, but not for /account/*.
 */
export function isOrgMenuScope(pathname: string): boolean {
  if (!pathname || typeof pathname !== 'string') return false
  const trimmed = pathname.trim()
  return trimmed.startsWith('/org/')
}
