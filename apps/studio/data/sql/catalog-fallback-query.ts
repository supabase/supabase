import { type CatalogQuery, type SafeSqlFragment } from '@supabase/pg-meta'
import type { QueryKey } from '@tanstack/react-query'

import { projectKeys } from '../projects/keys'
import { getProjectDetail } from '../projects/project-detail-query'
import { executeSql, type PgMetaReadGrant } from './execute-sql-mutation'
import type { IsUserFaultSqlState } from '@/data/error-classification'
import type { Unguarded } from '@/data/fetchers'
import { getQueryClient } from '@/data/query-client'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

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
 * TEMPORARY, with pg-meta's catalog fallbacks (`catalog-fallback.ts`): whether the project's
 * database is Spark, from the project detail (read through the query cache).
 */
export async function isSparkProject(projectRef: string | undefined): Promise<boolean> {
  if (!projectRef) return false
  const queryClient = getQueryClient()
  const project = await queryClient.ensureQueryData({
    queryKey: projectKeys.detail(projectRef),
    queryFn: ({ signal }) => getProjectDetail({ ref: projectRef }, signal, undefined, queryClient),
  })
  return project.postgres_engine === 'spark'
}

/** TEMPORARY, with pg-meta's catalog fallbacks: whether the selected project's database is Spark. */
export function useIsSparkProject() {
  const { data: project } = useSelectedProjectQuery()
  return project?.postgres_engine === 'spark'
}

/**
 * TEMPORARY, with pg-meta's catalog fallbacks: on a Spark project `fallback` runs instead of `run`,
 * which sends the pg-meta SQL Spark refuses; any other project runs `run`.
 */
export async function withSparkFallback<T>(
  projectRef: string | undefined,
  run: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  return (await isSparkProject(projectRef)) ? fallback() : run()
}

/**
 * TEMPORARY, with pg-meta's catalog fallbacks: runs a fallback's SQL through `executeSql` as the
 * query it replaces ran.
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

/**
 * TEMPORARY, with pg-meta's catalog fallbacks: `executeSql` for a pg-meta builder's SQL, or on a
 * Spark project `fallback` instead, so Spark never receives the SQL it refuses.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the same default as `executeSql`
export async function executeSqlWithCatalogFallback<T = any>(
  { sql, ...variables }: CatalogFallbackVariables & { sqlOrigin: 'studio'; sql: SafeSqlFragment },
  fallback: (query: CatalogQuery) => Promise<NoInfer<T>>,
  signal?: AbortSignal,
  headersInit?: HeadersInit
): Promise<{ result: T }> {
  return withSparkFallback(
    variables.projectRef,
    () => executeSql<T>({ ...variables, sql }, signal, headersInit),
    async () => ({ result: await fallback(catalogFallbackQuery(variables, signal)) })
  )
}
