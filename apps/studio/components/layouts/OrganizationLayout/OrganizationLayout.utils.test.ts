import { describe, expect, it } from 'vitest'

import { getPathnameWithoutQuery, isOrgMenuScope } from './OrganizationLayout.utils'

describe('getPathnameWithoutQuery', () => {
  it('strips query string from path', () => {
    expect(getPathnameWithoutQuery('/org/my-org?foo=bar', undefined)).toBe('/org/my-org')
  })

  it('returns asPath when no query', () => {
    expect(getPathnameWithoutQuery('/org/my-org', undefined)).toBe('/org/my-org')
  })

  it('uses fallback when asPath is undefined', () => {
    expect(getPathnameWithoutQuery(undefined, '/account/me')).toBe('/account/me')
  })

  it('returns empty string for invalid input', () => {
    expect(getPathnameWithoutQuery(undefined, undefined)).toBe('')
    expect(getPathnameWithoutQuery('', '')).toBe('')
  })
})

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
