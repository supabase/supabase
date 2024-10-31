import type {
  PostgresColumn,
  PostgresMaterializedView,
  PostgresTable,
  PostgresView,
} from '@supabase/postgres-meta'
import { QueryClient, UseQueryOptions } from '@tanstack/react-query'

import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { sqlKeys } from 'data/sql/keys'
import {
  executeSql,
  ExecuteSqlData,
  ExecuteSqlError,
  useExecuteSqlQuery,
} from '../sql/execute-sql-query'
import { getTableEditorSql } from './table-editor-query-sql'

type TableEditorArgs = {
  id?: number
}
export type Table = PostgresTable
export type View = PostgresView
export type MaterializedView = PostgresMaterializedView
export type ForeignTable = PostgresTable
export type TableLike = Table | View | MaterializedView | ForeignTable

export type Entity = {
  id: number
  schema: string
  name: string
  type: ENTITY_TYPE
  comment: string | null
  rls_enabled: boolean
}

export type TableEditor = {
  entity: Entity
  // [Joshen] We can probably deprecate this one since we're deprecating pg sodium and TCE
  // https://supabase.com/docs/guides/database/extensions/pgsodium#encryption-key-location
  encrypted_columns: string[] | null
  table_info: Table | null
  view_info: View | null
  materialized_view_info: MaterializedView | null
  foreign_table_info: ForeignTable | null
  column_info: PostgresColumn[]
}

export type TableEditorVariables = TableEditorArgs & {
  projectRef?: string
  connectionString?: string
}

export type TableEditorData = TableEditor
export type TableEditorError = ExecuteSqlError

export const useTableEditorQuery = <TData extends TableEditorData = TableEditorData>(
  { projectRef, connectionString, id }: TableEditorVariables,
  { enabled = true, ...options }: UseQueryOptions<ExecuteSqlData, TableEditorError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getTableEditorSql(id),
      queryKey: ['table-editor', id],
    },
    {
      select(data) {
        return (data.result[0] ?? null) as TData
      },
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options,
    }
  )

export function getTableLikeFromTableEditor(data?: TableEditor): TableLike | undefined {
  // 404
  if (!data || !data.entity) return undefined

  const { entity, table_info, view_info, materialized_view_info, foreign_table_info, column_info } =
    data

  switch (entity.type) {
    case ENTITY_TYPE.TABLE:
    case ENTITY_TYPE.PARTITIONED_TABLE:
      return {
        ...table_info,
        columns: column_info,
      } as Table
    case ENTITY_TYPE.VIEW:
      return {
        ...view_info,
        columns: column_info,
      } as View
    case ENTITY_TYPE.MATERIALIZED_VIEW:
      return {
        ...materialized_view_info,
        columns: column_info,
      } as MaterializedView
    case ENTITY_TYPE.FOREIGN_TABLE:
      return {
        ...foreign_table_info,
        columns: column_info,
      } as ForeignTable
    default:
      return undefined
  }
}

export function prefetchTableEditor(
  client: QueryClient,
  { projectRef, connectionString, id }: Required<TableEditorVariables>
) {
  return client
    .fetchQuery(sqlKeys.query(projectRef, ['table-editor', id]), ({ signal }) =>
      executeSql(
        {
          projectRef,
          connectionString,
          sql: getTableEditorSql(id),
          queryKey: ['table-editor', id],
        },
        signal
      )
    )
    .then((data) => (data?.result?.[0] as unknown as TableEditor) ?? null)
}
