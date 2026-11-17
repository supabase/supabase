import { ident, safeSql } from '@supabase/pg-meta'
import { Query } from '@supabase/pg-meta/src/query'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import { RoleImpersonationState, wrapWithRoleImpersonation } from '@/lib/role-impersonation'
import { isRoleImpersonationEnabled } from '@/state/role-impersonation-state'
import type { UseCustomMutationOptions } from '@/types'

export type GetCellValueVariables = {
  projectRef: string
  connectionString?: string | null
  table: { schema: string; name: string }
  column: string
  pkMatch: { [key: string]: any }
  roleImpersonationState?: RoleImpersonationState
  /**
   * Return the value as text. For json/jsonb columns this keeps the exact JSON text, whereas the
   * default returns a parsed value that can lose number precision.
   */
  asText?: boolean
}

export function getCellValueSql({
  table,
  column,
  pkMatch,
  asText = false,
}: Pick<GetCellValueVariables, 'table' | 'column' | 'pkMatch' | 'asText'>) {
  return new Query()
    .from(table.name, table.schema ?? undefined)
    .select(asText ? safeSql`${ident(column)}::text as ${ident(column)}` : ident(column))
    .match(pkMatch)
    .toSql()
}

export async function getCellValue({
  projectRef,
  connectionString,
  table,
  column,
  pkMatch,
  roleImpersonationState,
  asText,
}: GetCellValueVariables) {
  const sql = wrapWithRoleImpersonation(
    getCellValueSql({ table, column, pkMatch, asText }),
    roleImpersonationState
  )
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sqlOrigin: 'studio',
    queryName: 'get-cell-value',
    sql,
    isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
    grant: unguarded.migrating,
  })
  return result?.[0][column]
}

type TableRowCreateData = Awaited<ReturnType<typeof getCellValue>>

export const useGetCellValueMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<TableRowCreateData, StudioError, GetCellValueVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<TableRowCreateData, StudioError, GetCellValueVariables>({
    mutationFn: (vars) => getCellValue(vars),
    async onSuccess(data, variables, context) {
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
