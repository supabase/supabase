import { useMemo } from 'react'

import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useProjectsInfiniteQuery } from '@/data/projects/projects-infinite-query'

interface UseOrgAndProjectDataOptions {
  enabled?: boolean
}

export const useOrgAndProjectData = (options: UseOrgAndProjectDataOptions = {}) => {
  const { enabled = true } = options

  const { data: organizations = [], isLoading: isLoadingOrgs } = useOrganizationsQuery({ enabled })

  const {
    data: projectsData,
    isLoading: isLoadingProjects,
    hasNextPage: hasMoreProjects = false,
  } = useProjectsInfiniteQuery({
    limit: 100,
  })

  const projects = useMemo(
    () => projectsData?.pages.flatMap((page) => page.projects) ?? [],
    [projectsData]
  )

  return {
    organizations,
    projects,
    isLoadingOrgs,
    isLoadingProjects,
    // Only the first page is ever fetched, so `projects` is a prefix of the real list for
    // anyone with more than `limit`. Callers that ask "is this ref mine?" must not read a
    // miss as a no.
    hasMoreProjects,
  }
}
