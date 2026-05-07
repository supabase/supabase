import pgMeta from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { databaseKeys } from 'data/database/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { z } from 'zod'

export type DatabaseFunctionsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export type DatabaseFunction = z.infer<typeof pgMeta.functions.pgFunctionZod>

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

  return result as DatabaseFunction[]
}

export type DatabaseFunctionsData = z.infer<typeof pgMetaFunctionsList.zod>
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
