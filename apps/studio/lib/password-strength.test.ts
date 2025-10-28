import { describe, it, expect, beforeEach, vi } from 'vitest'
import { passwordStrength } from './password-strength'

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
