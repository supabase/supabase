import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { WrapperMeta } from 'components/interfaces/Database/Wrappers/Wrappers.types'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import { useStore } from 'hooks'
import { ResponseError } from 'types'
import { getCreateFDWSql } from './fdw-create-mutation'
import { getDeleteFDWSql } from './fdw-delete-mutation'
import { FDW } from './fdws-query'

export type FDWUpdateVariables = {
  projectRef?: string
  connectionString?: string
  wrapper: FDW
  wrapperMeta: WrapperMeta
  formState: {
    [k: string]: string
  }
  tables: any[]
}

export const getUpdateFDWSql = ({
  wrapper,
  wrapperMeta,
  formState,
  tables,
}: Pick<FDWUpdateVariables, 'wrapper' | 'wrapperMeta' | 'formState' | 'tables'>) => {
  const deleteWrapperSql = getDeleteFDWSql({ wrapper, wrapperMeta })
  const createWrapperSql = getCreateFDWSql({ wrapperMeta, formState, tables })

  const sql = /* SQL */ `
    ${deleteWrapperSql}

    ${createWrapperSql}
  `

  return sql
}

export async function updateFDW({
  projectRef,
  connectionString,
  wrapper,
  wrapperMeta,
  formState,
  tables,
}: FDWUpdateVariables) {
  const sql = wrapWithTransaction(getUpdateFDWSql({ wrapper, wrapperMeta, formState, tables }))
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type FDWUpdateData = Awaited<ReturnType<typeof updateFDW>>

export const useFDWUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<FDWUpdateData, ResponseError, FDWUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const { vault } = useStore()

  return useMutation<FDWUpdateData, ResponseError, FDWUpdateVariables>((vars) => updateFDW(vars), {
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
          `Failed to update ${variables.wrapper.name} foreign data wrapper: ${data.message}`
        )
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
