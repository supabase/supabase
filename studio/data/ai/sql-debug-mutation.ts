import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { isResponseOk, post } from 'lib/common/fetch'
import { aiKeys } from './keys'

export type SqlDebugResponse = {
  solution: string
  sql: string
}

export type SqlDebugVariables = {
  errorMessage: string
  sql: string
}

export async function debugSql({ errorMessage, sql }: SqlDebugVariables) {
  const response = await post<SqlDebugResponse>('/api/ai/sql/debug', { errorMessage, sql })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

type SqlDebugData = Awaited<ReturnType<typeof debugSql>>

export const useSqlDebugMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<SqlDebugData, unknown, SqlDebugVariables>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SqlDebugData, unknown, SqlDebugVariables>((vars) => debugSql(vars), {
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries(aiKeys.sql())

      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
