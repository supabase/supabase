import pgMeta from '@supabase/pg-meta'
import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, useExecuteSqlQuery } from 'data/sql/execute-sql-query'
import { z } from 'zod'

export type DatabaseFunctionsVariables = {
  projectRef?: string
  connectionString?: string
}

export type DatabaseFunction = z.infer<typeof pgMeta.functions.pgFunctionZod>

const pgMetaFunctionsList = pgMeta.functions.list()

export type DatabaseFunctionsData = z.infer<typeof pgMetaFunctionsList.zod>
export type DatabaseFunctionsError = unknown

export const useDatabaseFunctionsQuery = <
  TData extends DatabaseFunctionsData = DatabaseFunctionsData,
>(
  { projectRef, connectionString }: DatabaseFunctionsVariables,
  options: UseQueryOptions<ExecuteSqlData, DatabaseFunctionsError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: pgMetaFunctionsList.sql,
      queryKey: ['functions-list'],
    },
    {
      select(data) {
        return (data as any)?.result ?? []
      },
      ...options,
    }
  )
}
