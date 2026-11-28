import { describe, expect, it } from 'vitest'

import { isOrgMenuScope } from './OrganizationLayout.utils'

describe('isOrgMenuScope', () => {
  it('returns true for /org/ routes', () => {
    expect(isOrgMenuScope('/org/my-org')).toBe(true)
    expect(isOrgMenuScope('/org/my-org/team')).toBe(true)
  })

  it('returns false for non-org routes', () => {
    expect(isOrgMenuScope('/account/me')).toBe(false)
    expect(isOrgMenuScope('/project/ref/editor')).toBe(false)
    expect(isOrgMenuScope('/organizations')).toBe(false)
  })

  it('returns false for invalid input', () => {
    expect(isOrgMenuScope('')).toBe(false)
    expect(isOrgMenuScope(null as any)).toBe(false)
    expect(isOrgMenuScope(undefined as any)).toBe(false)
  })

  it('handles trimmed paths', () => {
    expect(isOrgMenuScope('  /org/xyz  ')).toBe(true)
  })
})
