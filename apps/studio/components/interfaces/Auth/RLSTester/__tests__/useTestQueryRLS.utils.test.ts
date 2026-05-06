import { describe, expect, it } from 'vitest'

import type { Policy } from '@/components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import { filterTablePolicies } from '@/components/interfaces/Auth/RLSTester/useTestQueryRLS.utils'

const makePolicy = (overrides: Partial<Policy>): Policy =>
  ({
    schema: 'public',
    table: 'items',
    roles: ['anon'],
    command: 'SELECT',
    ...overrides,
  }) as Policy

const base = {
  policies: [] as Policy[],
  schema: 'public',
  table: 'items',
  role: 'anon',
  operation: 'SELECT' as const,
}

describe('filterTablePolicies', () => {
  describe('schema / table matching', () => {
    it('excludes policies from a different schema', () => {
      const policy = makePolicy({ schema: 'private', table: 'items' })
      expect(filterTablePolicies({ ...base, policies: [policy] })).toHaveLength(0)
    })

    it('excludes policies from a different table', () => {
      const policy = makePolicy({ schema: 'public', table: 'other' })
      expect(filterTablePolicies({ ...base, policies: [policy] })).toHaveLength(0)
    })

    it('includes a policy matching schema and table', () => {
      const policy = makePolicy({ schema: 'public', table: 'items' })
      expect(filterTablePolicies({ ...base, policies: [policy] })).toHaveLength(1)
    })
  })

  describe('role matching', () => {
    it('includes policy when role is in the policy roles array', () => {
      const policy = makePolicy({ roles: ['anon', 'authenticated'] })
      expect(filterTablePolicies({ ...base, role: 'anon', policies: [policy] })).toHaveLength(1)
    })

    it('excludes policy when role is not in the policy roles array', () => {
      const policy = makePolicy({ roles: ['authenticated'] })
      expect(filterTablePolicies({ ...base, role: 'anon', policies: [policy] })).toHaveLength(0)
    })

    it('includes policy when the only role is "public" (applies to all roles)', () => {
      const policy = makePolicy({ roles: ['public'] })
      expect(filterTablePolicies({ ...base, role: 'anon', policies: [policy] })).toHaveLength(1)
    })

    it('excludes "public" role shortcut when policy has multiple roles including public', () => {
      const policy = makePolicy({ roles: ['public', 'authenticated'] })
      expect(filterTablePolicies({ ...base, role: 'anon', policies: [policy] })).toHaveLength(0)
    })

    it('handles undefined role (service role) — matches nothing unless public', () => {
      const rolePolicy = makePolicy({ roles: ['anon'] })
      const publicPolicy = makePolicy({ roles: ['public'] })
      const result = filterTablePolicies({
        ...base,
        role: undefined,
        policies: [rolePolicy, publicPolicy],
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(publicPolicy)
    })
  })

  describe('command matching', () => {
    it('includes policy when command matches the operation', () => {
      const policy = makePolicy({ command: 'SELECT' })
      expect(
        filterTablePolicies({ ...base, operation: 'SELECT', policies: [policy] })
      ).toHaveLength(1)
    })

    it('excludes policy when command does not match the operation', () => {
      const policy = makePolicy({ command: 'INSERT' })
      expect(
        filterTablePolicies({ ...base, operation: 'SELECT', policies: [policy] })
      ).toHaveLength(0)
    })

    it('includes policy with command ALL regardless of operation', () => {
      const policy = makePolicy({ command: 'ALL' })
      expect(
        filterTablePolicies({ ...base, operation: 'SELECT', policies: [policy] })
      ).toHaveLength(1)
    })

    it('includes ALL command policy for non-SELECT operations too', () => {
      const policy = makePolicy({ command: 'ALL' })
      expect(
        filterTablePolicies({ ...base, operation: 'INSERT', policies: [policy] })
      ).toHaveLength(1)
    })

    it('does not include a SELECT-only policy when operation is INSERT', () => {
      const policy = makePolicy({ command: 'SELECT' })
      expect(
        filterTablePolicies({ ...base, operation: 'INSERT', policies: [policy] })
      ).toHaveLength(0)
    })
  })

  describe('combined filters', () => {
    it('returns only policies that satisfy all conditions', () => {
      const match = makePolicy({
        schema: 'public',
        table: 'items',
        roles: ['anon'],
        command: 'ALL',
      })
      const wrongSchema = makePolicy({
        schema: 'private',
        table: 'items',
        roles: ['anon'],
        command: 'ALL',
      })
      const wrongRole = makePolicy({
        schema: 'public',
        table: 'items',
        roles: ['authenticated'],
        command: 'ALL',
      })
      const wrongCommand = makePolicy({
        schema: 'public',
        table: 'items',
        roles: ['anon'],
        command: 'INSERT',
      })

      const result = filterTablePolicies({
        ...base,
        policies: [match, wrongSchema, wrongRole, wrongCommand],
      })
      expect(result).toHaveLength(1)
      expect(result[0]).toBe(match)
    })
  })
})
