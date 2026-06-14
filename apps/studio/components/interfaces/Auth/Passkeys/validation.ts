// Canonical Android Credential Manager origin format emitted in clientDataJSON:
//   android:apk-key-hash:<base64url SHA-256 of APK signing cert>
//
// A SHA-256 digest is 32 bytes → 43 base64url chars (no padding).
// The `-sha256:` prefix variant is non-canonical but accepted by go-webauthn
// via exact-string match, so we allow it here too to mirror what GoTrue does
// at request time (see supabase/auth#2545).
const ANDROID_APK_ORIGIN_REGEX = /^android:apk-key-hash(?:-sha256)?:[A-Za-z0-9_-]{43}$/

/**
 * Returns true if the origin is a valid Android APK key-hash origin.
 * These are matched as exact strings by go-webauthn's IsOriginInHaystack
 * when the needle lacks an http(s) scheme.
 */
export function isAndroidApkKeyHashOrigin(origin: string): boolean {
  return ANDROID_APK_ORIGIN_REGEX.test(origin)
}

/**
 * Returns true if the origin string contains at least one android: origin.
 * Used to show a contextual warning banner in the UI.
 */
export function hasAndroidOrigin(originsValue: string): boolean {
  return originsValue
    .split(',')
    .map((o) => o.trim())
    .some((o) => o.startsWith('android:'))
}

export function isLocalhost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

export function isOriginCompatibleWithRpId(originHostname: string, rpId: string): boolean {
  const host = originHostname.toLowerCase()
  const id = rpId.toLowerCase()
  if (isLocalhost(host) && isLocalhost(id)) return true
  if (host === id) return true
  if (host.endsWith('.' + id)) return true
  return false
}

/**
 * Validates a bare domain RP ID (e.g. "example.com").
 * Returns the normalised lowercase domain, or null if invalid.
 */
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

export type OriginsValidationResult = { valid: true } | { valid: false; message: string }

/**
 * Validates a comma-separated list of WebAuthn RP origins.
 *
 * Rules:
 * - 1–5 origins required
 * - android:apk-key-hash[:sha256]:<43-char base64url> → validated as exact string
 * - All other origins must be HTTPS (or http://localhost)
 * - No path, query, or fragment allowed
 * - Each origin's hostname must be compatible with the RP ID (if provided)
 */
export function validateWebAuthnOrigins(
  value: string,
  rpId: string | null
): OriginsValidationResult {
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
    // Android native-app origins are matched as exact strings by go-webauthn
    // (IsOriginInHaystack falls through to string equality when the needle
    // lacks an http(s) scheme), so they skip URL parsing, the HTTPS rule,
    // and RP-ID hostname compatibility.
    if (origin.startsWith('android:')) {
      if (!isAndroidApkKeyHashOrigin(origin)) {
        return {
          valid: false,
          message: `"${origin}" is not a valid Android origin. Expected format: "android:apk-key-hash:<43-char base64url SHA-256>"`,
        }
      }
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
        message: `"${origin}" must use HTTPS unless it is a localhost origin`,
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