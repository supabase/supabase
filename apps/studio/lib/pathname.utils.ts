/**
 * Pathname utilities for safe URL/path parsing.
 * Use these instead of direct array indexing (e.g. pathname.split('/')[3]) to avoid undefined access.
 */

/**
 * Extracts the pathname without query string or hash.
 * Use with Next.js router: getPathnameWithoutQuery(router.asPath, router.pathname)
 */
export function getPathnameWithoutQuery(
  asPath: string | undefined,
  fallbackPathname: string
): string {
  if (asPath === undefined || asPath === null) return fallbackPathname
  const withoutQuery = asPath.split(/[?#]/)[0]
  return withoutQuery ?? fallbackPathname
}

/**
 * Returns the path segment at the given index, or undefined if out of bounds.
 * Segments are from splitting on '/', e.g. '/org/my-org/team' → ['', 'org', 'my-org', 'team']
 * Index 0 = '', 1 = 'org', 2 = 'my-org', 3 = 'team'
 */
export function getPathSegment(pathname: string, index: number): string | undefined {
  const segments = pathname.split('/')
  const segment = segments[index]
  return segment
}
