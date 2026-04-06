import { getViewDefinitionSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

type GetViewDefinitionArgs = {
  id?: number
}

export type ViewDefinitionVariables = GetViewDefinitionArgs & {
  projectRef?: string
  connectionString?: string | null
}

export async function getViewDefinition(
  { projectRef, connectionString, id }: ViewDefinitionVariables,
  signal?: AbortSignal
) {
  if (!id) throw new Error('View ID is required')

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
  }: UseCustomQueryOptions<ViewDefinitionData, ViewDefinitionError, TData> = {}
) =>
  useQuery<ViewDefinitionData, ViewDefinitionError, TData>({
    queryKey: databaseKeys.viewDefinition(projectRef, id),
    queryFn: ({ signal }) => getViewDefinition({ projectRef, connectionString, id }, signal),
    enabled:
      enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
    ...options,
  })
