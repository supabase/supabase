import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Query } from '@supabase/pg-meta/src/query'
import { executeSql } from 'data/sql/execute-sql-query'
import { RoleImpersonationState, wrapWithRoleImpersonation } from 'lib/role-impersonation'
import { isRoleImpersonationEnabled } from 'state/role-impersonation-state'
import type { ResponseError } from 'types'
import { tableRowKeys } from './keys'

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
}: Pick<TableRowCreateVariables, 'table' | 'payload' | 'enumArrayColumns' | 'returning'>) {
  // Always use custom SQL generation to ensure proper quoting
  const quotedSchema = table.schema ? `"${table.schema}"` : undefined
  const quotedTable = `"${table.name}"`

  const columns = Object.keys(payload)
  const values = Object.values(payload)

  // Handle enum array columns - convert them to proper PostgreSQL array format
  const processedValues = values.map((val, index) => {
    const columnName = columns[index]
    if (enumArrayColumns.includes(columnName) && Array.isArray(val)) {
      // Convert array to PostgreSQL array format
      return `ARRAY[${val.map((v) => `'${v}'`).join(', ')}]`
    }
    return val === null ? 'NULL' : typeof val === 'string' ? `'${val.replace(/'/g, "''")}'` : val
  })

  const quotedColumns = columns.map((col) => `"${col}"`).join(', ')
  const quotedValues = processedValues.join(', ')

  const returningClause = returning ? ' RETURNING *' : ''
  const tableRef = quotedSchema ? `${quotedSchema}.${quotedTable}` : quotedTable

  return `INSERT INTO ${tableRef} (${quotedColumns}) VALUES (${quotedValues})${returningClause};`
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
  const sql = wrapWithRoleImpersonation(
    getTableRowCreateSql({ table, payload, enumArrayColumns, returning }),
    roleImpersonationState
  )

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    isRoleImpersonationEnabled: isRoleImpersonationEnabled(roleImpersonationState?.role),
  })

  return result
}

type TableRowCreateData = Awaited<ReturnType<typeof createTableRow>>

export const useTableRowCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableRowCreateData, ResponseError, TableRowCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowCreateData, ResponseError, TableRowCreateVariables>(
    (vars) => createTableRow(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, table } = variables
        await queryClient.invalidateQueries(tableRowKeys.tableRowsAndCount(projectRef, table.id))
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
    }
  )
}
