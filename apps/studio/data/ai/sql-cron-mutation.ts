import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { classifyResponseError } from '@/data/error-classification'
import { constructHeaders, fetchHandler } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'
import { UseCustomMutationOptions } from '@/types'

export type SqlCronGenerateResponse = string

export type SqlCronGenerateVariables = {
  prompt: string
}

export async function generateSqlCron({ prompt }: SqlCronGenerateVariables) {
  const url = `${BASE_PATH}/api/ai/sql/cron-v2`

  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetchHandler(url, {
    headers,
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })

  let body: any

  try {
    body = await response.json()
  } catch {}

  if (!response.ok) {
    throw classifyResponseError({ message: body?.message, code: response.status })
  }

  return body as SqlCronGenerateResponse
}

type SqlCronGenerateData = Awaited<ReturnType<typeof generateSqlCron>>

export const useSqlCronGenerateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SqlCronGenerateData, StudioError, SqlCronGenerateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SqlCronGenerateData, StudioError, SqlCronGenerateVariables>({
    mutationFn: (vars) => generateSqlCron(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to generate cron expression: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
