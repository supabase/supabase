import { useQueries } from '@tanstack/react-query'

import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { projectKeys } from '@/data/projects/keys'
import { getOrganizationProjects } from '@/data/projects/org-projects-infinite-query'
import { PROVIDERS } from '@/lib/constants/infrastructure'

export interface FlyDeprecationProject {
  ref: string
  name: string
  orgSlug: string
  orgName: string
}

export function useFlyDeprecationProjects({ enabled }: { enabled: boolean }) {
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

  const { primaries, branches } = (organizations ?? []).reduce<{
    primaries: FlyDeprecationProject[]
    branches: FlyDeprecationProject[]
  }>(
    (acc, org, idx) => {
      const projects = orgProjectsQueries[idx]?.data?.projects ?? []
      for (const p of projects) {
        if (p.cloud_provider !== PROVIDERS.FLY.id) continue
        const bucket = p.is_branch ? acc.branches : acc.primaries
        bucket.push({ ref: p.ref, name: p.name, orgSlug: org.slug, orgName: org.name })
      }
      return acc
    },
    { primaries: [], branches: [] }
  )

  return { isReady, primaries, branches }
}
