import { describe, expect, it } from 'vitest'

import { passwordNeedsPercentEncoding, passwordStrength } from './password-strength'

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

  it('returns weak score, suggestion, and warning for weak password', async () => {
    const result = await passwordStrength('weak')
    expect(result.message).toMatch(/not secure/i)
    expect(result.message).toContain('This password is not secure enough')
    expect(result.warning).toMatch(/you need a stronger password/i)
    expect(result.strength).toBe(1)
  })
})
