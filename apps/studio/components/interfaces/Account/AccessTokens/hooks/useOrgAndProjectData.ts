import { useMemo } from 'react'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsInfiniteQuery } from 'data/projects/projects-infinite-query'

interface UseOrgAndProjectDataOptions {
  enabled?: boolean
}

export const useOrgAndProjectData = (options: UseOrgAndProjectDataOptions = {}) => {
  const { enabled = true } = options

  const { data: organizations = [], isLoading: isLoadingOrgs } = useOrganizationsQuery({ enabled })

  const { data: projectsData, isLoading: isLoadingProjects } = useProjectsInfiniteQuery({
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
  }
}
