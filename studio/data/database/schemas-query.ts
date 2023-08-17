import { useCallback } from 'react'
import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'
import { ResponseError } from 'types'

export type Schema = {
  name: string
}

export const getSchemasQuery = () => {
  const sql = /* SQL */ `
  SELECT nspname as name
  FROM pg_namespace
  WHERE
    nspname not in ('information_schema', 'pg_catalog', 'pg_toast')
    AND nspname not like 'pg_temp_%'
    AND nspname not like 'pg_toast_temp_%'
    AND has_schema_privilege(oid, 'CREATE, USAGE')
  ORDER BY nspname;
`.trim()

  return sql
}

export type SchemasVariables = {
  projectRef?: string
  connectionString?: string
}

export type SchemasData = { result: Schema[] }
export type SchemasError = unknown

export const useSchemasQuery = <TData extends SchemasData = SchemasData>(
  { projectRef, connectionString }: SchemasVariables,
  options: UseQueryOptions<ExecuteSqlData, SchemasError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getSchemasQuery(),
      queryKey: ['schemas'],
    },
    options
  )
}

export const useSchemasPrefetch = () => {
  const prefetch = useExecuteSqlPrefetch()

  return useCallback(
    ({ projectRef, connectionString }: SchemasVariables) =>
      prefetch({
        projectRef,
        connectionString,
        sql: getSchemasQuery(),
        queryKey: ['schemas'],
      }),
    [prefetch]
  )
}
