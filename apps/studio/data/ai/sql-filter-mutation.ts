import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { constructHeaders, fetchHandler } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import { ResponseError, UseCustomMutationOptions } from 'types'
import { AIFilterRequestPayload, FilterGroup } from 'ui-patterns/FilterBar'

export type SqlFilterGenerateResponse = FilterGroup

export async function generateSqlFilters({
  prompt,
  filterProperties,
  currentPath,
}: AIFilterRequestPayload) {
  const url = `${BASE_PATH}/api/ai/sql/filter-v1`

  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetchHandler(url, {
    headers,
    method: 'POST',
    body: JSON.stringify({ prompt, filterProperties, currentPath }),
  })

  if (!response.ok) {
    let errorMessage = 'Failed to generate filters'
    try {
      const errorBody = await response.json()
      errorMessage = errorBody?.error || errorBody?.message || errorMessage
    } catch {}
    throw new ResponseError(errorMessage, response.status)
  }

  return (await response.json()) as SqlFilterGenerateResponse
}

type SqlFilterGenerateData = Awaited<ReturnType<typeof generateSqlFilters>>

export const useSqlFilterGenerateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<SqlFilterGenerateData, ResponseError, AIFilterRequestPayload>,
  'mutationFn'
> = {}) => {
  return useMutation<SqlFilterGenerateData, ResponseError, AIFilterRequestPayload>({
    mutationFn: (vars) => generateSqlFilters(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to generate filters: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
