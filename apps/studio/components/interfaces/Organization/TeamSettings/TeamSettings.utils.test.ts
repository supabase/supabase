import { describe, expect, it } from 'vitest'

import { getMemberRowHeight, matchesMfaFilter } from './TeamSettings.utils'

describe('getMemberRowHeight', () => {
  it('uses the minimum height for members with one role', () => {
    expect(getMemberRowHeight({ role_ids: [1] })).toBe(60)
  })

  it('uses the minimum height when the role list is empty or missing', () => {
    expect(getMemberRowHeight({ role_ids: [] })).toBe(60)
    expect(getMemberRowHeight({} as { role_ids: number[] })).toBe(60)
  })

  it('grows by one line per role once the roles no longer fit in the minimum height', () => {
    expect(getMemberRowHeight({ role_ids: [1, 2, 3] })).toBe(60)
    expect(getMemberRowHeight({ role_ids: [1, 2, 3, 4] })).toBe(80)
    expect(getMemberRowHeight({ role_ids: [1, 2, 3, 4, 5] })).toBe(100)
  })
})

describe('matchesMfaFilter', () => {
  const withMfa = { mfa_enabled: true }
  const withoutMfa = { mfa_enabled: false }
  const invite = { mfa_enabled: false, invited_id: 1 }

  it('keeps everyone, including pending invites, when the filter is "all"', () => {
    expect(matchesMfaFilter(withMfa, 'all')).toBe(true)
    expect(matchesMfaFilter(withoutMfa, 'all')).toBe(true)
    expect(matchesMfaFilter(invite, 'all')).toBe(true)
  })

  it('keeps only members with MFA when the filter is "enabled"', () => {
    expect(matchesMfaFilter(withMfa, 'enabled')).toBe(true)
    expect(matchesMfaFilter(withoutMfa, 'enabled')).toBe(false)
  })

  it('keeps only members without MFA when the filter is "disabled"', () => {
    expect(matchesMfaFilter(withoutMfa, 'disabled')).toBe(true)
    expect(matchesMfaFilter(withMfa, 'disabled')).toBe(false)
  })

  it('leaves pending invites out of the "enabled" and "disabled" filters', () => {
    expect(matchesMfaFilter(invite, 'enabled')).toBe(false)
    expect(matchesMfaFilter(invite, 'disabled')).toBe(false)
  })
})
