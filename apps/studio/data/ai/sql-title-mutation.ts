import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { classifyResponseError } from '@/data/error-classification'
import { constructHeaders, fetchHandler } from '@/data/fetchers'
import { BASE_PATH } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'
import { UseCustomMutationOptions } from '@/types'

type SqlTitleGenerateResponse = {
  title: string
  description: string
}

type SqlTitleGenerateVariables = {
  sql: string
}

async function generateSqlTitle({ sql }: SqlTitleGenerateVariables) {
  const url = `${BASE_PATH}/api/ai/sql/title-v2`

  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetchHandler(url, {
    headers,
    method: 'POST',
    body: JSON.stringify({
      sql,
    }),
  })
  let body: any

  try {
    body = await response.json()
  } catch {}

  if (!response.ok) {
    throw classifyResponseError({ message: body?.message, code: response.status })
  }

  return body as SqlTitleGenerateResponse
}

type SqlTitleGenerateData = Awaited<ReturnType<typeof generateSqlTitle>>

export const useSqlTitleGenerateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SqlTitleGenerateData, StudioError, SqlTitleGenerateVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<SqlTitleGenerateData, StudioError, SqlTitleGenerateVariables>({
    mutationFn: (vars) => generateSqlTitle(vars),
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to generate title: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
