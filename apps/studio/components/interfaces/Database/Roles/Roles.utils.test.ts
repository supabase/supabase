import { describe, expect, it } from 'vitest'

import { isSupabaseRole } from './Roles.utils'

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
