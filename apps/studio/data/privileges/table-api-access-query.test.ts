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

  it('returns false when anon is missing any CRUD privilege', () => {
    const privileges = fullPrivileges()
    privileges.anon = ['SELECT', 'INSERT', 'UPDATE'] // no DELETE
    expect(isFullyGranted(privileges)).toBe(false)
  })

  it('returns false when authenticated has no privileges at all', () => {
    const privileges = fullPrivileges()
    privileges.authenticated = []
    expect(isFullyGranted(privileges)).toBe(false)
  })

  it('returns false when service_role is missing a privilege', () => {
    const privileges = fullPrivileges()
    privileges.service_role = ['SELECT', 'INSERT', 'DELETE'] // no UPDATE
    expect(isFullyGranted(privileges)).toBe(false)
  })

  it('returns false when every role has only SELECT (partial across the board)', () => {
    const privileges: ApiPrivilegesByRole = {
      anon: ['SELECT'],
      authenticated: ['SELECT'],
      service_role: ['SELECT'],
    }
    expect(isFullyGranted(privileges)).toBe(false)
  })

  it('returns false when no role has any privileges', () => {
    const privileges: ApiPrivilegesByRole = {
      anon: [],
      authenticated: [],
      service_role: [],
    }
    expect(isFullyGranted(privileges)).toBe(false)
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
