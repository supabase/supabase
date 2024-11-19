import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { isResponseOk, post } from 'lib/common/fetch'
import { BASE_PATH } from 'lib/constants'
import type { ResponseError } from 'types'

export type SqlDebugResponse = {
  solution: string
  sql: string
}

export type SqlDebugVariables = {
  errorMessage: string
  sql: string
  entityDefinitions?: string[]
}

export async function debugSql({ errorMessage, sql, entityDefinitions }: SqlDebugVariables) {
  const response = await post<SqlDebugResponse>(BASE_PATH + '/api/ai/sql/debug', {
    errorMessage,
    sql,
    entityDefinitions,
  })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

type SqlDebugData = Awaited<ReturnType<typeof debugSql>>

export const useSqlDebugMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<UseMutationOptions<SqlDebugData, ResponseError, SqlDebugVariables>, 'mutationFn'> = {}) => {
  return useMutation<SqlDebugData, ResponseError, SqlDebugVariables>((vars) => debugSql(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to debug SQL: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
