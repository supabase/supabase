import { ident, joinSqlFragments, literal, safeSql } from '@supabase/pg-meta'
import { Query } from '@supabase/pg-meta/src/query'
import { queryOptions, useQuery } from '@tanstack/react-query'

import { tableRowKeys } from './keys'
import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import { RoleImpersonationState, wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { isRoleImpersonationEnabled } from '@/state/role-impersonation-state'
import type { UseCustomQueryOptions } from '@/types'

/**
 * Values larger than this are not fetched, and come back as `null`. Bounds how much data a single
 * row can pull into the browser, and how large a value the form has to render.
 */
export const MAX_ROW_LARGE_VALUE_BYTES = 1024 * 1024

export type RowLargeValuesVariables = {
  projectRef?: string
  connectionString?: string | null
  table: { schema: string; name: string }
  /** The columns whose values the grid truncated */
  columns: string[]
  /** Primary key column names mapped to the selected row's values */
  pkMatch: Record<string, unknown>
  roleImpersonationState?: RoleImpersonationState
}

export function getRowLargeValuesSql({
  table,
  columns,
  pkMatch,
  maxBytes = MAX_ROW_LARGE_VALUE_BYTES,
}: Pick<RowLargeValuesVariables, 'table' | 'columns' | 'pkMatch'> & { maxBytes?: number }) {
  // A column over the limit is returned as NULL instead of being sent. A truncated value is never
  // NULL, so NULL means "too large" (or changed since the grid loaded).
  const selectColumns = joinSqlFragments(
    columns.map((column) => {
      const col = ident(column)
      return safeSql`case when octet_length(${col}::text) > ${literal(maxBytes)} then null else ${col} end as ${col}`
    }),
    ', '
  )

  return new Query()
    .from(table.name, table.schema ?? undefined)
    .select(selectColumns)
    .match(pkMatch)
    .toSql()
}

export async function getRowLargeValues(
  {
    projectRef,
    connectionString,
    table,
    columns,
    pkMatch,
    roleImpersonationState,
  }: RowLargeValuesVariables,
  signal?: AbortSignal
) {
  if (columns.length === 0) throw new Error('columns are required')
  if (Object.keys(pkMatch).length === 0) throw new Error('pkMatch is required')

  const sql = wrapWithRoleImpersonation(
    getRowLargeValuesSql({ table, columns, pkMatch }),
    roleImpersonationState
  )
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
      grant: unguarded.migrating,
    },
    signal
  )

  const row = result?.[0] as Record<string, unknown> | undefined
  if (row === undefined) throw new Error('Row not found')
  return row
}

export type RowLargeValuesData = Awaited<ReturnType<typeof getRowLargeValues>>
export type RowLargeValuesError = StudioError

export const rowLargeValuesQueryOptions = (vars: RowLargeValuesVariables) =>
  queryOptions<RowLargeValuesData, RowLargeValuesError>({
    queryKey: tableRowKeys.rowLargeValues(vars.projectRef, vars),
    queryFn: ({ signal }) => getRowLargeValues(vars, signal),
    // The values can be megabytes, so don't keep them around or retry a failed fetch
    gcTime: 0,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  })

export const useRowLargeValuesQuery = (
  vars: RowLargeValuesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<RowLargeValuesData, RowLargeValuesError> = {}
) =>
  useQuery({
    ...rowLargeValuesQueryOptions(vars),
    enabled: enabled && typeof vars.projectRef !== 'undefined' && vars.columns.length > 0,
    ...options,
  })
