import { useParams } from 'common'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'

export function useSelectedProject() {
  const { ref } = useParams()
  const { data } = useProjectDetailQuery({ ref })
  return data
}
