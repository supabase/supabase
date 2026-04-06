import { getForeignKeyConstraintsSql } from '@supabase/pg-meta'
import { QueryClient, useQuery } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'

import { databaseKeys } from './keys'
import { useConnectionStringForReadOps } from '@/data/read-replicas/replicas-query'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

type GetForeignKeyConstraintsVariables = {
  schema?: string
}

export type ForeignKeyConstraintRaw = {
  id: number
  constraint_name: string
  deletion_action: string
  update_action: string
  source_id: string
  source_schema: string
  source_table: string
  source_columns: string
  target_id: string
  target_schema: string
  target_table: string
  target_columns: string
}

export type ForeignKeyConstraint = {
  id: number
  constraint_name: string
  deletion_action: string
  update_action: string
  source_id: number
  source_schema: string
  source_table: string
  source_columns: string[]
  target_id: number
  target_schema: string
  target_table: string
  target_columns: string[]
}

export type ForeignKeyConstraintsVariables = GetForeignKeyConstraintsVariables & {
  projectRef?: string
  connectionString?: string | null
}

export async function getForeignKeyConstraints(
  { projectRef, connectionString, schema }: ForeignKeyConstraintsVariables,
  signal?: AbortSignal
) {
  if (!schema) throw new Error('Schema is required')

  const sql = getForeignKeyConstraintsSql({ schema })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['foreign-key-constraints', schema],
    },
    signal
  )

  return (result ?? []).map((foreignKey: ForeignKeyConstraintRaw) => {
    return {
      ...foreignKey,
      source_columns: foreignKey.source_columns.replace('{', '').replace('}', '').split(','),
      target_columns: foreignKey.target_columns.replace('{', '').replace('}', '').split(','),
    }
  }) as ForeignKeyConstraint[]
}

export type ForeignKeyConstraintsData = Awaited<ReturnType<typeof getForeignKeyConstraints>>
export type ForeignKeyConstraintsError = ExecuteSqlError

export const useForeignKeyConstraintsQuery = <TData = ForeignKeyConstraintsData>(
  {
    projectRef,
    connectionString: connectionStringOverride,
    schema,
  }: ForeignKeyConstraintsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ForeignKeyConstraintsData, ForeignKeyConstraintsError, TData> = {}
) => {
  const { connectionString: connectionStringReadOps } = useConnectionStringForReadOps()
  const connectionString = connectionStringOverride || connectionStringReadOps

  return useQuery<ForeignKeyConstraintsData, ForeignKeyConstraintsError, TData>({
    queryKey: databaseKeys.foreignKeyConstraints(projectRef, schema, { connectionString }),
    queryFn: ({ signal }) =>
      getForeignKeyConstraints({ projectRef, connectionString, schema }, signal),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof schema !== 'undefined' &&
      (!IS_PLATFORM || typeof connectionString !== 'undefined') &&
      schema.length > 0,
    ...options,
  })
}

export function prefetchForeignKeyConstraints(
  client: QueryClient,
  { projectRef, connectionString, schema }: ForeignKeyConstraintsVariables
) {
  return client.fetchQuery({
    queryKey: databaseKeys.foreignKeyConstraints(projectRef, schema),
    queryFn: ({ signal }) =>
      getForeignKeyConstraints({ projectRef, connectionString, schema }, signal),
  })
}
