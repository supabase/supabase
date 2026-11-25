import { describe, expect, it } from 'vitest'

import { isSupabaseManagedRole, isSupabaseRole, isTrustedPartnerRole } from './Roles.utils'

describe('isSupabaseRole', () => {
  it('matches exact Supabase role names', () => {
    expect(isSupabaseRole('supabase_admin')).toBe(true)
    expect(isSupabaseRole('authenticated')).toBe(true)
  })

  it('matches roles with a Supabase-managed prefix', () => {
    expect(isSupabaseRole('support_ro_1a2b3c')).toBe(true)
  })

  it('does not match user-created roles', () => {
    expect(isSupabaseRole('my_role')).toBe(false)
    expect(isSupabaseRole('support_ro')).toBe(false)
    expect(isSupabaseRole('my_support_ro_role')).toBe(false)
  })
})

describe('isTrustedPartnerRole', () => {
  it('matches the comment the platform sets on Trusted Partner roles', () => {
    expect(isTrustedPartnerRole('{"_supabase":{"oauth_app_id":"app"}}')).toBe(true)
  })

  it('does not match other comments', () => {
    expect(isTrustedPartnerRole(null)).toBe(false)
    expect(isTrustedPartnerRole('')).toBe(false)
    expect(isTrustedPartnerRole('Role for reporting')).toBe(false)
    expect(isTrustedPartnerRole('{"_supabase":')).toBe(false)
    expect(isTrustedPartnerRole('{"_supabase":{}}')).toBe(false)
    expect(isTrustedPartnerRole('null')).toBe(false)
  })
})

describe('isSupabaseManagedRole', () => {
  it('matches Supabase roles by name and Trusted Partner roles by comment', () => {
    expect(isSupabaseManagedRole({ name: 'authenticated', comment: null })).toBe(true)
    expect(
      isSupabaseManagedRole({
        name: 'acme_user',
        comment: '{"_supabase":{"oauth_app_id":"app"}}',
      })
    ).toBe(true)
    expect(isSupabaseManagedRole({ name: 'acme_user', comment: null })).toBe(false)
  })
})
