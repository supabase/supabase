import { useEffect, useMemo } from 'react'

import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useProjectsInfiniteQuery } from '@/data/projects/projects-infinite-query'

interface UseOrgAndProjectDataOptions {
  enabled?: boolean
}

export const useOrgAndProjectData = (options: UseOrgAndProjectDataOptions = {}) => {
  const { enabled = true } = options

  const {
    data: organizations = [],
    isLoading: isLoadingOrgs,
    isError: isErrorOrgs,
  } = useOrganizationsQuery({ enabled })

  const {
    data: projectsData,
    isLoading: isLoadingFirstPage,
    isError: isErrorProjects,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useProjectsInfiniteQuery({ limit: 100 }, { enabled })

  // Callers evaluate token access against this list, treating any bound project missing from it
  // as inaccessible — so a truncated page would raise false "no longer accessible" alarms for
  // accounts with more projects than one page holds. Drain every page, and report loading until
  // the list is complete so evaluations stay 'unknown' rather than wrong.
  useEffect(() => {
    if (enabled && hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [enabled, hasNextPage, isFetchingNextPage, fetchNextPage])

  const projects = useMemo(
    () => projectsData?.pages.flatMap((page) => page.projects) ?? [],
    [projectsData]
  )

  return {
    organizations,
    projects,
    isLoadingOrgs,
    isLoadingProjects: isLoadingFirstPage || hasNextPage,
    isErrorOrgs,
    isErrorProjects,
  }
}
