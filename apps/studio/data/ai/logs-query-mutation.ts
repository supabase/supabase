import { useMutation } from '@tanstack/react-query'
import { constructHeaders, fetchHandler } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import { toast } from 'sonner'
import { ResponseError, UseCustomMutationOptions } from 'types'

export type LogsQueryGenerateVariables = { prompt: string }
export type LogsQueryGenerateResponse = { sql: string }

export async function generateLogsQuery({ prompt }: LogsQueryGenerateVariables) {
  const url = `${BASE_PATH}/api/ai/sql/logs-query-v1`

  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetchHandler(url, {
    headers,
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    let errorMessage = 'Failed to generate log query'
    try {
      const errorBody = await response.json()
      errorMessage = errorBody?.error || errorBody?.message || errorMessage
    } catch {}
    throw new ResponseError(errorMessage, response.status)
  }

  return (await response.json()) as LogsQueryGenerateResponse
}

type LogsQueryGenerateData = Awaited<ReturnType<typeof generateLogsQuery>>

export const useLogsQueryGenerateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<LogsQueryGenerateData, ResponseError, LogsQueryGenerateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<LogsQueryGenerateData, ResponseError, LogsQueryGenerateVariables>({
    mutationFn: (vars) => generateLogsQuery(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to generate log query: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
