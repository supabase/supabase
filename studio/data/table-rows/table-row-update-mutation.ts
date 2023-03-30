import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { Query, SupaTable } from 'components/grid'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'

export type TableRowUpdateVariables = {
  projectRef: string
  connectionString?: string
  table: SupaTable
  configuration: { identifiers: any }
  payload: any
  enumArrayColumns: string[]
}

export function getTableRowUpdateSql({
  table,
  configuration,
  payload,
  enumArrayColumns,
}: Pick<TableRowUpdateVariables, 'table' | 'payload' | 'configuration' | 'enumArrayColumns'>) {
  return new Query()
    .from(table.name, table.schema ?? undefined)
    .update(payload, { returning: true, enumArrayColumns })
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
}: TableRowUpdateVariables) {
  const sql = getTableRowUpdateSql({ table, configuration, payload, enumArrayColumns })

  const { result } = await executeSql({ projectRef, connectionString, sql })

  return result
}

type TableRowUpdateData = Awaited<ReturnType<typeof updateTableRow>>

export const useTableRowUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<TableRowUpdateData, unknown, TableRowUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowUpdateData, unknown, TableRowUpdateVariables>(
    (vars) => updateTableRow(vars),
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
