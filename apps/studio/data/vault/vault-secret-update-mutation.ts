import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'

import { Query } from 'components/grid/query/Query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError, VaultSecret } from 'types'
import { vaultSecretsKeys } from './keys'

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
        const { projectRef } = variables
        await queryClient.invalidateQueries(vaultSecretsKeys.list(projectRef))
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
