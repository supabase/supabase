import { useParams } from 'common'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useMemo } from 'react'

export function useSelectedProject() {
  const { ref } = useParams()
  const { data } = useProjectsQuery()

  return useMemo(() => {
    return data?.find((project) => project.ref === ref)
  }, [data, ref])
}
