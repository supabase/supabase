import { useParams } from 'common'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useProjectsQuery } from 'data/projects/projects-query'

export function useSelectedProject() {
  const { ref } = useParams()
  const { data } = useProjectDetailQuery({ ref })
  return data
}

export function useProjectByRef(ref?: string) {
  const { data: projects } = useProjectsQuery()
  if (!ref) return undefined
  return projects?.find((project) => project.ref === ref)
}
