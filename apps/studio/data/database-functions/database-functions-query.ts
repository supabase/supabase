import pgMeta, { type SafeSqlFragment } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { databaseKeys } from '@/data/database/keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type DatabaseFunctionsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export type DatabaseFunction = z.infer<typeof pgMeta.functions.pgFunctionZod>
export type SavedDatabaseFunction = Omit<
  DatabaseFunction,
  | 'complete_statement'
  | 'argument_types'
  | 'identity_argument_types'
  | 'return_type'
  | 'config_params'
> & {
  complete_statement: SafeSqlFragment
  argument_types: SafeSqlFragment
  identity_argument_types: SafeSqlFragment
  return_type: SafeSqlFragment
  config_params: Record<string, SafeSqlFragment> | null
}

const pgMetaFunctionsList = pgMeta.functions.list()

export async function getDatabaseFunctions(
  { projectRef, connectionString }: DatabaseFunctionsVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  let headers = new Headers(headersInit)

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: pgMetaFunctionsList.sql,
      queryKey: ['database-functions'],
    },
    signal,
    headers
  )

  return result as SavedDatabaseFunction[]
}

export type DatabaseFunctionsData = Awaited<ReturnType<typeof getDatabaseFunctions>>
export type DatabaseFunctionsError = ResponseError

export const useDatabaseFunctionsQuery = <TData = DatabaseFunctionsData>(
  { projectRef, connectionString }: DatabaseFunctionsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DatabaseFunctionsData, DatabaseFunctionsError, TData> = {}
) =>
  useQuery<DatabaseFunctionsData, DatabaseFunctionsError, TData>({
    queryKey: databaseKeys.databaseFunctions(projectRef),
    queryFn: ({ signal }) => getDatabaseFunctions({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
