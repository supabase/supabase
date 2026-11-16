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
 * with neither header, which don't come from a browser. Browsers send
 * `Sec-Fetch-Site` only to HTTPS and localhost, so over plain HTTP the `Origin`
 * check is the one that applies.
 */
export function isCrossOriginRequest(request: Request): boolean {
  if (SAFE_METHODS.has(request.method)) return false

  const site = request.headers.get('sec-fetch-site')
  if (site !== null) return site !== 'same-origin' && site !== 'none'

  const origin = request.headers.get('origin')
  if (origin === null) return false

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    // Opaque origins ("null") and malformed values
    return true
  }

  return !requestedHosts(request.headers).includes(originHost)
}

const HAS_PORT = /:\d+$/

/**
 * The host (with port) the browser asked for. A proxy in front of Studio
 * forwards it in X-Forwarded-Host; without a proxy it's Host. Pages can't set
 * these headers on a cross-site form submit or simple fetch.
 */
function requestedHosts(headers: Headers): string[] {
  const first = (name: string) => headers.get(name)?.split(',')[0].trim().toLowerCase()

  const forwardedHost = first('x-forwarded-host')
  if (!forwardedHost) {
    const host = first('host')
    return host ? [host] : []
  }

  // Kong leaves the port out of X-Forwarded-Host and sends it separately.
  // The bare host still covers browsers on the default port.
  const forwardedPort = first('x-forwarded-port')
  return forwardedPort && !HAS_PORT.test(forwardedHost)
    ? [forwardedHost, `${forwardedHost}:${forwardedPort}`]
    : [forwardedHost]
}
