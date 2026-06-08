import { getTableConstraintsSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

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

export type TableConstraintsVariables = GetTableConstraintsVariables & {
  projectRef?: string
  connectionString?: string | null
}

export type TableConstraintsData = Constraint[]
export type TableConstraintsError = ExecuteSqlError

export async function getTableConstraints(
  { projectRef, connectionString, id }: TableConstraintsVariables,
  signal?: AbortSignal
) {
  if (!id) throw new Error('Table ID is required')

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
  }: UseCustomQueryOptions<TableConstraintsData, TableConstraintsError, TData> = {}
) =>
  useQuery<TableConstraintsData, TableConstraintsError, TData>({
    queryKey: databaseKeys.tableConstraints(projectRef, id),
    queryFn: ({ signal }) => getTableConstraints({ projectRef, connectionString, id }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
    ...options,
  })
