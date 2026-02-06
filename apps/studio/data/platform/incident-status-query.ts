import { useQuery } from '@tanstack/react-query'
import type { IncidentInfo } from 'lib/api/incident-status'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { partition } from 'lodash'
import { UseCustomQueryOptions } from 'types'

import { platformKeys } from './keys'

export async function getIncidentStatus(
  signal?: AbortSignal
): Promise<{ maintenanceEvents: IncidentInfo[]; incidents: IncidentInfo[] }> {
  const response = await fetch(`${BASE_PATH}/api/incident-status`, {
    signal,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[getIncidentStatus] Failed:', response.status, errorText)
    throw new Error(`Failed to fetch incident status: ${response.statusText}`)
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
) =>
  useQuery<IncidentStatusData, IncidentStatusError, TData>({
    queryKey: platformKeys.incidentStatus(),
    queryFn: ({ signal }) => getIncidentStatus(signal),
    staleTime: 1000 * 60 * 5, // 5 minutes to match API cache
    ...options,
    enabled: IS_PLATFORM && (options.enabled ?? true),
  })
