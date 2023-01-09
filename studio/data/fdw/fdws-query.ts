import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'

// [Joshen] Think twice - do we really need the columns here?
// This query can just be specifically scoped to the FDW UI
export const getFDWsSql = () => {
  const sql = /* SQL */ `
    select
      s.oid as "id",
      w.fdwname as "name",
      s.srvname as "server_name",
      s.srvoptions as "server_options",
      c.proname as "handler",
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', c.oid,
            'schema', relnamespace::regnamespace::text,
            'name', c.relname,
            'columns', (
              select jsonb_agg(
                jsonb_build_object(
                  'name', a.attname,
                  'type', pg_catalog.format_type(a.atttypid, a.atttypmod)
                )
              )
              from pg_catalog.pg_attribute a
              where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
            )
          )
        )
        from pg_catalog.pg_class c
        where c.oid = any (select t.ftrelid from pg_catalog.pg_foreign_table t where t.ftserver = s.oid)
      ) as "tables"
    from pg_catalog.pg_foreign_server s
    join pg_catalog.pg_foreign_data_wrapper w on s.srvfdw = w.oid
    join pg_catalog.pg_proc c on w.fdwhandler = c.oid;
  `

  return sql
}

export type FDWColumn = {
  name: string
  type: string
}

export type FDWTable = {
  id: string
  name: string
  columns: FDWColumn[]
}

export type FDW = {
  id: string
  name: string
  tables: FDWTable[]
}

export type FDWsResponse = {
  result: FDW[]
}

export type FDWsVariables = {
  projectRef?: string
  connectionString?: string
}

export type FDWsData = FDWsResponse
export type FDWsError = unknown

export const useFDWsQuery = <TData extends FDWsData = FDWsData>(
  { projectRef, connectionString }: FDWsVariables,
  options: UseQueryOptions<ExecuteSqlData, FDWsError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getFDWsSql(),
      queryKey: ['fdws'],
    },
    options
  )

export const useFDWsPrefetch = ({ projectRef, connectionString }: FDWsVariables) => {
  return useExecuteSqlPrefetch({
    projectRef,
    connectionString,
    sql: getFDWsSql(),
    queryKey: ['fdws'],
  })
}
