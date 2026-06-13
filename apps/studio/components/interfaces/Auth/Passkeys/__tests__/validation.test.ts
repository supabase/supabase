import { describe, expect, it } from 'vitest'

import { isAndroidApkKeyHashOrigin, validateWebAuthnOrigins } from '../validation'

// Real-looking 43-char base64url body (32-byte SHA-256, no padding). Taken
// from the example in supabase/supabase#46896.
const ANDROID_HASH = 'bP7V9_HO4FPHc9aBqmokgPsT_CayrPx7Y2MO_lvS3ck'
const ANDROID_ORIGIN = `android:apk-key-hash:${ANDROID_HASH}`
const RP_ID = 'example.com'

describe('isAndroidApkKeyHashOrigin', () => {
  it('accepts canonical android:apk-key-hash:<43 b64url>', () => {
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

describe('validateWebAuthnOrigins — Android (fix for #46896)', () => {
  it('accepts a mixed list of https + android origins', () => {
    const result = validateWebAuthnOrigins(`https://example.com,${ANDROID_ORIGIN}`, RP_ID)
    expect(result).toEqual({ valid: true })
  })

  it('accepts an android-only origin even when an rpId is configured', () => {
    expect(validateWebAuthnOrigins(ANDROID_ORIGIN, RP_ID)).toEqual({ valid: true })
  })

  it('accepts the -sha256 variant', () => {
    const origin = `android:apk-key-hash-sha256:${ANDROID_HASH}`
    expect(validateWebAuthnOrigins(origin, RP_ID)).toEqual({ valid: true })
  })

  it('rejects malformed android origins with a format-specific error, not the HTTPS error', () => {
    const result = validateWebAuthnOrigins('android:apk-key-hash:tooshort', RP_ID)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.message).toMatch(/not a valid Android origin/)
      expect(result.message).not.toMatch(/must use HTTPS/)
    }
  })
})

describe('validateWebAuthnOrigins — existing behavior is preserved', () => {
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

  it('rejects non-http(s) schemes other than android:', () => {
    const result = validateWebAuthnOrigins('ftp://example.com', RP_ID)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.message).toMatch(/must use HTTPS/)
  })

  it('rejects https origins with a path', () => {
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
