const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Whether a state-changing request was sent by a browser from another origin.
 *
 * Self-hosted Studio has no session of its own: it relies on whatever sits in
 * front of it (dashboard basic auth at the API gateway, or nothing on a local
 * CLI stack). Browsers attach cached basic auth to cross-site requests, and any
 * site can reach a local Studio, so cross-origin writes have to be rejected here.
 *
 * Follows https://words.filippo.io/csrf/: trust `Sec-Fetch-Site` when present,
 * fall back to comparing `Origin` with the requested host, and allow requests
 * with neither header, which don't come from a browser.
 */
export function isCrossOriginRequest(request: Request): boolean {
  if (SAFE_METHODS.has(request.method)) return false

  const site = request.headers.get('sec-fetch-site')
  if (site !== null) return site !== 'same-origin' && site !== 'none'

  const origin = request.headers.get('origin')
  if (origin === null) return false

  // A gateway may rewrite Host (Kong does by default), so prefer the host the
  // browser asked for. Pages can't set X-Forwarded-Host on a cross-site form
  // submit or simple fetch.
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim()
  const host = forwardedHost || request.headers.get('host')
  if (!host) return true

  try {
    // Hostnames only: Kong leaves the port out of X-Forwarded-Host. Only
    // browsers without Sec-Fetch-Site reach this check.
    return new URL(origin).hostname !== new URL(`http://${host}`).hostname
  } catch {
    // Opaque origins ("null") and malformed values
    return true
  }
}
