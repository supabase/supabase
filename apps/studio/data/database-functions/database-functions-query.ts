import pgMeta from '@supabase/pg-meta'
import { UseQueryOptions } from '@tanstack/react-query'
import type { ExecuteSqlData, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { useExecuteSqlQuery } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { z } from 'zod'

export type DatabaseFunctionsVariables = {
  projectRef?: string
  connectionString?: string
}

export type DatabaseFunction = z.infer<typeof pgMeta.functions.pgFunctionZod>

const pgMetaFunctionsList = pgMeta.functions.list()

export type DatabaseFunctionsData = z.infer<typeof pgMetaFunctionsList.zod>
export type DatabaseFunctionsError = ResponseError

export const useDatabaseFunctionsQuery = <
  TData extends DatabaseFunctionsData = DatabaseFunctionsData,
>(
  { projectRef, connectionString }: DatabaseFunctionsVariables,
  options: UseQueryOptions<ExecuteSqlData, ExecuteSqlError, TData> = {}
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
