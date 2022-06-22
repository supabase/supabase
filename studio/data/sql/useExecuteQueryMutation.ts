import { post } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useMutation, UseMutationOptions } from 'react-query'

/* Execute Query */

export type ExecuteQueryVariables = {
  projectRef: string
  sql: string
  connectionString?: string
}

export async function executeQuery(
  { projectRef, connectionString, sql }: ExecuteQueryVariables,
  signal?: AbortSignal
) {
  let headers = new Headers()

  if (connectionString) {
    headers.set('x-connection-encrypted', connectionString)
  }

  const response = await post(
    `${API_URL}/pg-meta/${projectRef}/query`,
    { query: sql },
    { headers: Object.fromEntries(headers), signal }
  )
  if (response.error) {
    throw response.error
  }

  return { result: response }
}

type ExecuteQueryData = Awaited<ReturnType<typeof executeQuery>>

export const useExecuteQueryMutation = ({
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<ExecuteQueryData, unknown, ExecuteQueryVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<ExecuteQueryData, unknown, ExecuteQueryVariables>(
    (args) => executeQuery(args),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      ...options,
    }
  )
}
