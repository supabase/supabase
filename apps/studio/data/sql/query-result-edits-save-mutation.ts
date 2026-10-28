import { joinSqlFragments, safeSql } from '@supabase/pg-meta'
import { Query, wrapWithTransaction } from '@supabase/pg-meta/src/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import { executeSql } from './execute-sql-mutation'
import { tableRowKeys } from '@/data/table-rows/keys'
import { getCellEditUpdateStatements } from '@/data/table-rows/operation-queue-save-mutation'
import type { GrantFor } from '@/lib/grants'
import { getEditedRows, type EditedRow, type PendingCellEdit } from '@/lib/query-result-editing'
import { wrapWithRoleImpersonation, type RoleImpersonationState } from '@/lib/role-impersonation'
import { isRoleImpersonationEnabled } from '@/state/role-impersonation-state'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type QueryResultEditsSaveVariables = {
  projectRef: string
  connectionString?: string | null
  edits: readonly PendingCellEdit[]
  roleImpersonationState?: RoleImpersonationState
  grant: GrantFor<'post', '/platform/pg-meta/{ref}/query'>
}

const rowsSchema = z.array(z.record(z.unknown()))

/** Reads the edited rows of one table back, by the keys they have now that they're saved. */
async function readBackRows(
  { projectRef, connectionString, roleImpersonationState, grant }: QueryResultEditsSaveVariables,
  rows: readonly EditedRow[]
) {
  const { table } = rows[0]
  const keyColumns = Object.keys(rows[0].savedIdentifiers)
  const sql = new Query()
    .from(table.name, table.schema)
    .select(safeSql`*`)
    .filter(
      keyColumns,
      'in',
      rows.map(({ savedIdentifiers }) => keyColumns.map((column) => savedIdentifiers[column]))
    )
    .toSql()

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: wrapWithRoleImpersonation(sql, roleImpersonationState),
    isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
    queryKey: ['query-result-edits-read-back', table.id],
    grant,
  })
  const savedRows = rowsSchema.parse(result)

  return rows.flatMap((editedRow) => {
    const row = savedRows.find((candidate) =>
      keyColumns.every((column) => candidate[column] === editedRow.savedIdentifiers[column])
    )
    return row ? [{ ...editedRow, row }] : []
  })
}

/**
 * Writes every pending edit in one transaction, so a failure leaves the database as it was,
 * then reads the edited rows back. The read-back is what the result shows afterwards — the
 * stored values after casts, defaults, and triggers rather than what was typed — and a row
 * that doesn't come back (deleted meanwhile, or hidden from the role by RLS) can't be shown
 * as saved.
 */
async function saveQueryResultEdits(variables: QueryResultEditsSaveVariables) {
  const { projectRef, connectionString, edits, roleImpersonationState, grant } = variables
  if (edits.length === 0) return { savedRows: [], editedRows: [] }

  const statements = getCellEditUpdateStatements(edits)
  const sql = wrapWithTransaction(safeSql`${joinSqlFragments(statements, ';\n')};`)

  await executeSql({
    projectRef,
    connectionString,
    sql: wrapWithRoleImpersonation(sql, roleImpersonationState),
    isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
    queryKey: ['query-result-edits-save'],
    grant,
  })

  const editedRows = getEditedRows(edits)
  const rowsByTable = new Map<number, EditedRow[]>()
  for (const row of editedRows) {
    rowsByTable.set(row.table.id, [...(rowsByTable.get(row.table.id) ?? []), row])
  }
  const savedRows = (
    await Promise.all([...rowsByTable.values()].map((rows) => readBackRows(variables, rows)))
  ).flat()

  return { savedRows, editedRows }
}

export type QueryResultEditsSaveData = Awaited<ReturnType<typeof saveQueryResultEdits>>

export const useQueryResultEditsSaveMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<QueryResultEditsSaveData, ResponseError, QueryResultEditsSaveVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<QueryResultEditsSaveData, ResponseError, QueryResultEditsSaveVariables>({
    mutationFn: (variables) => saveQueryResultEdits(variables),
    async onSuccess(data, variables, context) {
      // The Table Editor may be showing the same rows.
      const tableIds = [...new Set(variables.edits.map(({ table }) => table.id))]
      await Promise.all(
        tableIds.map((tableId) =>
          queryClient.invalidateQueries({
            queryKey: tableRowKeys.tableRowsAndCount(variables.projectRef, tableId),
          })
        )
      )
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) toast.error(`Failed to save changes: ${error.message}`)
      else onError(error, variables, context)
    },
    ...options,
  })
}
