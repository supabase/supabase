import { describe, expect, it, vi } from 'vitest'

import { generateRandomBase64, generateRandomString } from './random'

describe('generateRandomString', () => {
  it('returns a string of the requested length using only the charset', () => {
    const result = generateRandomString(64, 'abc')
    expect(result).toHaveLength(64)
    expect(result).toMatch(/^[abc]+$/)
  })

  it('returns an empty string for length 0', () => {
    expect(generateRandomString(0, 'abc')).toBe('')
  })

  it('rejects random bytes that would introduce modulo bias', () => {
    // With a charset of 62, bytes >= 248 must be discarded
    const bytes = [255, 248, 62, 0]
    const spy = vi.spyOn(crypto, 'getRandomValues').mockImplementation(((array: Uint8Array) => {
      array[0] = bytes.shift()!
      return array
    }) as typeof crypto.getRandomValues)

    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    // 62 % 62 = 0 -> 'a', then 0 -> 'a'
    expect(generateRandomString(2, charset)).toBe('aa')
    spy.mockRestore()
  })

  it('produces different values across calls', () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    expect(generateRandomString(16, charset)).not.toBe(generateRandomString(16, charset))
  })
})

describe('generateRandomBase64', () => {
  it('returns base64 that decodes to the requested number of bytes', () => {
    const result = generateRandomBase64(60)
    expect(result).toMatch(/^[A-Za-z0-9+/]+={0,2}$/)
    expect(atob(result)).toHaveLength(60)
  })
})
