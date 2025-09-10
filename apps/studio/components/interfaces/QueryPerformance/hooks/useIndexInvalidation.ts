import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { parseAsString, useQueryStates } from 'nuqs'
import { useCallback } from 'react'

import {
  QueryPerformanceSort,
  useQueryPerformanceQuery,
} from 'components/interfaces/Reports/Reports.queries'
import { databaseIndexesKeys } from 'data/database-indexes/keys'
import { databaseKeys } from 'data/database/keys'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useIndexAdvisorStatus } from './useIsIndexAdvisorStatus'

export function useIndexInvalidation() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const { isIndexAdvisorEnabled } = useIndexAdvisorStatus()

  const [{ preset: urlPreset, search: searchQuery, order, sort }] = useQueryStates({
    sort: parseAsString,
    search: parseAsString.withDefault(''),
    order: parseAsString,
    preset: parseAsString.withDefault('unified'),
  })

  const orderBy = !!sort ? ({ column: sort, order } as QueryPerformanceSort) : undefined
  const roles = router?.query?.roles ?? []

  const queryPerformanceQuery = useQueryPerformanceQuery({
    searchQuery,
    orderBy,
    preset: 'unified',
    roles: typeof roles === 'string' ? [roles] : roles,
    runIndexAdvisor: isIndexAdvisorEnabled,
  })

  return useCallback(() => {
    queryPerformanceQuery.runQuery()
    queryClient.invalidateQueries(databaseKeys.indexAdvisorFromQuery(project?.ref, ''))
    queryClient.invalidateQueries(databaseIndexesKeys.list(project?.ref))
  }, [queryPerformanceQuery, queryClient, project?.ref])
}
