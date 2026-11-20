import {
  isPopulateRecordGap,
  readColumnFormats,
  withCatalogFallback,
  type ColumnFormat,
} from '@supabase/pg-meta'
import { Query } from '@supabase/pg-meta/src/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { tableRowKeys } from './keys'
import { isUserFaultForValues } from '@/data/error-classification'
import { unguarded } from '@/data/fetchers'
import { catalogFallbackQuery } from '@/data/sql/catalog-fallback-query'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import { RoleImpersonationState, wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { useTrack } from '@/lib/telemetry/track'
import { isRoleImpersonationEnabled } from '@/state/role-impersonation-state'
import type { UseCustomMutationOptions } from '@/types'

export type TableRowCreateVariables = {
  projectRef: string
  connectionString?: string | null
  table: { id: number; name: string; schema?: string }
  payload: any
  enumArrayColumns: string[]
  returning?: boolean
  roleImpersonationState?: RoleImpersonationState
}

export function getTableRowCreateSql({
  table,
  payload,
  returning = false,
  enumArrayColumns,
  columnFormats,
}: Pick<TableRowCreateVariables, 'table' | 'payload' | 'enumArrayColumns' | 'returning'> & {
  /** TEMPORARY: writes literal values where `jsonb_populate_recordset` is missing (Spark). */
  columnFormats?: ColumnFormat[]
}) {
  return new Query()
    .from(table.name, table.schema ?? undefined)
    .insert([payload], { returning, enumArrayColumns, columnFormats })
    .toSql()
}

export async function createTableRow({
  projectRef,
  connectionString,
  table,
  payload,
  enumArrayColumns,
  returning,
  roleImpersonationState,
}: TableRowCreateVariables) {
  const grant = unguarded.migrating
  const write = async (columnFormats?: ColumnFormat[]) => {
    const sql = wrapWithRoleImpersonation(
      getTableRowCreateSql({ table, payload, enumArrayColumns, returning, columnFormats }),
      roleImpersonationState
    )
    const { result } = await executeSql({
      projectRef,
      connectionString,
      sqlOrigin: 'studio',
      queryName: 'table-row-create',
      isUserFaultSqlState: isUserFaultForValues,
      sql,
      isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
      grant,
    })
    return result
  }

  return withCatalogFallback(
    () => write(),
    async () =>
      write(
        await readColumnFormats(
          catalogFallbackQuery({
            projectRef,
            connectionString,
            queryName: 'table-row-create',
            grant,
          }),
          table.id
        )
      ),
    isPopulateRecordGap
  )
}

type TableRowCreateData = Awaited<ReturnType<typeof createTableRow>>

export const useTableRowCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<TableRowCreateData, StudioError, TableRowCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const track = useTrack()

  return useMutation<TableRowCreateData, StudioError, TableRowCreateVariables>({
    mutationFn: (vars) => createTableRow(vars),
    async onSuccess(data, variables, context) {
      const { projectRef, table } = variables

      track(
        'table_data_added',
        {
          method: 'table_editor',
          schema_name: table.schema,
          table_name: table.name,
        },
        { project: projectRef }
      )

      await queryClient.invalidateQueries({
        queryKey: tableRowKeys.tableRowsAndCount(projectRef, table.id),
      })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(data.message)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
