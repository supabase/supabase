import type { Policy } from '@/components/interfaces/Database/Policies/PolicyTableRow/PolicyTableRow.utils'
import type { ParseSQLQueryResponse } from '@/data/misc/parse-query-mutation'

export type TestQueryBlockedReason =
  | { type: 'multiple-statements' }
  | { type: 'unsupported-operation'; operation: 'UPDATE' | 'DELETE' }
  | { type: 'mutation'; operation: 'INSERT' }

/**
 * Decides whether a query should be blocked from running, and why. Checked in this order:
 * multiple statements first (regardless of operation), then unsupported operations (UPDATE/
 * DELETE aren't testable yet - RLS blocks them silently instead of raising an error), then
 * INSERT mutations against the real database that haven't been acknowledged yet.
 */
export function getTestQueryBlockedReason({
  statementCount,
  operation,
  hasSandbox,
  acknowledgeMutation,
}: {
  statementCount: number
  operation: ParseSQLQueryResponse['operation']
  hasSandbox: boolean
  acknowledgeMutation: boolean
}): TestQueryBlockedReason | undefined {
  if (statementCount > 1) return { type: 'multiple-statements' }
  if (operation === 'UPDATE' || operation === 'DELETE') {
    return { type: 'unsupported-operation', operation }
  }
  if (operation === 'INSERT' && !hasSandbox && !acknowledgeMutation) {
    return { type: 'mutation', operation }
  }
  return undefined
}

export function filterTablePolicies({
  policies,
  schema,
  table,
  role,
  operation,
}: {
  policies: Policy[]
  schema: string
  table: string
  role: string | undefined
  operation: ParseSQLQueryResponse['operation']
}): Policy[] {
  return policies.filter(
    (x) =>
      x.schema === schema &&
      x.table === table &&
      (x.roles.includes(role ?? '') || (x.roles.length === 1 && x.roles[0] === 'public')) &&
      (x.command === 'ALL' || x.command === operation)
  )
}
