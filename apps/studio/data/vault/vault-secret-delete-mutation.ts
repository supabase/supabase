import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'

import { Query } from 'components/grid/query/Query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { vaultSecretsKeys } from './keys'

export type VaultSecretDeleteVariables = {
  projectRef: string
  connectionString?: string
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
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<VaultSecretDeleteData, ResponseError, VaultSecretDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<VaultSecretDeleteData, ResponseError, VaultSecretDeleteVariables>(
    (vars) => deleteVaultSecret(vars),
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
