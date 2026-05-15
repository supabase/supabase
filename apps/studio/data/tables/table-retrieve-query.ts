import pgMeta from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { tableKeys } from './keys'
import { getQueryClient } from '@/data/query-client'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { SafePostgresTable } from '@/lib/postgres-types'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type TablesVariables = {
  projectRef?: string
  connectionString?: string | null
  name: string
  schema: string
}

export async function getTable(
  { projectRef, connectionString, name, schema }: TablesVariables,
  signal?: AbortSignal
): Promise<SafePostgresTable> {
  const { sql, zod } = pgMeta.tables.retrieve({ name, schema })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: tableKeys.retrieve(projectRef, name, schema),
    },
    signal
  )
  // pg-meta sources `check` from pg_catalog; treat it as SafeSqlFragment for DDL composition.
  return zod.parse(result[0]) as unknown as SafePostgresTable
}

export type RetrieveTableResult = Awaited<ReturnType<typeof getTable>>
export type RetrieveTableError = ResponseError
export type RetrievedTableColumn = NonNullable<RetrieveTableResult['columns']>[number]

export const useTableQuery = <TData = RetrieveTableResult>(
  { projectRef, connectionString, name, schema }: TablesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<RetrieveTableResult, RetrieveTableError, TData> = {}
) => {
  return useQuery<RetrieveTableResult, RetrieveTableError, TData>({
    queryKey: tableKeys.retrieve(projectRef, name, schema),
    queryFn: ({ signal }) => getTable({ projectRef, connectionString, name, schema }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
}

/**
 * Non-hook usage to fetch data + caching it into the store
 */
export const getTableQuery = async ({
  projectRef,
  name,
  schema,
  connectionString,
}: {
  projectRef: string
  name: string
  schema: string
  connectionString?: string | null
}) => {
  const queryClient = getQueryClient()
  const table = await queryClient.fetchQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: tableKeys.retrieve(projectRef, name, schema),
    queryFn: ({ signal }) => getTable({ projectRef, connectionString, name, schema }, signal),
  })
  return table
}
