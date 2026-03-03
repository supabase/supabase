import { describe, expect, it } from 'vitest'

import { getSectionKeyFromPathname } from './MobileMenuContent.utils'

describe('getSectionKeyFromPathname', () => {
  it('returns section key for project section paths', () => {
    expect(getSectionKeyFromPathname('/project/abc123/database/schemas')).toBe('database')
    expect(getSectionKeyFromPathname('/project/abc123/auth/users')).toBe('auth')
    expect(getSectionKeyFromPathname('/project/abc123/settings/general')).toBe('settings')
    expect(getSectionKeyFromPathname('/project/abc123/integrations')).toBe('integrations')
    expect(getSectionKeyFromPathname('/project/abc123/realtime/inspector')).toBe('realtime')
    expect(getSectionKeyFromPathname('/project/abc123/functions')).toBe('functions')
    expect(getSectionKeyFromPathname('/project/abc123/logs/explorer')).toBe('logs')
    expect(getSectionKeyFromPathname('/project/abc123/advisors/security')).toBe('advisors')
  })

  it('returns null for project home (no section segment)', () => {
    expect(getSectionKeyFromPathname('/project/abc123')).toBeNull()
    expect(getSectionKeyFromPathname('/project/abc123/')).toBeNull()
  })

  it('returns null when pathname does not contain "project"', () => {
    expect(getSectionKeyFromPathname('/org/my-org')).toBeNull()
    expect(getSectionKeyFromPathname('/account/me')).toBeNull()
    expect(getSectionKeyFromPathname('/')).toBeNull()
    expect(getSectionKeyFromPathname('')).toBeNull()
  })

  it('returns null when project segment is missing or dynamic', () => {
    expect(getSectionKeyFromPathname('/project')).toBeNull()
    expect(getSectionKeyFromPathname('/project/')).toBeNull()
    expect(getSectionKeyFromPathname('/project/[ref]/database/schemas')).toBeNull()
  })

  it('returns first segment after project ref as section key', () => {
    expect(getSectionKeyFromPathname('/project/foo/bar/baz')).toBe('bar')
  })
})
