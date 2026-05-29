import { useQuery } from '@tanstack/react-query'
import { partition } from 'lodash'

import { platformKeys } from './keys'
import type { IncidentInfo } from '@/lib/api/incident-status'
import { BASE_PATH, IS_PLATFORM, IS_TEST_ENV } from '@/lib/constants'
import { ResponseError, UseCustomQueryOptions } from '@/types'

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

    let retryAfter: number | undefined
    const retryAfterHeader = response.headers.get('Retry-After')
    if (retryAfterHeader !== null) {
      const parsed = Number(retryAfterHeader)
      if (Number.isFinite(parsed) && parsed > 0) retryAfter = parsed
    }

    throw new ResponseError(
      `Failed to fetch incident status: ${response.statusText}`,
      response.status,
      undefined,
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
  return useQuery<IncidentStatusData, IncidentStatusError, TData>({
    queryKey: platformKeys.incidentStatus(),
    queryFn: ({ signal }) => getIncidentStatus(signal),
    refetchOnWindowFocus: false,
    // Use longer exponential backoff than the QueryClient default (base 4, cap 5 min vs base 2, cap 30s).
    // The retryAfter header case is also handled here for consistency with query-client.ts.
    retryDelay: (attemptIndex, error) => {
      if (error instanceof ResponseError && error.retryAfter) {
        return error.retryAfter * 1000
      }
      return Math.min(1000 * 4 ** attemptIndex, 1000 * 60 * 5)
    },
    ...options,
    // Enable in platform mode, or in test environment for E2E testing
    enabled: (IS_PLATFORM || IS_TEST_ENV) && (options.enabled ?? true),
  })
}
