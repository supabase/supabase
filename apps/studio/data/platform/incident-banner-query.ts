import { queryOptions } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'

import { platformKeys } from './keys'
import { BASE_PATH } from '@/lib/constants'

export interface IncidentBannerItem {
  id: string
  show_banner: true | 'force'
  metadata: {
    affected_regions: Array<string> | null
    affects_project_creation: boolean
    force: boolean
  }
}

export type IncidentBannerData = { incidents: Array<IncidentBannerItem> }
export type IncidentBannerError = unknown

async function getIncidentBanner(signal?: AbortSignal): Promise<IncidentBannerData> {
  const response = await fetch(`${BASE_PATH}/api/incident-banner`, {
    signal,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error(`Failed to fetch incident banner: ${response.statusText}`)
  return response.json()
}

export const incidentBannerQueryOptions = () =>
  queryOptions({
    queryKey: platformKeys.incidentBanner(),
    queryFn: ({ signal }) => getIncidentBanner(signal),
    refetchOnWindowFocus: false,
    // exponential backoff retry starting at 4s, 16s, 64s, 256s etc. Hard capped at 5 minutes to prevent excessively
    // long retry delays.
    retryDelay: (attemptIndex) => Math.min(1000 * 4 ** attemptIndex, 1000 * 60 * 5),
    staleTime: 1000 * 60 * 5,
    enabled: IS_PLATFORM,
  })
