import { describe, expect, it } from 'vitest'

import {
  getRoleSelectionUpdate,
  getSelectedRoleOption,
} from '@/components/interfaces/RoleImpersonationSelector/RoleImpersonationSelector.utils'
import type { ImpersonationRole, PostgrestRole } from '@/lib/role-impersonation'

describe('getSelectedRoleOption', () => {
  const cases: Array<{
    name: string
    role: ImpersonationRole | undefined
    expected: PostgrestRole
  }> = [
    { name: 'defaults to Postgres when no role is set', role: undefined, expected: 'service_role' },
    {
      name: 'maps the service role to Postgres',
      role: { type: 'postgrest', role: 'service_role' },
      expected: 'service_role',
    },
    {
      name: 'maps custom roles to Postgres',
      role: { type: 'custom', role: 'reporter' },
      expected: 'service_role',
    },
    {
      name: 'preserves the anonymous role',
      role: { type: 'postgrest', role: 'anon' },
      expected: 'anon',
    },
    {
      name: 'preserves native authenticated roles',
      role: {
        type: 'postgrest',
        role: 'authenticated',
        userType: 'native',
      },
      expected: 'authenticated',
    },
    {
      name: 'preserves external authenticated roles',
      role: {
        type: 'postgrest',
        role: 'authenticated',
        userType: 'external',
      },
      expected: 'authenticated',
    },
  ]

  it.each(cases)('$name', ({ role, expected }) => {
    expect(getSelectedRoleOption(role)).toBe(expected)
  })
})

describe('getRoleSelectionUpdate', () => {
  it('clears role impersonation for Postgres', () => {
    expect(getRoleSelectionUpdate('service_role')).toEqual({
      shouldSetRole: true,
      role: undefined,
    })
  })

  it('sets the anonymous PostgREST role', () => {
    expect(getRoleSelectionUpdate('anon')).toEqual({
      shouldSetRole: true,
      role: { type: 'postgrest', role: 'anon' },
    })
  })

  it('waits for a user selection before setting the authenticated role', () => {
    expect(getRoleSelectionUpdate('authenticated')).toEqual({ shouldSetRole: false })
  })
})
