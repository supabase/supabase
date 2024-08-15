import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { Query } from 'components/grid/query/Query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, VaultSecret } from 'types'
import { vaultSecretsKeys } from './keys'
import { sqlKeys } from 'data/sql/keys'

export type VaultSecretUpdateVariables = {
  projectRef: string
  connectionString?: string
  id: string
} & Partial<VaultSecret>

export async function updateVaultSecret({
  projectRef,
  connectionString,
  id,
  ...payload
}: VaultSecretUpdateVariables) {
  const sql = new Query()
    .from('decrypted_secrets', 'vault')
    .update({ ...payload, updated_at: new Date().toISOString() }, { returning: true })
    .match({ id })
    .toSql()

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
          queryClient.invalidateQueries(
            sqlKeys.query(projectRef, vaultSecretsKeys.list(projectRef))
          ),
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
