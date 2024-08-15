import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { Query } from 'components/grid/query/Query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, VaultSecret } from 'types'
import { vaultSecretsKeys } from './keys'
import { sqlKeys } from 'data/sql/keys'

export type VaultSecretCreateVariables = {
  projectRef: string
  connectionString?: string
} & Partial<VaultSecret>

export async function createVaultSecret({
  projectRef,
  connectionString,
  ...newSecret
}: VaultSecretCreateVariables) {
  const { name, description, secret, key_id } = newSecret
  const sql = new Query()
    .from('secrets', 'vault')
    .insert([{ name, description, secret, key_id }], { returning: true })
    .toSql()

  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type VaultSecretCreateData = Awaited<ReturnType<typeof createVaultSecret>>

export const useVaultSecretCreateMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<VaultSecretCreateData, ResponseError, VaultSecretCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<VaultSecretCreateData, ResponseError, VaultSecretCreateVariables>(
    (vars) => createVaultSecret(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(
          sqlKeys.query(projectRef, vaultSecretsKeys.list(projectRef))
        )
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
    }
  )
}
