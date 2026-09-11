/**
 * Paths that are served by a different Next.js app on the same origin.
 * Links to these paths should use ordinary <a> tags instead of Next.js <Link>
 * components as per Next.js multi-zones recommendation, preventing the router
 * from prefetching RSC payloads from sibling builds.
 */
const CROSS_APP_PREFIXES = ['/docs', '/dashboard']

/**
 * Returns true when `href` points to a route owned by a different
 * Next.js app on the same origin (e.g. /docs/* or /dashboard/*).
 * Use this to render an ordinary <a> tag instead of Next.js <Link>.
 *
 * Only handles relative paths — absolute URLs should use <a> directly.
 */
export function isCrossAppLink(href?: string): boolean {
  if (!href || !href.startsWith('/')) return false

  const path = href.split(/[?#]/)[0]

  return CROSS_APP_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix + '/'))
}
