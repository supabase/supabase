import { useMemo } from 'react'

import { useIsLoggedIn, useParams } from 'common'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { ProjectInfo, useProjectsQuery } from 'data/projects/projects-query'
import { PROVIDERS } from 'lib/constants'

/**
 * @deprecated Use useSelectedProjectQuery instead for access to loading states etc
 *
 * Example migration:
 * ```
 * // Old:
 * const project = useSelectedProject()
 *
 * // New:
 * const { data: project } = useSelectedProjectQuery()
 * ```
 */
export function useSelectedProject({ enabled = true } = {}) {
  const { ref } = useParams()
  const { data } = useProjectDetailQuery({ ref }, { enabled })

  return useMemo(
    () => data && { ...data, parentRef: data?.parent_project_ref ?? data?.ref },
    [data]
  )
}

export function useSelectedProjectQuery({ enabled = true } = {}) {
  const { ref } = useParams()

  return useProjectDetailQuery(
    { ref },
    {
      enabled,
      select: (data) => {
        return { ...data, parentRef: data.parent_project_ref ?? data.ref }
      },
    }
  )
}

/**
 * @deprecated Use useProjectByRefQuery instead for access to loading states etc
 *
 * Example migration:
 * ```
 * // Old:
 * const project = useProjectByRef(ref)
 *
 * // New:
 * const { data: project } = useProjectByRefQuery(ref)
 * ```
 */
export function useProjectByRef(
  ref?: string
): Omit<ProjectInfo, 'organization_slug' | 'preview_branch_refs'> | undefined {
  const isLoggedIn = useIsLoggedIn()

  const { data: project } = useProjectDetailQuery({ ref }, { enabled: isLoggedIn })

  // [Alaister]: This is here for the purpose of improving performance.
  // Chances are, the user will already have the list of projects in the cache.
  // We can't exclusively rely on this method, as useProjectsQuery does not return branch projects.
  const { data: projects } = useProjectsQuery({ enabled: isLoggedIn })

  return useMemo(() => {
    if (!ref) return undefined
    if (project) return project
    return projects?.find((project) => project.ref === ref)
  }, [project, projects, ref])
}

export function useProjectByRefQuery(ref?: string) {
  const isLoggedIn = useIsLoggedIn()

  const projectQuery = useProjectDetailQuery({ ref }, { enabled: isLoggedIn })

  // [Alaister]: This is here for the purpose of improving performance.
  // Chances are, the user will already have the list of projects in the cache.
  // We can't exclusively rely on this method, as useProjectsQuery does not return branch projects.
  const projectsQuery = useProjectsQuery({
    enabled: isLoggedIn,
    select: (data) => {
      return data.find((project) => project.ref === ref)
    },
  })

  if (projectQuery.isSuccess) {
    return projectQuery
  }

  return projectsQuery
}

export const useIsAwsCloudProvider = () => {
  const project = useSelectedProject()
  const isAws = project?.cloud_provider === PROVIDERS.AWS.id

  return isAws
}

export const useIsAwsK8sCloudProvider = () => {
  const project = useSelectedProject()
  const isAwsK8s = project?.cloud_provider === PROVIDERS.AWS_K8S.id

  return isAwsK8s
}

export const useIsOrioleDb = () => {
  const project = useSelectedProject()
  const isOrioleDb = project?.dbVersion?.endsWith('orioledb')
  return isOrioleDb
}

export const useIsOrioleDbInAws = () => {
  const project = useSelectedProject()
  const isOrioleDbInAws =
    project?.dbVersion?.endsWith('orioledb') && project?.cloud_provider === PROVIDERS.AWS.id
  return isOrioleDbInAws
}
