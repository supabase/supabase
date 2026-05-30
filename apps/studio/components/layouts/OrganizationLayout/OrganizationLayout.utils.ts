export function getPathnameWithoutQuery(asPath?: string, fallback?: string): string {
  const path = asPath ?? fallback ?? ''
  if (typeof path !== 'string' || path.length === 0) return ''

  const withoutQuery = path.split('?')[0]
  return withoutQuery ?? path
}

export function isOrgMenuScope(pathname: string): boolean {
  if (!pathname || typeof pathname !== 'string') return false
  const trimmed = pathname.trim()
  return trimmed.startsWith('/org/')
}
