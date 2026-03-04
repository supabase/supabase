import { describe, expect, it } from 'vitest'

import { shouldBypassAuth, shouldRedirectToLogin } from './proxy-rules'

describe('proxy-rules', () => {
  it('bypasses auth refresh for auth routes', () => {
    expect(shouldBypassAuth('/auth/login')).toBe(true)
    expect(shouldBypassAuth('/protected/acme')).toBe(false)
  })

  it('redirects unauthenticated users for protected routes', () => {
    expect(shouldRedirectToLogin('/', false)).toBe(false)
    expect(shouldRedirectToLogin('/login', false)).toBe(false)
    expect(shouldRedirectToLogin('/protected/acme', false)).toBe(true)
    expect(shouldRedirectToLogin('/protected/acme', true)).toBe(false)
  })
})
