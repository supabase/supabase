import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { isResponseOk, post } from 'lib/common/fetch'
import { aiKeys } from './keys'

export type SqlEditResponse = {
  sql: string
}

export type SqlEditVariables = {
  prompt: string
  sql: string
}

export async function editSql({ prompt, sql }: SqlEditVariables) {
  const response = await post<SqlEditResponse>('/api/ai/sql/edit', { prompt, sql })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

type SqlEditData = Awaited<ReturnType<typeof editSql>>

export const useSqlEditMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<SqlEditData, unknown, SqlEditVariables>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SqlEditData, unknown, SqlEditVariables>((vars) => editSql(vars), {
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries(aiKeys.sql())

      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
