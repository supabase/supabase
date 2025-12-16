import { useQuery } from '@tanstack/react-query'

import { platformKeys } from './keys'
import { UseCustomQueryOptions } from 'types'

export type IncidentInfo = {
  id: string
  name: string
  status: string
  active_since: string
}

export async function getIncidentStatus(signal?: AbortSignal): Promise<IncidentInfo[]> {
  const response = await fetch('/api/incident-status', {
    signal,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch incident status: ${response.statusText}`)
  }

  const data = await response.json()
  return data as IncidentInfo[]
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
  })

