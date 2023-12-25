import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'

import { Query } from 'components/grid/query/Query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError, VaultSecret } from 'types'
import { vaultSecretsKeys } from './keys'

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
        await queryClient.invalidateQueries(vaultSecretsKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
