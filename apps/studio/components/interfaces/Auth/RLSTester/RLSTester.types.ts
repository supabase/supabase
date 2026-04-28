import { type PostgresPolicy } from '@supabase/postgres-meta'

import { type User } from '@/data/auth/users-infinite-query'
import { type ParseSQLQueryResponse } from '@/data/misc/parse-query-mutation'

export type ParseQueryResults = {
  tables: {
    schema: string
    table: string
    tablePolicies: PostgresPolicy[]
    isRLSEnabled: boolean
  }[]
  operation: ParseSQLQueryResponse['operation']
  role?: string
  user?: User
}
