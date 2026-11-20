import type { CatalogQuery, SafeSqlFragment } from '@supabase/pg-meta'
import type { QueryKey } from '@tanstack/react-query'

import { executeSql, type PgMetaReadGrant } from './execute-sql-mutation'
import type { IsUserFaultSqlState } from '@/data/error-classification'
import type { Unguarded } from '@/data/fetchers'

type CatalogFallbackVariables = {
  projectRef?: string
  connectionString?: string | null
  /** The `queryName` of the query the fallback replaces. */
  queryName: string
  queryKey?: QueryKey
  isUserFaultSqlState?: IsUserFaultSqlState
  isRoleImpersonationEnabled?: boolean
  grant: PgMetaReadGrant | Unguarded
}

/**
 * TEMPORARY, with pg-meta's catalog fallbacks (`catalog-fallback.ts`): runs a fallback's SQL through
 * `executeSql` as the query it replaces ran.
 */
export const catalogFallbackQuery =
  (
    { queryName, ...variables }: CatalogFallbackVariables,
    signal?: AbortSignal,
    wrapSql: (sql: SafeSqlFragment) => SafeSqlFragment = (sql) => sql
  ): CatalogQuery =>
  async (sql) => {
    const { result } = await executeSql<Record<string, unknown>[]>(
      {
        ...variables,
        sqlOrigin: 'studio',
        queryName: `${queryName}-catalog-fallback`,
        sql: wrapSql(sql),
      },
      signal
    )
    return result
  }
