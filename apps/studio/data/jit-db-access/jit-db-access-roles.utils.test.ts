import { describe, expect, test } from 'vitest'

import {
  getActiveTemporaryAccessRoles,
  isTemporaryAccessRoleExpired,
} from './jit-db-access-roles.utils'

describe('isTemporaryAccessRoleExpired', () => {
  test('treats a missing expiry as active', () => {
    expect(isTemporaryAccessRoleExpired(undefined, 1_000)).toBe(false)
  })

  test('compares unix seconds against now', () => {
    expect(isTemporaryAccessRoleExpired(999, 1_000)).toBe(true)
    expect(isTemporaryAccessRoleExpired(1_001, 1_000)).toBe(false)
  })

  test('normalises millisecond timestamps', () => {
    const now = 1_700_000_000
    expect(isTemporaryAccessRoleExpired(1_699_000_000_000, now)).toBe(true)
    expect(isTemporaryAccessRoleExpired(1_701_000_000_000, now)).toBe(false)
  })
})

describe('getActiveTemporaryAccessRoles', () => {
  test('returns an empty list when grants are missing', () => {
    expect(getActiveTemporaryAccessRoles(undefined, 1_000)).toEqual([])
    expect(getActiveTemporaryAccessRoles({}, 1_000)).toEqual([])
    expect(getActiveTemporaryAccessRoles({ user_roles: [] }, 1_000)).toEqual([])
  })

  test('keeps unexpired roles and drops expired ones', () => {
    expect(
      getActiveTemporaryAccessRoles(
        {
          user_roles: [
            { role: 'postgres', expires_at: 2_000 },
            { role: 'supabase_read_only_user', expires_at: 500 },
            { role: 'analytics' },
          ],
        },
        1_000
      )
    ).toEqual(['postgres', 'analytics'])
  })

  test('deduplicates role names', () => {
    expect(
      getActiveTemporaryAccessRoles(
        {
          user_roles: [{ role: 'postgres' }, { role: 'postgres' }],
        },
        1_000
      )
    ).toEqual(['postgres'])
  })
})
