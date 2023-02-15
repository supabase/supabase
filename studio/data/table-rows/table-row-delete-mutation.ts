import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { Query, ServiceError, SupaRow, SupaTable } from 'components/grid'
import { ERROR_PRIMARY_KEY_NOTFOUND } from 'components/grid/constants'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'

export type TableRowDeleteVariables = {
  projectRef: string
  connectionString?: string
  table: SupaTable
  rows: SupaRow[]
}

export function getTableRowDeleteSql({
  table,
  rows,
}: Pick<TableRowDeleteVariables, 'table' | 'rows'>) {
  const { primaryKeys, error } = getPrimaryKeys({ table })
  if (error) {
    throw error
  }

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
  ...options
}: Omit<
  UseMutationOptions<TableRowDeleteData, unknown, TableRowDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableRowDeleteData, unknown, TableRowDeleteVariables>(
    (vars) => deleteTableRow(vars),
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

function getPrimaryKeys({ table }: { table: SupaTable }): {
  primaryKeys?: string[]
  error?: ServiceError
} {
  const pkColumns = table.columns.filter((x) => x.isPrimaryKey)
  if (!pkColumns || pkColumns.length == 0) {
    return { error: { message: ERROR_PRIMARY_KEY_NOTFOUND } }
  }
  return { primaryKeys: pkColumns.map((x) => x.name) }
}
