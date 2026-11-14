export const safeNextPath = (path: unknown, fallback = '/', origin?: string) => {
  if (typeof path !== 'string' || !path.startsWith('/')) return fallback

  const currentOrigin = origin ?? window.location.origin

  try {
    const url = new URL(path, currentOrigin)
    if (url.origin !== currentOrigin) return fallback

    const next = `${url.pathname}${url.search}${url.hash}`
    // "/.//example.com" normalizes to "//example.com", which a browser reads as another site
    return next.startsWith('//') ? fallback : next
  } catch {
    return fallback
  }
}
