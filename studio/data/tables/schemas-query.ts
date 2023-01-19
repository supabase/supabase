import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'

export const getSchemasSql = () => {
  const sql = /* SQL */ `
    select
      n.oid::int8 AS "id",
      n.nspname AS "name"
    from
      pg_namespace n
    where
      pg_has_role(n.nspowner, 'USAGE')
        or has_schema_privilege(n.oid, 'CREATE, USAGE');
  `

  return sql
}

export type Schema = {
  id: number
  name: string
}

export type SchemasResponse = {
  result: Schema[]
}

export type SchemasVariables = {
  projectRef?: string
  connectionString?: string
}

export type SchemasData = SchemasResponse
export type SchemasError = unknown

export const useSchemasQuery = <TData extends SchemasData = SchemasData>(
  { projectRef, connectionString }: SchemasVariables,
  options: UseQueryOptions<ExecuteSqlData, SchemasError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getSchemasSql(),
      queryKey: ['schemas'],
    },
    options
  )

export const useSchemasPrefetch = ({ projectRef, connectionString }: SchemasVariables) => {
  return useExecuteSqlPrefetch({
    projectRef,
    connectionString,
    sql: getSchemasSql(),
    queryKey: ['schemas'],
  })
}
