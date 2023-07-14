import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { aiKeys } from './keys'

export type SqlGenerateResponse = {
  title: string
  sql: string
}

export type SqlGenerateVariables = {
  prompt: string
}

export async function generateSql({ prompt }: SqlGenerateVariables) {
  const response = await post<SqlGenerateResponse>('/api/ai/sql', { prompt })
  if ('error' in response) {
    throw response.error
  }

  return response
}

type SqlGenerateData = Awaited<ReturnType<typeof generateSql>>

export const useSqlGenerateMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<SqlGenerateData, unknown, SqlGenerateVariables>, 'mutationFn'> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SqlGenerateData, unknown, SqlGenerateVariables>((vars) => generateSql(vars), {
    async onSuccess(data, variables, context) {
      await queryClient.invalidateQueries(aiKeys.sql())

      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
