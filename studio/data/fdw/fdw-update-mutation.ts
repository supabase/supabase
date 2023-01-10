import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { WrapperMeta } from 'components/interfaces/Database/Wrappers/Wrappers.types'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import { useStore } from 'hooks'
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
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const sql = wrapWithTransaction(getUpdateFDWSql({ wrapper, wrapperMeta, formState, tables }))

  const { result } = await executeSql({ projectRef, connectionString, sql })

  return result
}

type FDWUpdateData = Awaited<ReturnType<typeof updateFDW>>

export const useFDWUpdateMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<FDWUpdateData, unknown, FDWUpdateVariables>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()
  const { vault } = useStore()

  return useMutation<FDWUpdateData, unknown, FDWUpdateVariables>((vars) => updateFDW(vars), {
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
