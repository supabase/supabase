import { describe, expect, it } from 'vitest'

import { isFullyGranted } from './table-api-access-query'
import type { ApiPrivilegesByRole } from '@/lib/data-api-types'

const fullPrivileges = (): ApiPrivilegesByRole => ({
  anon: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  authenticated: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  service_role: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
})

describe('isFullyGranted', () => {
  it('returns true when all 3 API roles have all 4 CRUD privileges', () => {
    expect(isFullyGranted(fullPrivileges())).toBe(true)
  })

  it.each<[string, Partial<ApiPrivilegesByRole>]>([
    ['anon is missing DELETE', { anon: ['SELECT', 'INSERT', 'UPDATE'] }],
    ['authenticated has no privileges', { authenticated: [] }],
    ['service_role is missing UPDATE', { service_role: ['SELECT', 'INSERT', 'DELETE'] }],
    [
      'every role has only SELECT',
      { anon: ['SELECT'], authenticated: ['SELECT'], service_role: ['SELECT'] },
    ],
    ['no role has any privileges', { anon: [], authenticated: [], service_role: [] }],
  ])('returns false when %s', (_, overrides) => {
    expect(isFullyGranted({ ...fullPrivileges(), ...overrides })).toBe(false)
  })

  it('tolerates duplicate privilege entries', () => {
    const privileges: ApiPrivilegesByRole = {
      anon: ['SELECT', 'SELECT', 'INSERT', 'UPDATE', 'DELETE'],
      authenticated: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
      service_role: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
    }
    expect(isFullyGranted(privileges)).toBe(true)
  })

  it('ignores privilege order', () => {
    const privileges: ApiPrivilegesByRole = {
      anon: ['DELETE', 'UPDATE', 'INSERT', 'SELECT'],
      authenticated: ['UPDATE', 'DELETE', 'SELECT', 'INSERT'],
      service_role: ['INSERT', 'SELECT', 'DELETE', 'UPDATE'],
    }
    expect(isFullyGranted(privileges)).toBe(true)
  })
})
