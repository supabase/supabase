import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'

import { Query } from 'components/grid/query/Query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { pgSodiumKeys } from './keys'

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
  const sql = new Query().from('key', 'pgsodium').delete().match({ id }).toSql()
  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql,
    queryKey: ['projects', projectRef, 'pg-sodium-keys', 'delete', id],
  })
  return result
}

type VaultSecretDeleteData = Awaited<ReturnType<typeof deleteVaultSecret>>

export const usePgSodiumKeyDeleteMutation = ({
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
        console.log(pgSodiumKeys.list(projectRef))
        await queryClient.invalidateQueries(pgSodiumKeys.list(projectRef), {}, {})
        await onSuccess?.(data, variables, context)
      },

      ...options,
    }
  )
}
