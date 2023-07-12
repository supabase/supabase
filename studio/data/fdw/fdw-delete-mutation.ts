import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { WrapperMeta } from 'components/interfaces/Database/Wrappers/Wrappers.types'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import { useStore } from 'hooks'
import { ResponseError } from 'types'
import { FDW } from './fdws-query'

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
  const { vault } = useStore()

  return useMutation<FDWDeleteData, ResponseError, FDWDeleteVariables>((vars) => deleteFDW(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries(sqlKeys.query(projectRef, ['fdws'])),
        vault.load(),
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
