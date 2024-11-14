import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'

type GetTableConstraintsVariables = {
  id?: number
}

export type Constraint = {
  id: number
  name: string
  type: string
}

export enum CONSTRAINT_TYPE {
  CHECK_CONSTRAINT = 'c',
  FOREIGN_KEY_CONSTRAINT = 'f',
  PRIMARY_KEY_CONSTRAINT = 'p',
  UNIQUE_CONSTRAINT = 'u',
  CONSTRAINT_TRIGGER = 't',
  EXCLUSION_CONSTRAINT = 'x',
}

export const getTableConstraintsSql = ({ id }: GetTableConstraintsVariables) => {
  const sql = /* SQL */ `
  with table_info as (
    select 
      n.nspname::text as schema,
      c.relname::text as name,
      to_regclass(concat('"', n.nspname, '"."', c.relname, '"')) as regclass
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.oid = ${id}
)
select 
    con.oid as id,
    con.conname as name,
    con.contype as type
from pg_catalog.pg_constraint con
inner join pg_catalog.pg_class rel
        on rel.oid = con.conrelid
inner join pg_catalog.pg_namespace nsp
        on nsp.oid = connamespace
inner join table_info ti
        on ti.schema = nsp.nspname 
        and ti.name = rel.relname;
`.trim()

  return sql
}

export type TableConstraintsVariables = GetTableConstraintsVariables & {
  projectRef?: string
  connectionString?: string
}

export type TableConstraintsData = Constraint[]
export type TableConstraintsError = ExecuteSqlError

export async function getTableConstraints(
  { projectRef, connectionString, id }: TableConstraintsVariables,
  signal?: AbortSignal
) {
  const sql = getTableConstraintsSql({ id })
  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['table-constraints', id] },
    signal
  )

  return (result as TableConstraintsData) ?? []
}

export const useTableConstraintsQuery = <TData = TableConstraintsData>(
  { projectRef, connectionString, id }: TableConstraintsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<TableConstraintsData, TableConstraintsError, TData> = {}
) =>
  useQuery<TableConstraintsData, TableConstraintsError, TData>(
    databaseKeys.tableConstraints(projectRef, id),
    ({ signal }) => getTableConstraints({ projectRef, connectionString, id }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
      ...options,
    }
  )
