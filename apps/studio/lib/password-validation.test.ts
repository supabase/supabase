import { describe, expect, it } from 'vitest'

import { passwordValidation } from './password-validation'

const COMPLEXITY_MESSAGE =
  'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'

const messagesFor = (password: string) => {
  const result = passwordValidation.safeParse(password)
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('passwordValidation', () => {
  it('accepts a password with every required character class', () => {
    expect(passwordValidation.safeParse('Passw0rd!').success).toBe(true)
  })

  it('accepts a password of exactly 8 characters', () => {
    expect(passwordValidation.safeParse('Passw0r!').success).toBe(true)
  })

  it('reports the required message for an empty password', () => {
    expect(messagesFor('')[0]).toBe('Password is required')
  })

  it('rejects a password shorter than 8 characters', () => {
    expect(messagesFor('Pw0r!')).toContain(COMPLEXITY_MESSAGE)
  })

  it('rejects a password without an uppercase letter', () => {
    expect(messagesFor('passw0rd!')).toContain(COMPLEXITY_MESSAGE)
  })

  it('rejects a password without a lowercase letter', () => {
    expect(messagesFor('PASSW0RD!')).toContain(COMPLEXITY_MESSAGE)
  })

  it('rejects a password without a number', () => {
    expect(messagesFor('Password!')).toContain(COMPLEXITY_MESSAGE)
  })

  it('rejects a password without a special character', () => {
    expect(messagesFor('Passw0rd')).toContain(COMPLEXITY_MESSAGE)
  })

  it.each(['-', '/', '\\', '_'])('accepts %s as a special character', (special) => {
    expect(passwordValidation.safeParse(`Passw0rd${special}`).success).toBe(true)
  })

  it('accepts a password of exactly 72 characters', () => {
    expect(passwordValidation.safeParse(`Aa1!${'a'.repeat(68)}`).success).toBe(true)
  })

  it('rejects a password longer than 72 characters', () => {
    expect(messagesFor(`Aa1!${'a'.repeat(69)}`)).toContain('Password cannot exceed 72 characters')
  })
})
