import { useQueries } from '@tanstack/react-query'
import { LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { useCallback, useMemo } from 'react'

import { getRelevantIncidentIds, shouldShowBanner } from './StatusPageBanner.utils'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useIncidentStatusQuery } from '@/data/platform/incident-status-query'
import { projectKeys } from '@/data/projects/keys'
import {
  getOrganizationProjects,
  type OrgProject,
} from '@/data/projects/org-projects-infinite-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export type StatusPageBannerData = { title: string; dismiss?: () => void }

export function useStatusPageBannerVisibility(): StatusPageBannerData | null {
  const showIncidentBannerOverride =
    useFlag('ongoingIncident') || process.env.NEXT_PUBLIC_ONGOING_INCIDENT === 'true'

  const { data: allStatusPageEvents } = useIncidentStatusQuery()
  const { incidents = [] } = allStatusPageEvents ?? {}

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

  // Filter out individually dismissed incidents. An incident stays dismissed as
  // long as its ID remains in the stored set, regardless of whether other
  // incidents are added or removed.
  const dismissedIdSet = new Set(dismissedIds)
  const undismissedIncidents = incidents.filter((i) => !dismissedIdSet.has(i.id))

  // If dismissed state hasn't loaded yet, hide to prevent a flash of the banner.
  // If all relevant incidents have been dismissed, hide the banner.
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

  return {
    title,
    dismiss,
  }
}
