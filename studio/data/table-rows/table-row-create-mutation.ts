import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { Query, SupaTable } from 'components/grid'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'

export type TableRowCreateVariables = {
  projectRef: string
  connectionString?: string
  table: SupaTable
  payload: any
  enumArrayColumns: string[]
}

export function getTableRowCreateSql({
  table,
  payload,
  enumArrayColumns,
}: Pick<TableRowCreateVariables, 'table' | 'payload' | 'enumArrayColumns'>) {
  return new Query()
    .from(table.name, table.schema ?? undefined)
    .insert([payload], { returning: true, enumArrayColumns })
    .toSql()
}

export async function createTableRow({
  projectRef,
  connectionString,
  table,
  payload,
  enumArrayColumns,
}: TableRowCreateVariables) {
  const sql = getTableRowCreateSql({ table, payload, enumArrayColumns })

  const { result } = await executeSql({ projectRef, connectionString, sql })

  return result
}

type TableRowCreateData = Awaited<ReturnType<typeof createTableRow>>

export const useTableRowCreateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<TableRowCreateData, unknown, TableRowCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowCreateData, unknown, TableRowCreateVariables>(
    (vars) => createTableRow(vars),
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
