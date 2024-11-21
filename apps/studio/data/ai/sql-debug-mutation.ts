import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import { ResponseError } from 'types'

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
  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetch(`${BASE_PATH}/api/ai/sql/debug`, {
    headers,
    method: 'POST',
    body: JSON.stringify({
      errorMessage,
      sql,
      entityDefinitions,
    }),
  })
  let body: any

  try {
    body = await response.json()
  } catch {}

  if (!response.ok) {
    throw new ResponseError(body?.message, response.status)
  }

  return body as SqlDebugResponse
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
