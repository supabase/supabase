import { getCreateVaultSecretSQL } from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { vaultSecretsKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions, VaultSecret } from '@/types'

export type VaultSecretCreateVariables = {
  projectRef: string
  connectionString?: string | null
} & Partial<VaultSecret>

export async function createVaultSecret({
  projectRef,
  connectionString,
  ...newSecret
}: VaultSecretCreateVariables) {
  const { name, description, secret } = newSecret

  if (!secret) throw new Error('Secret value is required')
  const sql = getCreateVaultSecretSQL({ secret, name, description })

  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type VaultSecretCreateData = Awaited<ReturnType<typeof createVaultSecret>>

export const useVaultSecretCreateMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseCustomMutationOptions<VaultSecretCreateData, ResponseError, VaultSecretCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<VaultSecretCreateData, ResponseError, VaultSecretCreateVariables>({
    mutationFn: (vars) => createVaultSecret(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await queryClient.invalidateQueries({ queryKey: vaultSecretsKeys.list(projectRef) })
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to create secret: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
