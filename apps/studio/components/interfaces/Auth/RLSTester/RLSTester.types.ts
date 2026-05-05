import type { Policy } from '@/components/interfaces/Auth/Policies/PolicyTableRow/PolicyTableRow.utils'
import { type User } from '@/data/auth/users-infinite-query'
import { type ParseSQLQueryResponse } from '@/data/misc/parse-query-mutation'

export type ParseQueryResults = {
  tables: {
    schema: string
    table: string
    tablePolicies: Array<Policy>
    isRLSEnabled: boolean
  }[]
  operation: ParseSQLQueryResponse['operation']
  role?: string
  user?: User
}
