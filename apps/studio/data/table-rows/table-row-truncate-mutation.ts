import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Query } from 'components/grid/query/Query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { tableRowKeys } from './keys'

export type TableRowTruncateVariables = {
  projectRef: string
  connectionString?: string
  table: { id: number; name: string; schema?: string }
}

export function getTableRowTruncateSql({ table }: Pick<TableRowTruncateVariables, 'table'>) {
  let queryChains = new Query().from(table.name, table.schema ?? undefined).truncate()

  return queryChains.toSql()
}

export async function truncateTableRow({
  projectRef,
  connectionString,
  table,
}: TableRowTruncateVariables) {
  const sql = getTableRowTruncateSql({ table })

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
  })

  return result
}

type TableRowTruncateData = Awaited<ReturnType<typeof truncateTableRow>>

export const useTableRowTruncateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableRowTruncateData, ResponseError, TableRowTruncateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowTruncateData, ResponseError, TableRowTruncateVariables>(
    (vars) => truncateTableRow(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, table } = variables
        await queryClient.invalidateQueries(tableRowKeys.tableRowsAndCount(projectRef, table.id))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to truncate table row: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
