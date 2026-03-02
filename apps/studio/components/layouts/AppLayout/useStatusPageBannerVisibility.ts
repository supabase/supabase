import { useQueries } from '@tanstack/react-query'
import { useFlag } from 'common'

import { shouldShowBanner } from './StatusPageBanner.utils'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useIncidentStatusQuery } from '@/data/platform/incident-status-query'
import { projectKeys } from '@/data/projects/keys'
import {
  getOrganizationProjects,
  type OrgProject,
} from '@/data/projects/org-projects-infinite-query'

export type StatusPageBannerData = { title: string }

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
  const userRegions = new Set(
    allProjects.flatMap((project: OrgProject) => project.databases.map((db) => db.region))
  )
  const hasUnknownRegions = orgProjectsQueries.some(
    (q) => q.isError || (q.data !== undefined && q.data.pagination.count > q.data.projects.length)
  )

  if (showIncidentBannerOverride) return { title: 'We are investigating a technical issue' }

  if (!hasActiveIncidents || !isProjectsFetched) return null

  if (!shouldShowBanner({ incidents, hasProjects, userRegions, hasUnknownRegions })) return null

  return {
    title: hasProjects
      ? 'We are investigating a technical issue'
      : 'Project creation may be impacted in some regions',
  }
}
