import pgMeta, { type SafeSqlFragment } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { databaseKeys } from '@/data/database/keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type DatabaseFunctionsVariables = {
  projectRef?: string
  connectionString?: string | null
  schema?: string
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
  type: 'function' | 'procedure'
}

export async function getDatabaseFunctions(
  { projectRef, connectionString, schema }: DatabaseFunctionsVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  let headers = new Headers(headersInit)

  const pgMetaFunctionsList = pgMeta.functions.list({
    includedSchemas: schema ? [schema] : undefined,
  })
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
  vars: DatabaseFunctionsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DatabaseFunctionsData, DatabaseFunctionsError, TData> = {}
) => {
  const { projectRef, schema } = vars
  return useQuery<DatabaseFunctionsData, DatabaseFunctionsError, TData>({
    queryKey: databaseKeys.databaseFunctions(projectRef, schema),
    queryFn: ({ signal }) => getDatabaseFunctions(vars, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
}
