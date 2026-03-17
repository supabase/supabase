import { useQueries, useQuery } from '@tanstack/react-query'
import { IS_PROD, LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { useCallback, useMemo } from 'react'

import { getRelevantIncidentIds, shouldShowBanner } from './StatusPageBanner.utils'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { incidentBannerQueryOptions } from '@/data/platform/incident-banner-query'
import { useIncidentStatusQuery } from '@/data/platform/incident-status-query'
import { projectKeys } from '@/data/projects/keys'
import {
  getOrganizationProjects,
  type OrgProject,
} from '@/data/projects/org-projects-infinite-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export type StatusPageBannerData = { title: string; dismiss?: () => void }

// In non-production environments the incident-banner endpoint is the source of truth.
const IS_NON_PROD = !IS_PROD

export function useStatusPageBannerVisibility(): StatusPageBannerData | null {
  const showIncidentBannerOverride =
    useFlag('ongoingIncident') || process.env.NEXT_PUBLIC_ONGOING_INCIDENT === 'true'

  // Both queries run in parallel on all environments.
  const { data: allStatusPageEvents } = useIncidentStatusQuery()
  const { data: incidentBannerData } = useQuery(incidentBannerQueryOptions())

  // In non-production: derive incidents from the incident-banner endpoint.
  // In production: derive incidents from the statuspage endpoint (existing behaviour).
  const bannerItems = incidentBannerData?.incidents ?? []

  const incidents = IS_NON_PROD
    ? bannerItems.map((i) => ({ id: i.id, cache: i.metadata }))
    : (allStatusPageEvents?.incidents ?? []).filter((i) => i.impact !== 'none')

  const hasActiveIncidents = incidents.length > 0

  const { data: organizations } = useOrganizationsQuery({
    enabled: !showIncidentBannerOverride && hasActiveIncidents,
  })

  const orgProjectsQueries = useQueries({
    queries: (organizations ?? []).map((org) => ({
      queryKey: projectKeys.bannerProjectsByOrg(org.slug),
      queryFn: () => getOrganizationProjects({ slug: org.slug, limit: 100 }),
      staleTime: 5 * 60 * 1000,
      enabled: !showIncidentBannerOverride && hasActiveIncidents,
    })),
  })

  const isProjectsFetched =
    organizations !== undefined &&
    (organizations.length === 0 || orgProjectsQueries.every((q) => q.isFetched))

  const allProjects = orgProjectsQueries.flatMap((q) => q.data?.projects ?? [])
  const hasProjects = allProjects.length > 0
  const userRegions = useMemo(
    () =>
      new Set(
        allProjects.flatMap((project: OrgProject) => project.databases.map((db) => db.region))
      ),
    [allProjects]
  )
  const hasUnknownRegions = orgProjectsQueries.some(
    (q) => q.isError || (q.data !== undefined && q.data.pagination.count > q.data.projects.length)
  )

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

  if (!hasActiveIncidents || !isProjectsFetched) return null

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
