import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import { ResponseError } from 'types'

export type SqlExplainAnalyzeResponse = string

export type SqlExplainAnalyzeVariables = {
  plan: string
  query?: string
}

export async function analyzeSqlExplain({ plan, query }: SqlExplainAnalyzeVariables) {
  const url = `${BASE_PATH}/api/ai/sql/explain`

  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetchHandler(url, {
    headers,
    method: 'POST',
    body: JSON.stringify({ plan, query }),
  })

  let body: any

  try {
    body = await response.json()
  } catch {}

  if (!response.ok) {
    throw new ResponseError(
      body?.message || body?.error || 'Failed to analyze query',
      response.status
    )
  }

  return body as SqlExplainAnalyzeResponse
}

type SqlExplainAnalyzeData = Awaited<ReturnType<typeof analyzeSqlExplain>>

export const useSqlExplainAnalyzeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SqlExplainAnalyzeData, ResponseError, SqlExplainAnalyzeVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SqlExplainAnalyzeData, ResponseError, SqlExplainAnalyzeVariables>(
    (vars) => analyzeSqlExplain(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to analyze query: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
