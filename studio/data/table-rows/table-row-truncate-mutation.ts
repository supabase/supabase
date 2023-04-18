import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { Query, SupaTable } from 'components/grid'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'

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

  const { result } = await executeSql({ projectRef, connectionString, sql })

  return result
}

type TableRowTruncateData = Awaited<ReturnType<typeof truncateTableRow>>

export const useTableRowTruncateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<TableRowTruncateData, unknown, TableRowTruncateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowTruncateData, unknown, TableRowTruncateVariables>(
    (vars) => truncateTableRow(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef, table } = variables

        await queryClient.invalidateQueries(sqlKeys.query(projectRef, [table.schema, table.name]))

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
