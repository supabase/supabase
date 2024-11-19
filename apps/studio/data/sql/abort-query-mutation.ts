import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { sqlKeys } from './keys'

export type QueryAbortVariables = {
  pid: number
  projectRef?: string
  connectionString?: string
}

export async function abortQuery({ pid, projectRef, connectionString }: QueryAbortVariables) {
  const sql = /* SQL */ `select pg_terminate_backend(${pid})`
  const { result } = await executeSql({ projectRef, connectionString, sql })
  return result
}

type QueryAbortData = Awaited<ReturnType<typeof abortQuery>>

export const useQueryAbortMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<QueryAbortData, ResponseError, QueryAbortVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<QueryAbortData, ResponseError, QueryAbortVariables>(
    (vars) => abortQuery(vars),
    {
      async onSuccess(data, variables, context) {
        const { projectRef } = variables
        await queryClient.invalidateQueries(sqlKeys.ongoingQueries(projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to abort query: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
