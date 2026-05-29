import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROVIDERS } from '@/lib/constants/infrastructure'

export interface FlyDeprecationProject {
  ref: string
  name: string
  orgSlug: string
  orgName: string
}

export function useFlyDeprecationProjects({ enabled }: { enabled: boolean }) {
  const { data: selectedProject } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()

  const orgSlug = selectedOrg?.slug
  const orgName = selectedOrg?.name ?? ''

  const { data: orgProjectsData, isFetched } = useOrgProjectsInfiniteQuery(
    { slug: orgSlug },
    { enabled: enabled && Boolean(orgSlug), staleTime: 30 * 60 * 1000 }
  )

  if (!enabled || !orgSlug) {
    return { isReady: false, primaries: [], branches: [] }
  }

  const byRef = new Map<string, FlyDeprecationProject & { isBranch: boolean }>()

  if (selectedProject?.cloud_provider === PROVIDERS.FLY.id) {
    byRef.set(selectedProject.ref, {
      ref: selectedProject.ref,
      name: selectedProject.name,
      orgSlug,
      orgName,
      isBranch: Boolean(selectedProject.parent_project_ref),
    })
  }

  const orgProjects = orgProjectsData?.pages.flatMap((page) => page.projects) ?? []
  for (const p of orgProjects) {
    if (p.cloud_provider !== PROVIDERS.FLY.id) continue
    if (byRef.has(p.ref)) continue
    byRef.set(p.ref, {
      ref: p.ref,
      name: p.name,
      orgSlug,
      orgName,
      isBranch: Boolean(p.is_branch),
    })
  }

  const all = Array.from(byRef.values())
  const primaries: FlyDeprecationProject[] = []
  const branches: FlyDeprecationProject[] = []
  for (const { isBranch, ...rest } of all) {
    ;(isBranch ? branches : primaries).push(rest)
  }

  return { isReady: isFetched, primaries, branches }
}
