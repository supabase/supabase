import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { isResponseOk, post } from 'lib/common/fetch'
import { BASE_PATH } from 'lib/constants'
import { ResponseError } from 'types'

export type SqlEditResponse = {
  sql: string
}

export type SqlEditVariables = {
  prompt: string
  sql: string
  entityDefinitions?: string[]
}

export async function editSql({ prompt, sql, entityDefinitions }: SqlEditVariables) {
  const response = await post<SqlEditResponse>(BASE_PATH + '/api/ai/sql/edit', {
    prompt,
    sql,
    entityDefinitions,
  })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

type SqlEditData = Awaited<ReturnType<typeof editSql>>

export const useSqlEditMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<SqlEditData, ResponseError, SqlEditVariables>, 'mutationFn'> = {}) => {
  return useMutation<SqlEditData, ResponseError, SqlEditVariables>((vars) => editSql(vars), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
