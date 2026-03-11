import { useMutation, useQueryClient } from '@tanstack/react-query'
import { entityTypeKeys } from 'data/entity-types/keys'
import { foreignTableKeys } from 'data/foreign-tables/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import { vaultSecretsKeys } from 'data/vault/keys'
import { toast } from 'sonner'
import type { ResponseError, UseCustomMutationOptions } from 'types'

import { fdwKeys } from './keys'

export type FDWImportForeignSchemaVariables = {
  projectRef?: string
  connectionString?: string | null
  serverName: string
  sourceSchema: string
  targetSchema: string
  schemaOptions?: string[]
}

export function getImportForeignSchemaSql({
  serverName,
  sourceSchema,
  targetSchema,
  schemaOptions = [],
}: Omit<FDWImportForeignSchemaVariables, 'projectRef' | 'connectionString'>) {
  const options = [...schemaOptions, "strict 'true'"].join(', ')

  const sql = /* SQL */ `
  import foreign schema "${sourceSchema}" from server ${serverName} into ${targetSchema} options (${options});
`

  return sql
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
