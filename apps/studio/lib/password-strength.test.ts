import { describe, expect, it } from 'vitest'

import {
  passwordHasUnsupportedCharacters,
  passwordNeedsPercentEncoding,
  passwordStrength,
} from './password-strength'

describe('passwordNeedsPercentEncoding', () => {
  it('returns false for passwords that are safe to use in a connection string', () => {
    expect(passwordNeedsPercentEncoding('')).toBe(false)
    expect(passwordNeedsPercentEncoding('teststring')).toBe(false)
    expect(passwordNeedsPercentEncoding('Str0ngPassword123')).toBe(false)
    expect(passwordNeedsPercentEncoding('with-safe_chars.~!')).toBe(false)
  })

  it('returns true for passwords with characters that need percent-encoding', () => {
    expect(passwordNeedsPercentEncoding('test@string')).toBe(true)
    expect(passwordNeedsPercentEncoding('te:ststring')).toBe(true)
    expect(passwordNeedsPercentEncoding('tests/tring')).toBe(true)
    expect(passwordNeedsPercentEncoding('test#string')).toBe(true)
    expect(passwordNeedsPercentEncoding('test%string')).toBe(true)
    expect(passwordNeedsPercentEncoding('test+string')).toBe(true)
    expect(passwordNeedsPercentEncoding('test?string')).toBe(true)
    expect(passwordNeedsPercentEncoding('test&string')).toBe(true)
    expect(passwordNeedsPercentEncoding('test string')).toBe(true)
  })
})

describe('passwordHasUnsupportedCharacters', () => {
  it('returns false for passwords Postgres stores exactly as they were typed', () => {
    expect(passwordHasUnsupportedCharacters('')).toBe(false)
    expect(passwordHasUnsupportedCharacters('Str0ngPassword123')).toBe(false)
    expect(passwordHasUnsupportedCharacters('with-safe_chars.~!@#$%^&*()')).toBe(false)
    expect(passwordHasUnsupportedCharacters('with a plain space')).toBe(false)
    expect(passwordHasUnsupportedCharacters('precomposed\u00e8F\u00d6\u00c6aB12345')).toBe(false)
  })

  it('returns true for characters SASLprep rewrites before hashing', () => {
    const passwords = {
      'no-break space': 'aB1\u00a0xYz9',
      'soft hyphen': 'aB1\u00adxYz9',
      'combining grapheme joiner': 'aB1\u034fxYz9',
      'ogham space mark': 'aB1\u1680xYz9',
      'en quad': 'aB1\u2000xYz9',
      'zero width space': 'aB1\u200bxYz9',
      'word joiner': 'aB1\u2060xYz9',
      'narrow no-break space': 'aB1\u202fxYz9',
      'ideographic space': 'aB1\u3000xYz9',
      'variation selector': 'aB1\ufe00xYz9',
      'byte order mark': 'aB1\ufeffxYz9',
    }

    for (const [label, password] of Object.entries(passwords)) {
      expect(passwordHasUnsupportedCharacters(password), label).toBe(true)
    }
  })

  it('returns false for characters SASLprep prohibits rather than rewrites', () => {
    const passwords = {
      'line separator': 'aB1\u2028xYz9',
      'paragraph separator': 'aB1\u2029xYz9',
    }

    for (const [label, password] of Object.entries(passwords)) {
      expect(passwordHasUnsupportedCharacters(password), label).toBe(false)
    }
  })

  it('returns true for decomposed accents that NFKC recomposes', () => {
    const decomposed = 'e\u0300FO\u0308\u00c6aB12345'

    expect(passwordHasUnsupportedCharacters(decomposed)).toBe(true)
    expect(passwordHasUnsupportedCharacters(decomposed.normalize('NFC'))).toBe(false)
  })
})

describe('passwordStrength', () => {
  it('returns empty values for message, warning and strength for empty input', async () => {
    const result = await passwordStrength('')
    expect(result).toEqual({ message: '', warning: '', strength: 0 })
  })

  it('returns max length message, warning, and strength 0 for password longer than 99 characters', async () => {
    const longPassword = 'a'.repeat(100)
    const result = await passwordStrength(longPassword)
    expect(result.message).toMatch(/maximum length/i)
    expect(result.warning).toMatch(/less than 100 characters/i)
    expect(result.strength).toBe(0)
  })

  it('returns strong score, suggestion, and empty warning for strong password', async () => {
    const result = await passwordStrength('ActuallyAStrongPassword123!')
    expect(result.message).toMatch(/strong/i)
    expect(result.message).toContain('This password is strong')
    expect(result.warning).toBe('')
    expect(result.strength).toBe(4)
  })

  it('rejects a strong password that Postgres cannot authenticate with', async () => {
    const result = await passwordStrength('Str0ngPassword123\u00a0')
    expect(result.message).toMatch(/cannot authenticate with/i)
    expect(result.warning).toMatch(/letters, numbers, and standard symbols/i)
    expect(result.strength).toBe(0)
  })

  it('returns weak score, suggestion, and warning for weak password', async () => {
    const result = await passwordStrength('weak')
    expect(result.message).toMatch(/not secure/i)
    expect(result.message).toContain('This password is not secure enough')
    expect(result.warning).toMatch(/you need a stronger password/i)
    expect(result.strength).toBe(1)
  })
})
