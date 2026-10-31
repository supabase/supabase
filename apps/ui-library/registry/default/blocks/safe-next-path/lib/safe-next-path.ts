export const safeNextPath = (path: unknown, fallback = '/', origin?: string) => {
  if (typeof path !== 'string' || !path.startsWith('/')) return fallback

  const currentOrigin = origin ?? window.location.origin

  try {
    const url = new URL(path, currentOrigin)
    return url.origin === currentOrigin ? `${url.pathname}${url.search}${url.hash}` : fallback
  } catch {
    return fallback
  }
}
