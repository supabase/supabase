import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { Query, SupaRow, SupaTable } from 'components/grid'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import { ResponseError } from 'types'
import { getPrimaryKeys } from './utils'
import { Table } from 'data/tables/table-query'

export type TableRowDeleteVariables = {
  projectRef: string
  connectionString?: string
  table: Table
  rows: SupaRow[]
}

export function getTableRowDeleteSql({
  table,
  rows,
}: Pick<TableRowDeleteVariables, 'table' | 'rows'>) {
  const { primaryKeys, error } = getPrimaryKeys({ table })
  if (error) throw error

  let queryChains = new Query().from(table.name, table.schema ?? undefined).delete()
  primaryKeys!.forEach((key) => {
    const primaryKeyValues = rows.map((x) => x[key])
    queryChains = queryChains.filter(key, 'in', primaryKeyValues)
  })

  return queryChains.toSql()
}

export async function deleteTableRow({
  projectRef,
  connectionString,
  table,
  rows,
}: TableRowDeleteVariables) {
  const sql = getTableRowDeleteSql({ table, rows })

  const { result } = await executeSql({ projectRef, connectionString, sql })

  return result
}

type TableRowDeleteData = Awaited<ReturnType<typeof deleteTableRow>>

export const useTableRowDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableRowDeleteData, ResponseError, TableRowDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowDeleteData, ResponseError, TableRowDeleteVariables>(
    (vars) => deleteTableRow(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, table } = variables
        await queryClient.invalidateQueries(sqlKeys.query(projectRef, [table.schema, table.name]))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete table row: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
