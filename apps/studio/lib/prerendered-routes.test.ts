import { describe, expect, it } from 'vitest'

import { isPrerenderedRoute } from './prerendered-routes'

describe('isPrerenderedRoute', () => {
  it('matches prerendered paths with or without a trailing slash', () => {
    expect(isPrerenderedRoute('/sign-in')).toBe(true)
    expect(isPrerenderedRoute('/sign-in/')).toBe(true)
    expect(isPrerenderedRoute('/forgot-password')).toBe(true)
  })

  it('does not match other auth pages that share a prefix', () => {
    expect(isPrerenderedRoute('/sign-in-mfa')).toBe(false)
    expect(isPrerenderedRoute('/forgot-password-mfa')).toBe(false)
    expect(isPrerenderedRoute('/sign-in/extra')).toBe(false)
  })

  it('is case-sensitive, like the Vercel routes that serve the files', () => {
    expect(isPrerenderedRoute('/Sign-In')).toBe(false)
  })

  it('expects a path without the base path', () => {
    expect(isPrerenderedRoute('/dashboard/sign-in')).toBe(false)
  })
})
