import { describe, expect, it } from 'vitest'

import { validateWebAuthnOrigins } from './PasskeysSettingsForm.utils'

// Android native app origin: android:apk-key-hash:<base64url-unpadded SHA-256 of signing cert>
const ANDROID_ORIGIN = 'android:apk-key-hash:9PVlcDFXh3IFumGfp4D08m6IcVAJYmF7gJqXdMzVwSY'

describe('validateWebAuthnOrigins', () => {
  describe('app origins', () => {
    it('accepts an Android app origin alone (no rpId)', () => {
      expect(validateWebAuthnOrigins(ANDROID_ORIGIN, null)).toEqual({ valid: true })
    })

    it('accepts an Android app origin mixed with an https origin', () => {
      expect(
        validateWebAuthnOrigins(`https://example.com,${ANDROID_ORIGIN}`, 'example.com')
      ).toEqual({ valid: true })
    })

    it('accepts an Android app origin when rpId is set (no hostname-compatibility check)', () => {
      expect(validateWebAuthnOrigins(ANDROID_ORIGIN, 'example.com')).toEqual({ valid: true })
    })

    it('accepts a mixed-case Android app origin (no normalization)', () => {
      const mixedCase = 'android:apk-key-hash:AbCdEfGh_-9PVlcDFXh3IFumGfp4D08m6IcVAJYmF7gJq'
      expect(validateWebAuthnOrigins(mixedCase, null)).toEqual({ valid: true })
    })

    it('accepts an http://localhost origin mixed with an Android app origin', () => {
      expect(validateWebAuthnOrigins(`http://localhost,${ANDROID_ORIGIN}`, null)).toEqual({
        valid: true,
      })
    })

    it('counts Android app origins toward the 5-origin limit', () => {
      const origins = [
        ...Array.from({ length: 4 }, (_, i) => `https://app${i}.example.com`),
        ANDROID_ORIGIN,
      ].join(',')
      expect(validateWebAuthnOrigins(origins, 'example.com')).toEqual({ valid: true })
    })

    it('rejects when origins exceed 5 counting an Android app origin', () => {
      const origins = [
        ...Array.from({ length: 5 }, (_, i) => `https://app${i}.example.com`),
        ANDROID_ORIGIN,
      ].join(',')
      const result = validateWebAuthnOrigins(origins, 'example.com')
      expect(result).toEqual({ valid: false, message: 'A maximum of 5 origins is allowed' })
    })

    it.each([
      ['andoid:apk-key-hash:9PVlcDFXh3IFumGfp4D08m6IcVAJYmF7gJqXdMzVwSY', 'misspelled scheme'],
      ['android:foo', 'wrong android format'],
      ['android:apk-key-hash:', 'empty hash'],
      ['android:apk-key-hash:abc+def/ghi=', 'standard-base64 chars'],
      ['chrome-extension://abc', 'not-yet-supported scheme'],
    ])('rejects unsupported app origin %s (%s)', (origin) => {
      const result = validateWebAuthnOrigins(origin, 'example.com')
      expect(result).toEqual({
        valid: false,
        message: `"${origin}" must use HTTPS or be a supported app origin`,
      })
    })
  })

  describe('web origins', () => {
    it('accepts an https origin compatible with the rpId', () => {
      expect(validateWebAuthnOrigins('https://app.example.com', 'example.com')).toEqual({
        valid: true,
      })
    })

    it('rejects a non-localhost http origin', () => {
      const result = validateWebAuthnOrigins('http://example.com', null)
      expect(result).toEqual({
        valid: false,
        message: '"http://example.com" must use HTTPS unless it is a localhost origin',
      })
    })

    it('rejects an empty list', () => {
      expect(validateWebAuthnOrigins('', null)).toEqual({
        valid: false,
        message: 'At least one origin is required',
      })
    })
  })
})
