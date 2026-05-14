import type { SafeSqlFragment } from '@supabase/pg-meta'
import { describe, expect, it } from 'vitest'

import type { Policy } from '@/components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import type { ParseQueryResults } from '@/components/interfaces/Auth/RLSTester/RLSTester.types'
import { deriveRLSTestState } from '@/components/interfaces/Auth/RLSTester/RLSTesterResults.utils'

const sql = (s: string) => s as unknown as SafeSqlFragment

const makePolicy = (definition: string | null = null): Policy =>
  ({ definition: definition !== null ? sql(definition) : null }) as Policy

const makeTable = (
  overrides?: Partial<ParseQueryResults['tables'][number]>
): ParseQueryResults['tables'][number] => ({
  schema: 'public',
  table: 'items',
  isRLSEnabled: true,
  tablePolicies: [],
  ...overrides,
})

const makeResults = (overrides?: Partial<ParseQueryResults>): ParseQueryResults => ({
  tables: [],
  operation: 'SELECT',
  role: 'anon',
  ...overrides,
})

describe('deriveRLSTestState', () => {
  describe('isServiceRole', () => {
    it('is true when parseQueryResults is undefined', () => {
      const { isServiceRole } = deriveRLSTestState(undefined)
      expect(isServiceRole).toBe(true)
    })

    it('is true when role is undefined (postgres / service role)', () => {
      const { isServiceRole } = deriveRLSTestState(makeResults({ role: undefined }))
      expect(isServiceRole).toBe(true)
    })

    it('is false when role is anon', () => {
      const { isServiceRole } = deriveRLSTestState(makeResults({ role: 'anon' }))
      expect(isServiceRole).toBe(false)
    })

    it('is false when role is authenticated', () => {
      const { isServiceRole } = deriveRLSTestState(makeResults({ role: 'authenticated' }))
      expect(isServiceRole).toBe(false)
    })
  })

  describe('noAccessToData', () => {
    it('is false when parseQueryResults is undefined', () => {
      const { noAccessToData } = deriveRLSTestState(undefined)
      expect(noAccessToData).toBe(false)
    })

    it('is false for service role even when tables have no policies', () => {
      const { noAccessToData } = deriveRLSTestState(
        makeResults({ role: undefined, tables: [makeTable()] })
      )
      expect(noAccessToData).toBe(false)
    })

    it('is false when RLS is disabled on table', () => {
      const { noAccessToData } = deriveRLSTestState(
        makeResults({ tables: [makeTable({ isRLSEnabled: false, tablePolicies: [] })] })
      )
      expect(noAccessToData).toBe(false)
    })

    it('is true when RLS is enabled and table has no policies', () => {
      const { noAccessToData } = deriveRLSTestState(
        makeResults({ tables: [makeTable({ isRLSEnabled: true, tablePolicies: [] })] })
      )
      expect(noAccessToData).toBe(true)
    })

    it('is true when RLS is enabled and a policy definition is false', () => {
      const { noAccessToData } = deriveRLSTestState(
        makeResults({
          tables: [makeTable({ tablePolicies: [makePolicy('false')] })],
        })
      )
      expect(noAccessToData).toBe(true)
    })

    it('is false when RLS is enabled and policies are valid (not false)', () => {
      const { noAccessToData } = deriveRLSTestState(
        makeResults({
          tables: [makeTable({ tablePolicies: [makePolicy('auth.uid() = user_id')] })],
        })
      )
      expect(noAccessToData).toBe(false)
    })

    it('is false when all tables have RLS disabled regardless of policy state', () => {
      const { noAccessToData } = deriveRLSTestState(
        makeResults({
          tables: [
            makeTable({ isRLSEnabled: false, tablePolicies: [] }),
            makeTable({
              table: 'other',
              isRLSEnabled: false,
              tablePolicies: [makePolicy('false')],
            }),
          ],
        })
      )
      expect(noAccessToData).toBe(false)
    })
  })

  describe('tableWithRLSEnabledButNoPolicies', () => {
    it('is undefined when no tables', () => {
      const { tableWithRLSEnabledButNoPolicies } = deriveRLSTestState(makeResults({ tables: [] }))
      expect(tableWithRLSEnabledButNoPolicies).toBeUndefined()
    })

    it('is undefined when RLS disabled', () => {
      const { tableWithRLSEnabledButNoPolicies } = deriveRLSTestState(
        makeResults({ tables: [makeTable({ isRLSEnabled: false })] })
      )
      expect(tableWithRLSEnabledButNoPolicies).toBeUndefined()
    })

    it('is undefined when table has policies', () => {
      const { tableWithRLSEnabledButNoPolicies } = deriveRLSTestState(
        makeResults({ tables: [makeTable({ tablePolicies: [makePolicy('true')] })] })
      )
      expect(tableWithRLSEnabledButNoPolicies).toBeUndefined()
    })

    it('returns the matching table when RLS enabled with no policies', () => {
      const table = makeTable({ table: 'profiles', tablePolicies: [] })
      const { tableWithRLSEnabledButNoPolicies } = deriveRLSTestState(
        makeResults({ tables: [table] })
      )
      expect(tableWithRLSEnabledButNoPolicies).toEqual(table)
    })

    it('returns the first matching table among multiple', () => {
      const first = makeTable({ table: 'profiles', tablePolicies: [] })
      const second = makeTable({ table: 'posts', tablePolicies: [] })
      const { tableWithRLSEnabledButNoPolicies } = deriveRLSTestState(
        makeResults({ tables: [first, second] })
      )
      expect(tableWithRLSEnabledButNoPolicies).toEqual(first)
    })
  })

  describe('tableWithRLSEnabledWithPolicyFalse', () => {
    it('is undefined when no tables', () => {
      const { tableWithRLSEnabledWithPolicyFalse } = deriveRLSTestState(makeResults({ tables: [] }))
      expect(tableWithRLSEnabledWithPolicyFalse).toBeUndefined()
    })

    it('is undefined when RLS disabled even with false policy', () => {
      const { tableWithRLSEnabledWithPolicyFalse } = deriveRLSTestState(
        makeResults({
          tables: [makeTable({ isRLSEnabled: false, tablePolicies: [makePolicy('false')] })],
        })
      )
      expect(tableWithRLSEnabledWithPolicyFalse).toBeUndefined()
    })

    it('is undefined when no policy has definition of false', () => {
      const { tableWithRLSEnabledWithPolicyFalse } = deriveRLSTestState(
        makeResults({
          tables: [makeTable({ tablePolicies: [makePolicy('auth.uid() = user_id')] })],
        })
      )
      expect(tableWithRLSEnabledWithPolicyFalse).toBeUndefined()
    })

    it('returns the table when a policy definition is exactly "false"', () => {
      const table = makeTable({ table: 'secrets', tablePolicies: [makePolicy('false')] })
      const { tableWithRLSEnabledWithPolicyFalse } = deriveRLSTestState(
        makeResults({ tables: [table] })
      )
      expect(tableWithRLSEnabledWithPolicyFalse).toEqual(table)
    })

    it('is undefined when policy definition is null (no definition)', () => {
      const { tableWithRLSEnabledWithPolicyFalse } = deriveRLSTestState(
        makeResults({ tables: [makeTable({ tablePolicies: [makePolicy(null)] })] })
      )
      expect(tableWithRLSEnabledWithPolicyFalse).toBeUndefined()
    })
  })
})
