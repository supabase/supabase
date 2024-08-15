import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { Query } from 'components/grid/query/Query'
import type { SupaTable } from 'components/grid/types'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import type { ResponseError } from 'types'

export type TableRowTruncateVariables = {
  projectRef: string
  connectionString?: string
  table: SupaTable
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
        await queryClient.invalidateQueries(sqlKeys.query(projectRef, [table.schema, table.name]))
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
