import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { entityTypeKeys } from 'data/entity-types/keys'
import { foreignTableKeys } from 'data/foreign-tables/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { fdwKeys } from './keys'

export type FDWDropForeignTableVariables = {
  projectRef?: string
  connectionString?: string | null
  schemaName: string
  tableName: string
}

export function getDropForeignTableSql({
  schemaName,
  tableName,
}: Omit<FDWDropForeignTableVariables, 'projectRef' | 'connectionString'>) {
  const sql = /* SQL */ `
drop foreign table if exists "${schemaName}"."${tableName}";
`

  return sql
}

export async function dropForeignTable({
  projectRef,
  connectionString,
  ...rest
}: FDWDropForeignTableVariables) {
  const sql = wrapWithTransaction(getDropForeignTableSql(rest))
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type DropForeignTableData = Awaited<ReturnType<typeof dropForeignTable>>

export const useFDWDropForeignTableMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<DropForeignTableData, ResponseError, FDWDropForeignTableVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DropForeignTableData, ResponseError, FDWDropForeignTableVariables>({
    mutationFn: (vars) => dropForeignTable(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: fdwKeys.list(projectRef), refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: entityTypeKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: foreignTableKeys.list(projectRef) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to drop foreign table for foreign data wrapper: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
