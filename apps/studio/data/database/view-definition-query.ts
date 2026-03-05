import { useQuery } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'
import { UseCustomQueryOptions } from 'types'

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
        c.reloptions,
        to_regclass(concat('"', n.nspname, '"."', c.relname, '"')) as regclass
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where c.oid = ${id}
    )
    select
      pg_get_viewdef(t.regclass, true) as definition,
      case
        when t.reloptions is not null and array_length(t.reloptions, 1) > 0
        then array_to_string(t.reloptions, ', ')
        else null
      end as options
    from table_info t
  `.trim()

  return sql
}

export type ViewDefinitionVariables = GetViewDefinitionArgs & {
  projectRef?: string
  connectionString?: string | null
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

  return {
    definition: result[0].definition.trim(),
    options: result[0].options ?? null,
  }
}

export type ViewDefinitionData = { definition: string; options: string | null }
export type ViewDefinitionError = ExecuteSqlError

export const useViewDefinitionQuery = <TData = ViewDefinitionData>(
  { projectRef, connectionString, id }: ViewDefinitionVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ViewDefinitionData, ViewDefinitionError, TData> = {}
) =>
  useQuery<ViewDefinitionData, ViewDefinitionError, TData>({
    queryKey: databaseKeys.viewDefinition(projectRef, id),
    queryFn: ({ signal }) => getViewDefinition({ projectRef, connectionString, id }, signal),
    enabled:
      enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
    ...options,
  })
