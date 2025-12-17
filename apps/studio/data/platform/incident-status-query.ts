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
  // Add cache-busting in development to avoid stale empty responses
  const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  const url = isDevelopment 
    ? `/api/incident-status?_t=${Date.now()}` 
    : '/api/incident-status'
  
  const response = await fetch(url, {
    signal,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store', // Prevent caching
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[getIncidentStatus] Failed:', response.status, errorText)
    throw new Error(`Failed to fetch incident status: ${response.statusText}`)
  }

  const data = await response.json()
  console.log('[getIncidentStatus] Received data:', Array.isArray(data) ? `${data.length} incidents` : data)
  if (Array.isArray(data) && data.length === 0) {
    console.warn('[getIncidentStatus] Received empty array - this should not happen in development!')
  }
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

