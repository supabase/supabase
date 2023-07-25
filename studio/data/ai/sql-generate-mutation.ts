import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { isResponseOk, post } from 'lib/common/fetch'

export type SqlGenerateResponse = {
  title: string
  sql: string
}

export type SqlGenerateVariables = {
  prompt: string
  entityDefinitions?: string[]
}

export async function generateSql({ prompt, entityDefinitions }: SqlGenerateVariables) {
  const response = await post<SqlGenerateResponse>('/api/ai/sql/generate', {
    prompt,
    entityDefinitions,
  })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

type SqlGenerateData = Awaited<ReturnType<typeof generateSql>>

export const useSqlGenerateMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<SqlGenerateData, unknown, SqlGenerateVariables>, 'mutationFn'> = {}) => {
  return useMutation<SqlGenerateData, unknown, SqlGenerateVariables>((vars) => generateSql(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
