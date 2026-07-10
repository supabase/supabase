import pgMeta from '@supabase/pg-meta'
import type { PGForeignTable } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { foreignTableKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type ForeignTablesVariables = {
  projectRef?: string
  connectionString?: string | null
  schemas?: string[]
}

export async function getForeignTables(
  { projectRef, connectionString, schemas }: ForeignTablesVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: pgMeta.foreignTables.list({ includedSchemas: schemas }).sql,
      queryKey: ['foreign-tables', schemas].filter(Boolean),
    },
    signal
  )

  return result as PGForeignTable[]
}

export type ForeignTablesData = Awaited<ReturnType<typeof getForeignTables>>
export type ForeignTablesError = ResponseError

export const useForeignTablesQuery = <TData = ForeignTablesData>(
  { projectRef, connectionString, schemas }: ForeignTablesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ForeignTablesData, ForeignTablesError, TData> = {}
) =>
  useQuery<ForeignTablesData, ForeignTablesError, TData>({
    queryKey: schemas
      ? foreignTableKeys.listBySchema(projectRef, schemas)
      : foreignTableKeys.list(projectRef),
    queryFn: ({ signal }) => getForeignTables({ projectRef, connectionString, schemas }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
