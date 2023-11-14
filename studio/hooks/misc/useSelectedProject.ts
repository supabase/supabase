import { useParams } from 'common'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useMemo } from 'react'

export function useSelectedProject() {
  const { ref } = useParams()
  const { data } = useProjectDetailQuery({ ref })

  if (data) return { ...data, parentRef: data?.parent_project_ref ?? data?.ref ?? undefined }
  return data
}

export function useProjectByRef(ref?: string) {
  const { data: projects } = useProjectsQuery()
  return useMemo(() => {
    if (!ref) return undefined
    return projects?.find((project) => project.ref === ref)
  }, [projects, ref])
}
