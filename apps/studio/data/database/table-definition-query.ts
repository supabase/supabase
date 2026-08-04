import { getTableDefinitionSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'

import { databaseKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import { PG_META_SCOPED_INTROSPECTION_FLAG } from '@/data/table-editor/table-editor-query'
import { ResponseError, UseCustomQueryOptions } from '@/types'

type GetTableDefinitionArgs = {
  id?: number
  scoped?: boolean
}

export type TableDefinitionVariables = GetTableDefinitionArgs & {
  projectRef?: string
  connectionString?: string | null
}

export async function getTableDefinition(
  { projectRef, connectionString, id, scoped }: TableDefinitionVariables,
  signal?: AbortSignal
) {
  if (!id) throw new Error('id is required')

  const sql = getTableDefinitionSql({ id, scoped })
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
export type TableDefinitionError = ResponseError

export const useTableDefinitionQuery = <TData = TableDefinitionData>(
  { projectRef, connectionString, id }: TableDefinitionVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<TableDefinitionData, TableDefinitionError, TData> = {}
) => {
  const scoped = !!useFlag(PG_META_SCOPED_INTROSPECTION_FLAG)

  return useQuery<TableDefinitionData, TableDefinitionError, TData>({
    queryKey: [...databaseKeys.tableDefinition(projectRef, id), { scoped }],
    queryFn: ({ signal }) =>
      getTableDefinition({ projectRef, connectionString, id, scoped }, signal),
    enabled:
      enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
    ...options,
  })
}
