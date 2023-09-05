import { useProjectsReadonlyStatusesQuery } from 'data/projects/projects-readonly-status-query'

export function useProjectReadOnlyStatus(projectRef?: string) {
  const { data } = useProjectsReadonlyStatusesQuery()

  if (!projectRef) return false

  return data?.[projectRef] ?? false
}
