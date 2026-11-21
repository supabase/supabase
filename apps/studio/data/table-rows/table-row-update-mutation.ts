import { readColumnFormats, type ColumnFormat } from '@supabase/pg-meta'
import { Query } from '@supabase/pg-meta/src/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { tableRowKeys } from './keys'
import { isUserFaultForValues } from '@/data/error-classification'
import { unguarded } from '@/data/fetchers'
import { catalogFallbackQuery, withSparkFallback } from '@/data/sql/catalog-fallback-query'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import { RoleImpersonationState, wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { isRoleImpersonationEnabled } from '@/state/role-impersonation-state'
import type { UseCustomMutationOptions } from '@/types'

export type TableRowUpdateVariables = {
  projectRef: string
  connectionString?: string | null
  table: { id: number; name: string; schema?: string }
  configuration: { identifiers: any }
  payload: any
  enumArrayColumns: string[]
  returning?: boolean
  roleImpersonationState?: RoleImpersonationState
}

export function getTableRowUpdateSql({
  table,
  configuration,
  payload,
  returning = false,
  enumArrayColumns,
  columnFormats,
}: Pick<
  TableRowUpdateVariables,
  'table' | 'payload' | 'configuration' | 'enumArrayColumns' | 'returning'
> & {
  /** TEMPORARY: writes literal values where `json_populate_record` is missing (Spark). */
  columnFormats?: ColumnFormat[]
}) {
  return new Query()
    .from(table.name, table.schema ?? undefined)
    .update(payload, { returning, enumArrayColumns, columnFormats })
    .match(configuration.identifiers)
    .toSql()
}

export async function updateTableRow({
  projectRef,
  connectionString,
  table,
  payload,
  configuration,
  enumArrayColumns,
  returning,
  roleImpersonationState,
}: TableRowUpdateVariables) {
  const grant = unguarded.migrating
  const write = async (columnFormats?: ColumnFormat[]) => {
    const sql = wrapWithRoleImpersonation(
      getTableRowUpdateSql({
        table,
        configuration,
        payload,
        enumArrayColumns,
        returning,
        columnFormats,
      }),
      roleImpersonationState
    )
    const { result } = await executeSql({
      projectRef,
      connectionString,
      sqlOrigin: 'studio',
      queryName: 'table-row-update',
      isUserFaultSqlState: isUserFaultForValues,
      sql,
      isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
      queryKey: ['table-row-update', table.id],
      grant,
    })
    return result
  }

  return withSparkFallback(
    projectRef,
    () => write(),
    async () =>
      write(
        await readColumnFormats(
          catalogFallbackQuery({
            projectRef,
            connectionString,
            queryName: 'table-row-update',
            grant,
          }),
          table.id
        )
      )
  )
}

type TableRowUpdateData = Awaited<ReturnType<typeof updateTableRow>>

export const useTableRowUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<TableRowUpdateData, StudioError, TableRowUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowUpdateData, StudioError, TableRowUpdateVariables>({
    mutationFn: (vars) => updateTableRow(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, table } = variables
      await queryClient.invalidateQueries({
        queryKey: tableRowKeys.tableRows(projectRef, { table: { id: table.id } }),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update table row: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
