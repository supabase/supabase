import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { INDEX_ADVISOR_QUERY_KEYS } from 'lib/database/index-advisor-utils'

/**
 * Hook to invalidate index-related queries in the QueryPerformance feature
 */
export function useIndexInvalidation() {
  const queryClient = useQueryClient()
  const { project } = useProjectContext()

  return useCallback(() => {
    // Invalidate index advisor results
    queryClient.invalidateQueries(INDEX_ADVISOR_QUERY_KEYS.indexAdvisor(project?.ref))

    // Invalidate query performance grid data
    queryClient.invalidateQueries(INDEX_ADVISOR_QUERY_KEYS.queryPerformance)
  }, [queryClient, project?.ref])
}
