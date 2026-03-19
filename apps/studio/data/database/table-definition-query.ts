import { getTableDefinitionSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { UseCustomQueryOptions } from 'types'

import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'

type GetTableDefinitionArgs = {
  id?: number
}

export type TableDefinitionVariables = GetTableDefinitionArgs & {
  projectRef?: string
  connectionString?: string | null
}

export async function getTableDefinition(
  { projectRef, connectionString, id }: TableDefinitionVariables,
  signal?: AbortSignal
) {
  if (!id) throw new Error('id is required')

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
  }: UseCustomQueryOptions<TableDefinitionData, TableDefinitionError, TData> = {}
) =>
  useQuery<TableDefinitionData, TableDefinitionError, TData>({
    queryKey: databaseKeys.tableDefinition(projectRef, id),
    queryFn: ({ signal }) => getTableDefinition({ projectRef, connectionString, id }, signal),
    enabled:
      enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
    ...options,
  })
