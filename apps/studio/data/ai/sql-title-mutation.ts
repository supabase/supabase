import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { isResponseOk, post } from 'lib/common/fetch'
import { BASE_PATH } from 'lib/constants'
import type { ResponseError } from 'types'

export type SqlTitleGenerateResponse = {
  title: string
  description: string
}

export type SqlTitleGenerateVariables = {
  sql: string
}

export async function generateSqlTitle({ sql }: SqlTitleGenerateVariables) {
  const response = await post<SqlTitleGenerateResponse>(BASE_PATH + '/api/ai/sql/title', { sql })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

type SqlTitleGenerateData = Awaited<ReturnType<typeof generateSqlTitle>>

export const useSqlTitleGenerateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SqlTitleGenerateData, ResponseError, SqlTitleGenerateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SqlTitleGenerateData, ResponseError, SqlTitleGenerateVariables>(
    (vars) => generateSqlTitle(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to generate title: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
