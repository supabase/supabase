import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'
import { Table } from './table-query'

export const getTablesSql = ({ schema = 'public' }: { schema?: string }) => {
  const sql = /* SQL */ `
    select
      c.oid::int8 AS "id",
      nc.nspname AS "schema",
      c.relname AS "name",
      case c.relkind
        when 'r' then 'table'
        when 'v' then 'view'
        when 'm' then 'materialized_view'
        when 'f' then 'foreign_table'
        when 'p' then 'partitioned_table'
      end as "type",
      obj_description(c.oid) AS "comment"
    from
      pg_namespace nc
      join pg_class c on nc.oid = c.relnamespace
    where
      c.relkind in ('r', 'v', 'm', 'f', 'p')
      and not pg_is_other_temp_schema(nc.oid)
      and (
        pg_has_role(c.relowner, 'USAGE')
        or has_table_privilege(
          c.oid,
          'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
        )
        or has_any_column_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
      )
      and nc.nspname = '${schema}'
    order by "name" asc;
  `

  return sql
}

export type TablesResponse = {
  result: Table[]
}

export type TablesVariables = {
  projectRef?: string
  connectionString?: string
  schema?: string
}

export type TablesData = TablesResponse
export type TablesError = unknown

export const useTablesQuery = <TData extends TablesData = TablesData>(
  { projectRef, connectionString, schema }: TablesVariables,
  { enabled = true, ...options }: UseQueryOptions<ExecuteSqlData, TablesError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getTablesSql({ schema }),
      queryKey: [schema, 'tables'],
    },
    {
      enabled: enabled && typeof schema !== 'undefined',
      ...options,
    }
  )

export const useTablesPrefetch = ({ projectRef, connectionString, schema }: TablesVariables) => {
  return useExecuteSqlPrefetch({
    projectRef,
    connectionString,
    sql: getTablesSql({ schema }),
    queryKey: [schema, 'tables'],
  })
}
