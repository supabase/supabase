import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import { quoteLiteral } from 'lib/pg-format'
import type { ResponseError, VaultSecret } from 'types'
import { vaultSecretsKeys } from './keys'

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
  const sql = /* SQL */ `
select vault.update_secret(
    secret_id := ${quoteLiteral(id)}
  ${secret ? `, new_secret := ${quoteLiteral(secret)}` : ''}
  ${name ? `, new_name := ${quoteLiteral(name)}` : ''}
  ${description ? `, new_description := ${quoteLiteral(description)}` : ''}
)
`

  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type VaultSecretUpdateData = Awaited<ReturnType<typeof updateVaultSecret>>

export const useVaultSecretUpdateMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<VaultSecretUpdateData, ResponseError, VaultSecretUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<VaultSecretUpdateData, ResponseError, VaultSecretUpdateVariables>(
    (vars) => updateVaultSecret(vars),
    {
      async onSuccess(data, variables, context) {
        const { id, projectRef } = variables
        await Promise.all([
          queryClient.removeQueries(vaultSecretsKeys.getDecryptedValue(projectRef, id)),
          queryClient.invalidateQueries(vaultSecretsKeys.list(projectRef)),
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
    }
  )
}
