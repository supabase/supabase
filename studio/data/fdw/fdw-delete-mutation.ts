import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { WrapperMeta } from 'components/interfaces/Database/Wrappers/Wrappers.types'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import { useStore } from 'hooks'
import { FDW } from './fdws-query'

export type FDWDeleteVariables = {
  projectRef?: string
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
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const sql = wrapWithTransaction(getDeleteFDWSql({ wrapper, wrapperMeta }))

  const { result } = await executeSql({ projectRef, connectionString, sql })

  return result
}

type FDWDeleteData = Awaited<ReturnType<typeof deleteFDW>>

export const useFDWDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<FDWDeleteData, unknown, FDWDeleteVariables>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()
  const { vault } = useStore()

  return useMutation<FDWDeleteData, unknown, FDWDeleteVariables>((vars) => deleteFDW(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await Promise.all([
        queryClient.invalidateQueries(sqlKeys.query(projectRef, ['fdws'])),
        vault.load(),
      ])

      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
