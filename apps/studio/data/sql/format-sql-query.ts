import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export type FormatQueryVariables = {
  projectRef: string
  sql: string
  connectionString?: string
}

export async function formatQuery(
  { projectRef, connectionString, sql }: FormatQueryVariables,
  signal?: AbortSignal
) {
  let headers = new Headers()

  if (connectionString) {
    headers.set('x-connection-encrypted', connectionString)
  }

  const response = await post(
    `${API_URL}/pg-meta/${projectRef}/query/format`,
    { query: sql },
    { headers: Object.fromEntries(headers), signal }
  )
  if (response.error) {
    throw response.error
  }

  return { result: response }
}

type FormatQueryData = Awaited<ReturnType<typeof formatQuery>>

export const useFormatQueryMutation = ({
  onSuccess,
  ...options
}: Omit<UseMutationOptions<FormatQueryData, unknown, FormatQueryVariables>, 'mutationFn'> = {}) => {
  return useMutation<FormatQueryData, unknown, FormatQueryVariables>((args) => formatQuery(args), {
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    ...options,
  })
}
