import { useQueries } from '@tanstack/react-query'

import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { projectKeys } from '@/data/projects/keys'
import {
  getOrganizationProjects,
  type OrgProject,
} from '@/data/projects/org-projects-infinite-query'
import { PROVIDERS } from '@/lib/constants/infrastructure'

export interface FlyDeprecationProject {
  ref: string
  name: string
  orgSlug: string
  orgName: string
  isBranch: boolean
}

export interface FlyDeprecationProjectsResult {
  isReady: boolean
  primaries: FlyDeprecationProject[]
  branches: FlyDeprecationProject[]
}

export function useFlyDeprecationProjects({
  enabled,
}: {
  enabled: boolean
}): FlyDeprecationProjectsResult {
  const { data: organizations } = useOrganizationsQuery({ enabled })

  const orgProjectsQueries = useQueries({
    queries: (organizations ?? []).map((org) => ({
      queryKey: projectKeys.bannerProjectsByOrg(org.slug),
      queryFn: () => getOrganizationProjects({ slug: org.slug, limit: 100 }),
      staleTime: 30 * 60 * 1000,
      enabled,
    })),
  })

  const isReady =
    enabled &&
    organizations !== undefined &&
    (organizations.length === 0 || orgProjectsQueries.every((q) => q.isFetched))

  const flyProjects: FlyDeprecationProject[] = orgProjectsQueries.flatMap((query, idx) => {
    const org = (organizations ?? [])[idx]
    if (!org) return []
    const projects = query.data?.projects ?? []
    return projects
      .filter((p: OrgProject) => p.cloud_provider === PROVIDERS.FLY.id)
      .map((p: OrgProject) => ({
        ref: p.ref,
        name: p.name,
        orgSlug: org.slug,
        orgName: org.name,
        isBranch: p.is_branch,
      }))
  })

  return {
    isReady,
    primaries: flyProjects.filter((p) => !p.isBranch),
    branches: flyProjects.filter((p) => p.isBranch),
  }
}
