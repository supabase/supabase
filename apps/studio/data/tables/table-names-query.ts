import { useQuery } from '@tanstack/react-query'

import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { tableKeys } from './keys'
import type { UseCustomQueryOptions } from '@/types'

export type TableName = {
  id: number
  schema: string
  name: string
}

export type TableNamesVariables = {
  projectRef?: string
  connectionString?: string | null
}

const TABLE_NAMES_SQL = /* sql */ `
select
  c.oid::int8 as id,
  nc.nspname as schema,
  c.relname as name
from pg_namespace nc
join pg_class c on nc.oid = c.relnamespace
where c.relkind in ('r', 'p')
  and not pg_is_other_temp_schema(nc.oid)
  and nc.nspname not in ('information_schema', 'pg_catalog', 'pg_toast')
  and (
    pg_has_role(c.relowner, 'USAGE')
    or has_table_privilege(c.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
    or has_any_column_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
  )
order by nc.nspname, c.relname
`.trim()

export async function getTableNames(
  { projectRef, connectionString }: TableNamesVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<TableName[]>(
    { projectRef, connectionString, sql: TABLE_NAMES_SQL, queryKey: ['table-names'] },
    signal
  )
  return result
}

export type TableNamesData = Awaited<ReturnType<typeof getTableNames>>
export type TableNamesError = ExecuteSqlError

export const useTableNamesQuery = <TData = TableNamesData>(
  { projectRef, connectionString }: TableNamesVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<TableNamesData, TableNamesError, TData> = {}
) =>
  useQuery<TableNamesData, TableNamesError, TData>({
    queryKey: tableKeys.names(projectRef),
    queryFn: ({ signal }) => getTableNames({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
