import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'

export type FDWDeleteVariables = {
  projectRef?: string
  connectionString?: string
  name: string
}

export const getDeleteFDWSql = ({ name }: Pick<FDWDeleteVariables, 'name'>) => {
  const sql = /* SQL */ `
    drop foreign data wrapper if exists ${name} cascade;
  `

  return sql
}

export async function deleteFDW({ projectRef, connectionString, name }: FDWDeleteVariables) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const sql = getDeleteFDWSql({ name })

  const { result } = await executeSql({ projectRef, connectionString, sql })

  return result
}

type FDWDeleteData = Awaited<ReturnType<typeof deleteFDW>>

export const useFDWDeleteMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<FDWDeleteData, unknown, FDWDeleteVariables>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<FDWDeleteData, unknown, FDWDeleteVariables>((vars) => deleteFDW(vars), {
    async onSuccess(data, variables, context) {
      const { projectRef } = variables

      await queryClient.invalidateQueries(sqlKeys.query(projectRef, ['fdws']))

      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
