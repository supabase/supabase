/**
 * Paths that are served by a different Next.js app on the same origin.
 * Links to these paths must never be prefetched by the www router,
 * because their RSC payloads and chunks belong to a different build
 * and will poison webpack's chunk cache.
 */
const CROSS_APP_PREFIXES = ['/docs', '/dashboard']

/**
 * Returns true when `href` points to a route owned by a different
 * Next.js app on the same origin (e.g. /docs/* or /dashboard/*).
 * Use this to set `prefetch={false}` on any `<Link>` that would
 * otherwise cause a cross-build prefetch.
 */
export function isCrossAppLink(href?: string): boolean {
  if (!href) return false

  let path = href
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path)
      // Check if it targets supabase.com (or localhost) cross-app paths
      if (
        url.hostname === 'supabase.com' ||
        url.hostname.endsWith('.supabase.com') ||
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1'
      ) {
        path = url.pathname
      } else {
        return false
      }
    } catch {
      return false
    }
  } else {
    path = path.split(/[?#]/)[0]
  }

  return CROSS_APP_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix + '/'))
}
