import type { Policy } from '@/components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import type { ParseSQLQueryResponse } from '@/data/misc/parse-query-mutation'

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
