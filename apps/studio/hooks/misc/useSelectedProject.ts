import { useIsLoggedIn, useParams } from 'common'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useMemo } from 'react'

export function useSelectedProject({ enabled = true } = {}) {
  const { ref } = useParams()
  const { data } = useProjectDetailQuery({ ref }, { enabled })

  return useMemo(
    () => data && { ...data, parentRef: data?.parent_project_ref ?? data?.ref },
    [data]
  )
}

export function useProjectByRef(ref?: string) {
  const isLoggedIn = useIsLoggedIn()
  const { data: projects } = useProjectsQuery({ enabled: isLoggedIn })
  return useMemo(() => {
    if (!ref) return undefined
    return projects?.find((project) => project.ref === ref)
  }, [projects, ref])
}
