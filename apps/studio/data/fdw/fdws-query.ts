import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { fdwKeys } from './keys'

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
            'id', c.oid::bigint,
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
            ),
            'options', t.ftoptions
          )
        )
        from pg_catalog.pg_class c
        join pg_catalog.pg_foreign_table t on c.oid = t.ftrelid
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
  schema: string
  columns: FDWColumn[]
  options: string[]
}

export type FDW = {
  id: number
  name: string
  handler: string
  server_name: string
  server_options: string[]
  tables: FDWTable[]
}

export type FDWsVariables = {
  projectRef?: string
  connectionString?: string
}

export async function getFDWs(
  { projectRef, connectionString }: FDWsVariables,
  signal?: AbortSignal
) {
  const sql = getFDWsSql()

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['fdws'] },
    signal
  )

  return result as FDW[]
}

export type FDWsData = Awaited<ReturnType<typeof getFDWs>>
export type FDWsError = ExecuteSqlError

export const useFDWsQuery = <TData = FDWsData>(
  { projectRef, connectionString }: FDWsVariables,
  { enabled = true, ...options }: UseQueryOptions<FDWsData, FDWsError, TData> = {}
) =>
  useQuery<FDWsData, FDWsError, TData>(
    fdwKeys.list(projectRef),
    ({ signal }) => getFDWs({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
