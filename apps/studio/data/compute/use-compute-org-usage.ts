import { useQuery } from '@tanstack/react-query'

import { computeOrgUsageQueryOptions } from './compute-usage-query'
import { useOrgProjectsInfiniteQuery } from '@/data/projects/org-projects-infinite-query'
import { IS_PLATFORM } from '@/lib/constants'

interface UseComputeOrgUsageVariables {
  orgSlug?: string
  projectRef?: string | null
  days: number
}

/**
 * Compute usage for an organization, generated against its real project list.
 *
 * The figures are mock but the projects are not: a usage table naming projects nobody
 * recognises is hard to read against, and harder to sanity-check. Both the usage section and
 * the billing summary need the same pairing, so it lives here rather than in either of them.
 */
export const useComputeOrgUsage = ({ orgSlug, projectRef, days }: UseComputeOrgUsageVariables) => {
  const { data: projectPages, isPending: isPendingProjects } = useOrgProjectsInfiniteQuery({
    slug: orgSlug,
  })

  const projects = (projectPages?.pages ?? []).flatMap((page) =>
    page.projects.map((project) => ({ ref: project.ref, name: project.name }))
  )

  const usage = useQuery({
    ...computeOrgUsageQueryOptions({ orgSlug, projects, projectRef, days }),
    // Generating against a half-loaded project list would render a table that then changes
    // under the reader.
    enabled: IS_PLATFORM && orgSlug !== undefined && !isPendingProjects,
  })

  return { ...usage, isPending: usage.isPending || isPendingProjects }
}
