import { useQuery } from '@tanstack/react-query'

import { analyticsKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { UseCustomQueryOptions } from '@/types'

export type ApiKeysLastUsedVariables = {
  projectRef?: string
  isoTimestampStart?: string
  isoTimestampEnd?: string
}

// One row per (role, signature_prefix). `timestamp` is unix millis of the most
// recent edge-log entry seen for that anon / service_role JWT api key fingerprint.
export type ApiKeyLastUsed = {
  timestamp: number
  role?: 'anon' | 'service_role' | string
  signature_prefix?: string
}

export async function getApiKeysLastUsed(
  { projectRef, isoTimestampStart, isoTimestampEnd }: ApiKeysLastUsedVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const { data, error } = await get(
    '/platform/projects/{ref}/analytics/endpoints/api_keys.last_used.otel',
    {
      params: {
        path: { ref: projectRef },
        query: {
          iso_timestamp_start: isoTimestampStart,
          iso_timestamp_end: isoTimestampEnd,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)

  const response = data as { error?: string | object | null; result?: unknown[] }
  if (response?.error) {
    throw new Error(
      typeof response.error === 'string' ? response.error : 'Failed to fetch last-used API keys'
    )
  }

  return (response?.result ?? []) as ApiKeyLastUsed[]
}

export type ApiKeysLastUsedData = Awaited<ReturnType<typeof getApiKeysLastUsed>>
export type ApiKeysLastUsedError = unknown

export const useApiKeysLastUsedQuery = <TData = ApiKeysLastUsedData>(
  { projectRef, isoTimestampStart, isoTimestampEnd }: ApiKeysLastUsedVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ApiKeysLastUsedData, ApiKeysLastUsedError, TData> = {}
) =>
  useQuery<ApiKeysLastUsedData, ApiKeysLastUsedError, TData>({
    queryKey: analyticsKeys.apiKeysLastUsed(projectRef, { isoTimestampStart, isoTimestampEnd }),
    queryFn: ({ signal }) =>
      getApiKeysLastUsed({ projectRef, isoTimestampStart, isoTimestampEnd }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
