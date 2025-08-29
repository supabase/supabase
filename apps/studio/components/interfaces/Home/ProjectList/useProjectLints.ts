import { useQuery } from '@tanstack/react-query'
import { getProjectLints } from 'data/lint/lint-query'

/**
 * Custom hook to fetch lint data for a specific project
 * Unlike useProjectLintsQuery, this can work with any project ref
 */
export const useProjectLints = (projectRef: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['project-lints', projectRef],
    queryFn: ({ signal }) => getProjectLints({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
  })
}
