import { useQuery } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS } from 'common'
import { useCallback } from 'react'

import { getRelevantIncidentIds, shouldShowBanner } from './StatusPageBanner.utils'
import { incidentBannerQueryOptions } from '@/data/platform/incident-banner-query'
import { useEmergencyIncidentOverride } from '@/hooks/misc/useEmergencyIncidentOverride'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useUserProjectRegions } from '@/hooks/misc/useUserProjectRegions'

export type StatusPageBannerData = { title: string; dismiss?: () => void }

const EMPTY_REGIONS: ReadonlySet<string> = new Set()

export function useStatusPageBannerVisibility(): StatusPageBannerData | null {
  const showIncidentBannerOverride = useEmergencyIncidentOverride()

  const { data: incidentBannerData } = useQuery(incidentBannerQueryOptions())

  const bannerItems = incidentBannerData?.incidents ?? []
  const incidents = bannerItems.map((i) => ({ id: i.id, cache: i.metadata }))
  const hasActiveIncidents = incidents.length > 0

  const userProjectRegions = useUserProjectRegions({
    enabled: !showIncidentBannerOverride && hasActiveIncidents,
  })

  const userContext =
    userProjectRegions.status === 'resolved' ? userProjectRegions.context : undefined
  const hasProjects = userContext?.hasProjects ?? false
  const userRegions = userContext?.regions ?? EMPTY_REGIONS
  const hasUnknownRegions = userContext !== undefined && !userContext.isComplete

  const [dismissedIds, setDismissedIds, { isSuccess: isDismissedLoaded }] = useLocalStorageQuery<
    Array<string>
  >(LOCAL_STORAGE_KEYS.INCIDENT_BANNER_DISMISSED_IDS, [])

  const dismiss = useCallback(() => {
    const activeIncidentIds = new Set(incidents.map((i) => i.id))
    const relevantIds = getRelevantIncidentIds({
      incidents,
      hasProjects,
      userRegions,
      hasUnknownRegions,
    })
    setDismissedIds((prev) => [
      ...new Set([...prev.filter((id) => activeIncidentIds.has(id)), ...relevantIds]),
    ])
  }, [incidents, hasProjects, userRegions, hasUnknownRegions, setDismissedIds])

  if (showIncidentBannerOverride) return { title: 'We are investigating a technical issue' }

  if (!hasActiveIncidents || userProjectRegions.status === 'loading') return null

  const dismissedIdSet = new Set(dismissedIds)
  const undismissedIncidents = incidents.filter((i) => !dismissedIdSet.has(i.id))

  if (
    !isDismissedLoaded ||
    !shouldShowBanner({
      incidents: undismissedIncidents,
      hasProjects,
      userRegions,
      hasUnknownRegions,
    })
  )
    return null

  const title = hasProjects
    ? 'We are investigating a technical issue'
    : 'Project creation may be impacted in some regions'

  return { title, dismiss }
}
