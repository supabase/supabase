export function safeNextPath(path: unknown, origin: string) {
  if (typeof path !== 'string' || !path.startsWith('/')) return '/'

  try {
    const url = new URL(path, origin)
    if (url.origin !== origin) return '/'

    const next = `${url.pathname}${url.search}${url.hash}`
    // "/.//example.com" normalizes to "//example.com", which a browser reads as another site
    return next.startsWith('//') ? '/' : next
  } catch {
    return '/'
  }
}
