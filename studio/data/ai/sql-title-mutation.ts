import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { isResponseOk, post } from 'lib/common/fetch'
import { aiKeys } from './keys'

export type SqlTitleGenerateResponse = {
  title: string
}

export type SqlTitleGenerateVariables = {
  sql: string
}

export async function generateSqlTitle({ sql }: SqlTitleGenerateVariables) {
  const response = await post<SqlTitleGenerateResponse>('/api/ai/sql/title', { sql })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

type SqlTitleGenerateData = Awaited<ReturnType<typeof generateSqlTitle>>

export const useSqlTitleGenerateMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<SqlTitleGenerateData, unknown, SqlTitleGenerateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SqlTitleGenerateData, unknown, SqlTitleGenerateVariables>(
    (vars) => generateSqlTitle(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(aiKeys.sql())

        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
