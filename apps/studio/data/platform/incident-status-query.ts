import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { IncidentInfo } from 'lib/api/incident-status'
import { BASE_PATH, IS_PLATFORM, IS_TEST_ENV } from 'lib/constants'
import { partition } from 'lodash'
import { UseCustomQueryOptions } from 'types'

import { platformKeys } from './keys'

export class IncidentStatusFetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfter: number | null
  ) {
    super(message)
    this.name = 'IncidentStatusFetchError'
  }
}

export async function getIncidentStatus(
  signal?: AbortSignal
): Promise<{ maintenanceEvents: IncidentInfo[]; incidents: IncidentInfo[] }> {
  const response = await fetch(`${BASE_PATH}/api/incident-status`, {
    signal,
    method: 'GET',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[getIncidentStatus] Failed:', response.status, errorText)

    let retryAfter: number | null = null
    const retryAfterHeader = response.headers.get('Retry-After')
    if (retryAfterHeader !== null) {
      const parsed = Number(retryAfterHeader)
      if (Number.isFinite(parsed) && parsed > 0) retryAfter = parsed
    }

    throw new IncidentStatusFetchError(
      `Failed to fetch incident status: ${response.statusText}`,
      response.status,
      retryAfter
    )
  }

  const data = await response.json()
  const [maintenanceEvents, incidents] = partition(
    data ?? [],
    (event) => event.impact === 'maintenance'
  )
  return { maintenanceEvents, incidents }
}

export type IncidentStatusData = Awaited<ReturnType<typeof getIncidentStatus>>
export type IncidentStatusError = unknown

export const useIncidentStatusQuery = <TData = IncidentStatusData>(
  options: UseCustomQueryOptions<IncidentStatusData, IncidentStatusError, TData> = {}
) => {
  const queryClient = useQueryClient()

  return useQuery<IncidentStatusData, IncidentStatusError, TData>({
    queryKey: platformKeys.incidentStatus(),
    queryFn: ({ signal }) => getIncidentStatus(signal),
    refetchOnWindowFocus: false,
    // For 420 with Retry-After: retry exactly once after the specified delay.
    // All other errors: defer to the QueryClient default (e.g. retry: false in tests,
    // retry: 3 in production) with exponential backoff capped at 5 minutes.
    retry: (failureCount, error) => {
      if (
        error instanceof IncidentStatusFetchError &&
        error.status === 420 &&
        error.retryAfter !== null
      ) {
        return failureCount < 1
      }
      const defaultRetry = queryClient.getDefaultOptions()?.queries?.retry ?? 3
      if (defaultRetry === false) return false
      if (defaultRetry === true) return true
      if (typeof defaultRetry === 'number') return failureCount < defaultRetry
      if (error instanceof Error) return defaultRetry(failureCount, error)
      return false
    },
    retryDelay: (attemptIndex, error) => {
      if (
        error instanceof IncidentStatusFetchError &&
        error.status === 420 &&
        error.retryAfter !== null
      ) {
        return error.retryAfter * 1000
      }
      return Math.min(1000 * 4 ** attemptIndex, 1000 * 60 * 5)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes to match API cache
    ...options,
    // Enable in platform mode, or in test environment for E2E testing
    enabled: (IS_PLATFORM || IS_TEST_ENV) && (options.enabled ?? true),
  })
}
