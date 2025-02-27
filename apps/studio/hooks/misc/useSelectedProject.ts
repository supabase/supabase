import { useIsLoggedIn, useParams } from 'common'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { ProjectInfo, useProjectsQuery } from 'data/projects/projects-query'
import { useMemo } from 'react'

export function useSelectedProject({ enabled = true } = {}) {
  const { ref } = useParams()
  const { data } = useProjectDetailQuery({ ref }, { enabled })

  return useMemo(
    () => data && { ...data, parentRef: data?.parent_project_ref ?? data?.ref },
    [data]
  )
}

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

export const useIsOrioleDb = () => {
  const project = useSelectedProject()
  const isOrioleDb = project?.dbVersion?.endsWith('orioledb')
  return isOrioleDb
}
