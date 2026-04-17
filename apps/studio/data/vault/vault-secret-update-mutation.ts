import { getUpdateVaultSecretSQL } from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { vaultSecretsKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions, VaultSecret } from '@/types'

export type VaultSecretUpdateVariables = {
  projectRef: string
  connectionString?: string | null
  id: string
} & Partial<VaultSecret>

export async function updateVaultSecret({
  projectRef,
  connectionString,
  id,
  ...payload
}: VaultSecretUpdateVariables) {
  const { name, description, secret } = payload
  const sql = getUpdateVaultSecretSQL({ id, secret, name, description })

  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type VaultSecretUpdateData = Awaited<ReturnType<typeof updateVaultSecret>>

export const useVaultSecretUpdateMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<VaultSecretUpdateData, ResponseError, VaultSecretUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<VaultSecretUpdateData, ResponseError, VaultSecretUpdateVariables>({
    mutationFn: (vars) => updateVaultSecret(vars),
    async onSuccess(data, variables, context) {
      const { id, projectRef } = variables
      await Promise.all([
        queryClient.removeQueries({ queryKey: vaultSecretsKeys.getDecryptedValue(projectRef, id) }),
        queryClient.invalidateQueries({ queryKey: vaultSecretsKeys.list(projectRef) }),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update key: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
