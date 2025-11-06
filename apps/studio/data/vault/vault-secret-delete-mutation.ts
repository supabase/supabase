import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Query } from '@supabase/pg-meta/src/query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import { vaultSecretsKeys } from './keys'

export type VaultSecretDeleteVariables = {
  projectRef: string
  connectionString?: string | null
  id: string
}

export async function deleteVaultSecret({
  projectRef,
  connectionString,
  id,
}: VaultSecretDeleteVariables) {
  const sql = new Query().from('secrets', 'vault').delete().match({ id }).toSql()
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type VaultSecretDeleteData = Awaited<ReturnType<typeof deleteVaultSecret>>

export const useVaultSecretDeleteMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<VaultSecretDeleteData, ResponseError, VaultSecretDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<VaultSecretDeleteData, ResponseError, VaultSecretDeleteVariables>({
    mutationFn: (vars) => deleteVaultSecret(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: vaultSecretsKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete key: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
