import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import { entityTypeKeys } from 'data/entity-types/keys'
import { foreignTableKeys } from 'data/foreign-tables/keys'
import { pgSodiumKeys } from 'data/pg-sodium-keys/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import { vaultSecretsKeys } from 'data/vault/keys'
import type { ResponseError } from 'types'
import { FDW } from './fdws-query'
import { fdwKeys } from './keys'

export type FDWDeleteVariables = {
  projectRef: string
  connectionString?: string
  wrapper: FDW
  wrapperMeta: WrapperMeta
}

export const getDeleteFDWSql = ({
  wrapper,
  wrapperMeta,
}: Pick<FDWDeleteVariables, 'wrapper' | 'wrapperMeta'>) => {
  const encryptedOptions = wrapperMeta.server.options.filter((option) => option.encrypted)

  const deleteEncryptedSecretsSqlArray = encryptedOptions.map((option) => {
    const key = `${wrapper.name}_${option.name}`

    return /* SQL */ `
      delete from vault.secrets where key_id = (select id from pgsodium.valid_key where name = '${key}');

      delete from pgsodium.key where name = '${key}';
    `
  })

  const deleteEncryptedSecretsSql = deleteEncryptedSecretsSqlArray.join('\n')

  const sql = /* SQL */ `
    drop foreign data wrapper if exists ${wrapper.name} cascade;

    ${deleteEncryptedSecretsSql}
  `

  return sql
}

export async function deleteFDW({
  projectRef,
  connectionString,
  wrapper,
  wrapperMeta,
}: FDWDeleteVariables) {
  const sql = wrapWithTransaction(getDeleteFDWSql({ wrapper, wrapperMeta }))
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type FDWDeleteData = Awaited<ReturnType<typeof deleteFDW>>

export const useFDWDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<FDWDeleteData, ResponseError, FDWDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<FDWDeleteData, ResponseError, FDWDeleteVariables>((vars) => deleteFDW(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries(fdwKeys.list(projectRef), { refetchType: 'all' }),
        queryClient.invalidateQueries(entityTypeKeys.list(projectRef)),
        queryClient.invalidateQueries(foreignTableKeys.list(projectRef)),
        queryClient.invalidateQueries(pgSodiumKeys.list(projectRef)),
        queryClient.invalidateQueries(vaultSecretsKeys.list(projectRef)),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(
          `Failed to disable ${variables.wrapper.name} foreign data wrapper: ${data.message}`
        )
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
