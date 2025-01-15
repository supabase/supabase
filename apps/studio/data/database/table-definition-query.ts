import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { CREATE_PG_GET_TABLEDEF_SQL } from './database-query-constants'
import { databaseKeys } from './keys'

type GetTableDefinitionArgs = {
  id?: number
}

// [Joshen] Eventually move this into entity-definition-query
const getTableDefinitionSql = ({ id }: GetTableDefinitionArgs) => {
  const sql = /* SQL */ `
    ${CREATE_PG_GET_TABLEDEF_SQL}

    with table_info as (
      select 
        n.nspname::text as schema,
        c.relname::text as name
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where c.oid = ${id}
    )
    select pg_temp.pg_get_tabledef (
      t.schema,
      t.name,
      false,
      'FKEYS_INTERNAL',
      'INCLUDE_TRIGGERS'
    ) as definition
    from table_info t;
  `.trim()

  return sql
}

export type TableDefinitionVariables = GetTableDefinitionArgs & {
  projectRef?: string
  connectionString?: string
}

export async function getTableDefinition(
  { projectRef, connectionString, id }: TableDefinitionVariables,
  signal?: AbortSignal
) {
  if (!id) {
    throw new Error('id is required')
  }

  const sql = getTableDefinitionSql({ id })
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['table-definition', id],
    },
    signal
  )

  return result[0].definition.trim() as string
}

export type TableDefinitionData = string
export type TableDefinitionError = ExecuteSqlError

export const useTableDefinitionQuery = <TData = TableDefinitionData>(
  { projectRef, connectionString, id }: TableDefinitionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<TableDefinitionData, TableDefinitionError, TData> = {}
) =>
  useQuery<TableDefinitionData, TableDefinitionError, TData>(
    databaseKeys.tableDefinition(projectRef, id),
    ({ signal }) => getTableDefinition({ projectRef, connectionString, id }, signal),
    {
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
      ...options,
    }
  )
