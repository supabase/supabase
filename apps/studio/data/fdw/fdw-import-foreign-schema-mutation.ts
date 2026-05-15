import { getImportForeignSchemaSql, type SafeSqlFragment } from '@supabase/pg-meta'
import { wrapWithTransaction } from '@supabase/pg-meta/src/query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fdwKeys } from './keys'
import { entityTypeKeys } from '@/data/entity-types/keys'
import { foreignTableKeys } from '@/data/foreign-tables/keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import { vaultSecretsKeys } from '@/data/vault/keys'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type FDWImportForeignSchemaVariables = {
  projectRef?: string
  connectionString?: string | null
  serverName: string
  sourceSchema: string
  targetSchema: string
  schemaOptions?: SafeSqlFragment[]
}

export async function importForeignSchema({
  projectRef,
  connectionString,
  ...rest
}: FDWImportForeignSchemaVariables) {
  const sql = wrapWithTransaction(getImportForeignSchemaSql(rest))
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type ImportForeignSchemaData = Awaited<ReturnType<typeof importForeignSchema>>

export const useFDWImportForeignSchemaMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<ImportForeignSchemaData, ResponseError, FDWImportForeignSchemaVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ImportForeignSchemaData, ResponseError, FDWImportForeignSchemaVariables>({
    mutationFn: (vars) => importForeignSchema(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: fdwKeys.list(projectRef), refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: entityTypeKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: foreignTableKeys.list(projectRef) }),
        queryClient.invalidateQueries({ queryKey: vaultSecretsKeys.list(projectRef) }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to import schema for foreign data wrapper: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
