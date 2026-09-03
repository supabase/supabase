// Recognized non-web WebAuthn origin schemes, matched verbatim (no normalization).
const APP_ORIGIN_SCHEMES: ReadonlyArray<RegExp> = [
  // Android native apps: android:apk-key-hash:<base64url-unpadded SHA-256 of signing cert>
  /^android:apk-key-hash:[A-Za-z0-9_-]+$/,
]

export function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

export function validateRpId(rpId: string): string | null {
  const trimmed = rpId.trim().toLowerCase()
  if (!trimmed) return null
  try {
    const url = new URL('https://' + trimmed)
    if (url.hostname !== trimmed) return null
    return trimmed
  } catch {
    return null
  }
}

export function isOriginCompatibleWithRpId(originHostname: string, rpId: string): boolean {
  const host = originHostname.toLowerCase()
  const id = rpId.toLowerCase()
  if (isLocalhost(host) && isLocalhost(id)) return true
  if (host === id) return true
  if (host.endsWith('.' + id)) return true
  return false
}

export function validateWebAuthnOrigins(
  value: string,
  rpId: string | null
): { valid: true } | { valid: false; message: string } {
  const origins = value
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)

  if (origins.length === 0) {
    return { valid: false, message: 'At least one origin is required' }
  }

  if (origins.length > 5) {
    return { valid: false, message: 'A maximum of 5 origins is allowed' }
  }

  for (const origin of origins) {
    // App-origin schemes (e.g. Android apk-key-hash) have no hostname to validate or
    // normalize against the RP ID, so they're accepted verbatim and matched downstream as-is.
    if (APP_ORIGIN_SCHEMES.some((pattern) => pattern.test(origin))) {
      continue
    }

    let url: URL
    try {
      url = new URL(origin)
    } catch {
      return { valid: false, message: `"${origin}" is not a valid URL` }
    }

    if (url.protocol === 'http:') {
      if (!isLocalhost(url.hostname)) {
        return {
          valid: false,
          message: `"${origin}" must use HTTPS unless it is a localhost origin`,
        }
      }
    } else if (url.protocol !== 'https:') {
      return {
        valid: false,
        message: `"${origin}" must use HTTPS or be a supported app origin`,
      }
    }

    if (url.href !== url.origin + '/') {
      return {
        valid: false,
        message: `"${origin}" must be a plain origin without path, query, or fragment (e.g. "${url.origin}")`,
      }
    }

    if (rpId && !isOriginCompatibleWithRpId(url.hostname, rpId)) {
      return {
        valid: false,
        message: `"${origin}" is not compatible with Relying Party ID "${rpId}". The origin's hostname must match or be a subdomain of the RP ID.`,
      }
    }
  }

  return { valid: true }
}
