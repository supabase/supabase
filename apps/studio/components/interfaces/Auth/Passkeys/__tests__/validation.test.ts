import { describe, expect, it } from 'vitest'

import {
  hasAndroidOrigin,
  isAndroidApkKeyHashOrigin,
  isLocalhost,
  isOriginCompatibleWithRpId,
  validateRpId,
  validateWebAuthnOrigins,
} from '../validation'

// Real-looking 43-char base64url body (32-byte SHA-256, no padding).
// Taken from the example in supabase/supabase#46896.
const ANDROID_HASH = 'bP7V9_HO4FPHc9aBqmokgPsT_CayrPx7Y2MO_lvS3ck'
const ANDROID_ORIGIN = `android:apk-key-hash:${ANDROID_HASH}`
const RP_ID = 'example.com'

// ---------------------------------------------------------------------------
// isAndroidApkKeyHashOrigin
// ---------------------------------------------------------------------------
describe('isAndroidApkKeyHashOrigin', () => {
  it('accepts canonical android:apk-key-hash:<43 base64url chars>', () => {
    expect(isAndroidApkKeyHashOrigin(ANDROID_ORIGIN)).toBe(true)
  })

  it('accepts the -sha256 prefix variant', () => {
    expect(isAndroidApkKeyHashOrigin(`android:apk-key-hash-sha256:${ANDROID_HASH}`)).toBe(true)
  })

  it('rejects a hash that is too short', () => {
    expect(isAndroidApkKeyHashOrigin('android:apk-key-hash:tooshort')).toBe(false)
  })

  it('rejects non-base64url characters in the hash', () => {
    expect(isAndroidApkKeyHashOrigin(`android:apk-key-hash:${ANDROID_HASH.slice(0, -1)}!`)).toBe(
      false
    )
  })

  it('rejects unrelated android: schemes', () => {
    expect(isAndroidApkKeyHashOrigin('android:something-else:abc')).toBe(false)
  })

  it('rejects plain https origins', () => {
    expect(isAndroidApkKeyHashOrigin('https://example.com')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// hasAndroidOrigin
// ---------------------------------------------------------------------------
describe('hasAndroidOrigin', () => {
  it('returns true when list contains an android origin', () => {
    expect(hasAndroidOrigin(`https://example.com,${ANDROID_ORIGIN}`)).toBe(true)
  })

  it('returns true for android-only list', () => {
    expect(hasAndroidOrigin(ANDROID_ORIGIN)).toBe(true)
  })

  it('returns false for https-only list', () => {
    expect(hasAndroidOrigin('https://example.com')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(hasAndroidOrigin('')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isLocalhost
// ---------------------------------------------------------------------------
describe('isLocalhost', () => {
  it('accepts localhost', () => {
    expect(isLocalhost('localhost')).toBe(true)
  })

  it('accepts 127.0.0.1', () => {
    expect(isLocalhost('127.0.0.1')).toBe(true)
  })

  it('accepts [::1]', () => {
    expect(isLocalhost('[::1]')).toBe(true)
  })

  it('rejects example.com', () => {
    expect(isLocalhost('example.com')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// isOriginCompatibleWithRpId
// ---------------------------------------------------------------------------
describe('isOriginCompatibleWithRpId', () => {
  it('accepts exact hostname match', () => {
    expect(isOriginCompatibleWithRpId('example.com', 'example.com')).toBe(true)
  })

  it('accepts subdomain of rpId', () => {
    expect(isOriginCompatibleWithRpId('app.example.com', 'example.com')).toBe(true)
  })

  it('rejects unrelated hostname', () => {
    expect(isOriginCompatibleWithRpId('other.com', 'example.com')).toBe(false)
  })

  it('accepts localhost vs localhost', () => {
    expect(isOriginCompatibleWithRpId('localhost', 'localhost')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// validateRpId
// ---------------------------------------------------------------------------
describe('validateRpId', () => {
  it('accepts a bare domain', () => {
    expect(validateRpId('example.com')).toBe('example.com')
  })

  it('returns null for empty string', () => {
    expect(validateRpId('')).toBeNull()
  })

  it('returns null when scheme is included', () => {
    expect(validateRpId('https://example.com')).toBeNull()
  })

  it('returns null for domain with path', () => {
    expect(validateRpId('example.com/path')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// validateWebAuthnOrigins — Android origins (fix for #46896)
// ---------------------------------------------------------------------------
describe('validateWebAuthnOrigins — Android origins (fix for #46896)', () => {
  it('accepts a mixed list of https + android origins', () => {
    expect(validateWebAuthnOrigins(`https://example.com,${ANDROID_ORIGIN}`, RP_ID)).toEqual({
      valid: true,
    })
  })

  it('accepts an android-only origin even when rpId is configured', () => {
    expect(validateWebAuthnOrigins(ANDROID_ORIGIN, RP_ID)).toEqual({ valid: true })
  })

  it('accepts the -sha256 variant', () => {
    expect(
      validateWebAuthnOrigins(`android:apk-key-hash-sha256:${ANDROID_HASH}`, RP_ID)
    ).toEqual({ valid: true })
  })

  it('rejects malformed android origin with format-specific error not HTTPS error', () => {
    const result = validateWebAuthnOrigins('android:apk-key-hash:tooshort', RP_ID)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.message).toMatch(/not a valid Android origin/)
      expect(result.message).not.toMatch(/must use HTTPS/)
    }
  })

  it('rejects unknown android: scheme with format-specific error', () => {
    const result = validateWebAuthnOrigins('android:something-else:abc', RP_ID)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.message).toMatch(/not a valid Android origin/)
    }
  })
})

// ---------------------------------------------------------------------------
// validateWebAuthnOrigins — existing behaviour is preserved
// ---------------------------------------------------------------------------
describe('validateWebAuthnOrigins — existing behaviour is preserved', () => {
  it('accepts a plain https origin', () => {
    expect(validateWebAuthnOrigins('https://example.com', RP_ID)).toEqual({ valid: true })
  })

  it('accepts http://localhost', () => {
    expect(validateWebAuthnOrigins('http://localhost:3000', 'localhost')).toEqual({ valid: true })
  })

  it('accepts an https subdomain of the rpId', () => {
    expect(validateWebAuthnOrigins('https://app.example.com', RP_ID)).toEqual({ valid: true })
  })

  it('rejects http on a non-localhost host', () => {
    const result = validateWebAuthnOrigins('http://example.com', RP_ID)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.message).toMatch(/must use HTTPS/)
  })

  it('rejects ftp:// scheme', () => {
    const result = validateWebAuthnOrigins('ftp://example.com', RP_ID)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.message).toMatch(/must use HTTPS/)
  })

  it('rejects https origin with a path', () => {
    const result = validateWebAuthnOrigins('https://example.com/foo', RP_ID)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.message).toMatch(/plain origin/)
  })

  it('rejects an empty list', () => {
    const result = validateWebAuthnOrigins('', RP_ID)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.message).toMatch(/At least one origin/)
  })

  it('rejects more than 5 origins', () => {
    const six = Array.from({ length: 6 }, (_, i) => `https://app${i}.example.com`).join(',')
    const result = validateWebAuthnOrigins(six, RP_ID)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.message).toMatch(/maximum of 5 origins/)
  })

  it('rejects an origin whose hostname is not compatible with rpId', () => {
    const result = validateWebAuthnOrigins('https://other.com', RP_ID)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.message).toMatch(/not compatible with Relying Party ID/)
  })
})