import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'

type GetViewDefinitionArgs = {
  id?: number
}

// [Joshen] Eventually move this into entity-definition-query
export const getViewDefinitionSql = ({ id }: GetViewDefinitionArgs) => {
  if (!id) {
    throw new Error('id is required')
  }

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
    select pg_get_viewdef(t.regclass, true) as definition
    from table_info t
  `.trim()

  return sql
}

export type ViewDefinitionVariables = GetViewDefinitionArgs & {
  projectRef?: string
  connectionString?: string
}

export async function getViewDefinition(
  { projectRef, connectionString, id }: ViewDefinitionVariables,
  signal?: AbortSignal
) {
  const sql = getViewDefinitionSql({ id })
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['view-definition', id],
    },
    signal
  )

  return result[0].definition.trim()
}

export type ViewDefinitionData = string
export type ViewDefinitionError = ExecuteSqlError

export const useViewDefinitionQuery = <TData = ViewDefinitionData>(
  { projectRef, connectionString, id }: ViewDefinitionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ViewDefinitionData, ViewDefinitionError, TData> = {}
) =>
  useQuery<ViewDefinitionData, ViewDefinitionError, TData>(
    databaseKeys.viewDefinition(projectRef, id),
    ({ signal }) => getViewDefinition({ projectRef, connectionString, id }, signal),
    {
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
      ...options,
    }
  )
