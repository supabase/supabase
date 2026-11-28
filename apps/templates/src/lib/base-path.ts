// Matches vite.config.ts's `base`, the single source of truth for this value.
// The app is served at supabase.com/templates through a rewrite in apps/www,
// the same way apps/kb is served at /kb.
export const BASE_PATH = '/templates'

/** Prefixes app-relative paths ("/foo") with the base path. Leaves full URLs alone. */
export function withBasePath(path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) return path
  return `${BASE_PATH}${path === '/' ? '' : path}`
}
