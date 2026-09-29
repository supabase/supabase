import { useQueries, type UseQueryResult } from '@tanstack/react-query'

import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { projectKeys } from '@/data/projects/keys'
import {
  getOrganizationProjects,
  type OrgProjectsInfiniteData,
} from '@/data/projects/org-projects-infinite-query'
import { normalizeRegion, type UserRegionContext } from '@/lib/status-page/status-page.utils'

const PROJECTS_PAGE_LIMIT = 100
const PROJECTS_STALE_TIME_MS = 5 * 60 * 1000

const LOADING: UserProjectRegionsState = { status: 'loading' }

const FAIL_OPEN: UserProjectRegionsState = {
  status: 'resolved',
  context: { hasProjects: true, regions: new Set<string>(), isComplete: false },
}

export type UserProjectRegionsState =
  | { status: 'loading' }
  | { status: 'resolved'; context: UserRegionContext }

function combineOrgProjects(
  results: Array<UseQueryResult<OrgProjectsInfiniteData>>
): UserProjectRegionsState {
  if (results.some((r) => r.isPending)) return LOADING

  const anyErrored = results.some((r) => r.isError)
  const anyTruncated = results.some(
    (r) => r.data !== undefined && r.data.pagination.count > r.data.projects.length
  )

  const projects = results.flatMap((r) => r.data?.projects ?? [])
  const regions = new Set(
    projects.flatMap((p) => p.databases.map((db) => normalizeRegion(db.region)))
  )

  return {
    status: 'resolved',
    context: {
      hasProjects: projects.length > 0 || anyErrored,
      regions,
      isComplete: !anyErrored && !anyTruncated,
    },
  }
}

export function useUserProjectRegions({ enabled }: { enabled: boolean }): UserProjectRegionsState {
  const { data: organizations, isError: isOrganizationsError } = useOrganizationsQuery({ enabled })

  const projectsState = useQueries({
    queries: (organizations ?? []).map((org) => ({
      queryKey: projectKeys.bannerProjectsByOrg(org.slug),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getOrganizationProjects({ slug: org.slug, limit: PROJECTS_PAGE_LIMIT }, signal),
      staleTime: PROJECTS_STALE_TIME_MS,
      enabled,
    })),
    combine: combineOrgProjects,
  })

  if (!enabled) return LOADING
  if (organizations === undefined) return isOrganizationsError ? FAIL_OPEN : LOADING
  return projectsState
}
