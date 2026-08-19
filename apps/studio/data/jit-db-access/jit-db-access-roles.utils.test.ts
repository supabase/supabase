import { describe, expect, test } from 'vitest'

import {
  getActiveTemporaryAccessRoles,
  getNextTemporaryAccessExpirySeconds,
  isTemporaryAccessRoleExpired,
} from './jit-db-access-roles.utils'

describe('isTemporaryAccessRoleExpired', () => {
  test('treats missing expiry as active and normalises second vs millisecond timestamps', () => {
    expect(isTemporaryAccessRoleExpired(undefined, 1_000)).toBe(false)
    expect(isTemporaryAccessRoleExpired(999, 1_000)).toBe(true)
    expect(isTemporaryAccessRoleExpired(1_001, 1_000)).toBe(false)
    expect(isTemporaryAccessRoleExpired(1_699_000_000_000, 1_700_000_000)).toBe(true)
    expect(isTemporaryAccessRoleExpired(1_701_000_000_000, 1_700_000_000)).toBe(false)
  })
})

describe('getActiveTemporaryAccessRoles', () => {
  test('keeps unexpired unique roles', () => {
    expect(getActiveTemporaryAccessRoles(undefined, 1_000)).toEqual([])
    expect(
      getActiveTemporaryAccessRoles(
        {
          user_roles: [
            { role: 'postgres', expires_at: 2_000 },
            { role: 'supabase_read_only_user', expires_at: 500 },
            { role: 'postgres' },
            { role: 'analytics' },
          ],
        },
        1_000
      )
    ).toEqual(['postgres', 'analytics'])
  })
})

describe('getNextTemporaryAccessExpirySeconds', () => {
  test('returns the soonest future expiry and ignores missing or past ones', () => {
    expect(getNextTemporaryAccessExpirySeconds(undefined, 1_000)).toBeUndefined()
    expect(
      getNextTemporaryAccessExpirySeconds(
        {
          user_roles: [
            { role: 'postgres', expires_at: 500 },
            { role: 'analytics' },
            { role: 'postgres', expires_at: 2_000 },
            { role: 'supabase_read_only_user', expires_at: 1_500 },
          ],
        },
        1_000
      )
    ).toBe(1_500)
    expect(
      getNextTemporaryAccessExpirySeconds(
        { user_roles: [{ role: 'postgres', expires_at: 1_701_000_000_000 }] },
        1_700_000_000
      )
    ).toBe(1_701_000_000)
  })
})
