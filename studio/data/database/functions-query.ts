import { useCallback } from 'react'
import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'

export type DatabaseFunction = {
  schema: string
  name: string
  description: string
  result_type: any
  argument_types: any
  args?: string[]
}

export const getFunctionsQuery = () => {
  const sql = /* SQL */ `
SELECT n.nspname as "schema",
  p.proname as "name",
  d.description,
  pg_catalog.pg_get_function_result(p.oid) as "result_type",
  pg_catalog.pg_get_function_arguments(p.oid) as "argument_types",
CASE
  WHEN p.prokind = 'a' THEN 'agg'
  WHEN p.prokind = 'w' THEN 'window'
  WHEN p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
  ELSE 'normal'
  END as "type"
FROM pg_catalog.pg_proc p
  LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
  LEFT JOIN pg_catalog.pg_description d ON p.oid = d.objoid
WHERE n.nspname = 'public'
ORDER BY 1, 2, 4;
`.trim()

  return sql
}

export type FunctionsVariables = {
  projectRef?: string
  connectionString?: string
}

export type FunctionsData = { result: DatabaseFunction[] }
export type FunctionsError = unknown

export const useFunctionsQuery = <TData extends FunctionsData = FunctionsData>(
  { projectRef, connectionString }: FunctionsVariables,
  options: UseQueryOptions<ExecuteSqlData, FunctionsError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getFunctionsQuery(),
      queryKey: ['functions'],
    },
    {
      select: (data) => {
        return {
          result: data.result.map((x: DatabaseFunction) => {
            const args = x.argument_types
              .split(',')
              .filter((a: any) => a)
              .map((a: any) => a.trim())

            return { ...x, args }
          }),
        } as any
      },
      ...options,
    }
  )
}

export const useFunctionsPrefetch = () => {
  const prefetch = useExecuteSqlPrefetch()

  return useCallback(
    ({ projectRef, connectionString }: FunctionsVariables) =>
      prefetch({
        projectRef,
        connectionString,
        sql: getFunctionsQuery(),
        queryKey: ['functions'],
      }),
    [prefetch]
  )
}
