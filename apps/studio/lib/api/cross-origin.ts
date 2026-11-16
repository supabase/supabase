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

  let originUrl: URL
  try {
    originUrl = new URL(origin)
  } catch {
    // Opaque origins ("null") and malformed values
    return true
  }

  return !isRequestedHost(originUrl, request.headers)
}

/**
 * Whether the origin is the host the browser asked for. A proxy in front of
 * Studio forwards it in X-Forwarded-Host; without a proxy it's Host. Pages
 * can't set these headers on a cross-site form submit or simple fetch.
 */
function isRequestedHost(origin: URL, headers: Headers): boolean {
  const first = (name: string) => headers.get(name)?.split(',')[0].trim().toLowerCase()
  const host = first('host')
  const forwardedHost = first('x-forwarded-host')

  if (!forwardedHost) return host === origin.host

  // Kong rewrites Host to its upstream and leaves the port out of
  // X-Forwarded-Host, so only the hostname can be compared there, and another
  // port on the same hostname passes
  if (hostnameOf(host) !== hostnameOf(forwardedHost)) {
    return hostnameOf(forwardedHost) === origin.hostname
  }

  return forwardedHost === origin.host
}

function hostnameOf(host: string | undefined): string | undefined {
  if (!host) return undefined
  try {
    return new URL(`http://${host}`).hostname
  } catch {
    return undefined
  }
}
