import { useParams } from 'common'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useMemo } from 'react'

export function useSelectedProject() {
  const { ref } = useParams()
  const { data: allProjects } = useProjectsQuery()
  const { data } = useProjectDetailQuery({ ref })

  const projectMinimal = useMemo(
    () => allProjects?.find((project) => project.ref === ref),
    [ref, allProjects]
  )
  return data || projectMinimal
}
