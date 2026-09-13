import { describe, expect, it } from 'vitest'

import { getCategoryParamFromAsPath, getIntegrationsPageFromPathname } from './Integrations.utils'

describe('getIntegrationsPageFromPathname', () => {
  it('returns section only when no subsection', () => {
    expect(getIntegrationsPageFromPathname('/project/abc123/integrations')).toBe('integrations')
  })

  it('returns section and subsection when both present', () => {
    expect(getIntegrationsPageFromPathname('/project/abc123/integrations/xyz-456')).toBe(
      'integrations/xyz-456'
    )
  })

  it('returns empty string when path too short', () => {
    expect(getIntegrationsPageFromPathname('/project')).toBe('')
    expect(getIntegrationsPageFromPathname('/project/abc123')).toBe('')
    expect(getIntegrationsPageFromPathname('/')).toBe('')
    expect(getIntegrationsPageFromPathname('')).toBe('')
  })

  it('returns empty string when project segment not found', () => {
    expect(getIntegrationsPageFromPathname('/org/my-org')).toBe('')
  })

  it('handles trailing slash', () => {
    expect(getIntegrationsPageFromPathname('/project/abc123/integrations/')).toBe('integrations')
  })
})

describe('getCategoryParamFromAsPath', () => {
  it('returns category value when present', () => {
    expect(getCategoryParamFromAsPath('/project/ref/integrations?category=wrapper')).toBe('wrapper')
    expect(getCategoryParamFromAsPath('/path?category=postgres_extension')).toBe(
      'postgres_extension'
    )
  })

  it('returns null when category absent', () => {
    expect(getCategoryParamFromAsPath('/project/ref/integrations')).toBeNull()
    expect(getCategoryParamFromAsPath('/path?foo=bar')).toBeNull()
  })

  it('returns null for invalid input', () => {
    expect(getCategoryParamFromAsPath(undefined)).toBeNull()
    expect(getCategoryParamFromAsPath('')).toBeNull()
  })
})
