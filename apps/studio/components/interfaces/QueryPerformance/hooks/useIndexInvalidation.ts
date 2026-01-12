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
import {
  QUERY_PERFORMANCE_PRESET_MAP,
  QUERY_PERFORMANCE_REPORT_TYPES,
} from '../QueryPerformance.constants'
import { useIndexAdvisorStatus } from './useIsIndexAdvisorStatus'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import { useTableIndexAdvisor } from 'components/grid/context/TableIndexAdvisorContext'

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

  const { invalidate: invalidateTableIndexAdvisor } = useTableIndexAdvisor()

  const preset = QUERY_PERFORMANCE_PRESET_MAP[urlPreset as QUERY_PERFORMANCE_REPORT_TYPES]
  const orderBy = !!sort ? ({ column: sort, order } as QueryPerformanceSort) : undefined
  const roles = router?.query?.roles ?? []

  const queryPerformanceQuery = useQueryPerformanceQuery({
    searchQuery,
    orderBy,
    preset,
    roles: typeof roles === 'string' ? [roles] : roles,
    runIndexAdvisor: isIndexAdvisorEnabled,
  })

  return useCallback(() => {
    queryPerformanceQuery.runQuery()
    queryClient.invalidateQueries({
      queryKey: databaseKeys.indexAdvisorFromQuery(project?.ref, ''),
    })
    queryClient.invalidateQueries({ queryKey: databaseIndexesKeys.list(project?.ref) })

    invalidateTableIndexAdvisor()
  }, [queryPerformanceQuery, queryClient, project?.ref, invalidateTableIndexAdvisor])
}
