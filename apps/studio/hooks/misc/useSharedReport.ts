import { useState } from 'react'
import { useParams } from 'common'
import { isEqual } from 'lodash'

import { ReportFilterItem } from 'components/interfaces/Reports/Reports.types'
import {
  useRefreshSharedAPIReport,
  useSharedAPIReport,
} from 'components/interfaces/Reports/SharedAPIReport/SharedAPIReport.constants'

type UseSharedReportProps = {
  filterBy: 'auth' | 'realtime' | 'storage' | 'graphql' | 'functions' | 'postgrest'
  start: string
  end: string
}

export const useSharedReport = ({ filterBy, start, end }: UseSharedReportProps) => {
  const { ref } = useParams() as { ref: string }
  const [filters, setFilters] = useState<ReportFilterItem[]>([])
  const { refetch, isRefetching } = useRefreshSharedAPIReport()

  const filterByMapSource = {
    functions: 'function_edge_logs',
    realtime: 'edge_logs',
    storage: 'edge_logs',
    graphql: 'edge_logs',
    postgrest: 'edge_logs',
    auth: 'edge_logs',
  }

  const filterByMapValue = {
    functions: '/functions',
    realtime: '/realtime',
    storage: '/storage',
    graphql: '/graphql',
    postgrest: '/rest',
    auth: '/auth',
  }

  const baseFilter = {
    key: 'request.path',
    value: filterByMapValue[filterBy],
    compare: 'matches' as const,
  }

  const allFilters = [baseFilter, ...filters]

  const { data, error, isLoading } = useSharedAPIReport({
    src: filterByMapSource[filterBy],
    filters: allFilters,
    start,
    end,
    projectRef: ref,
    enabled: !!ref && !!filterBy,
  })

  const addFilter = (filter: ReportFilterItem) => {
    if (isEqual(filter, baseFilter)) return
    if (filters.some((f) => isEqual(f, filter))) return
    setFilters((prev) =>
      [...prev, filter].sort((a, b) => {
        const keyA = a.key.toLowerCase()
        const keyB = b.key.toLowerCase()
        if (keyA < keyB) {
          return -1
        }
        if (keyA > keyB) {
          return 1
        }
        return 0
      })
    )
  }

  const removeFilters = (toRemove: ReportFilterItem[]) => {
    setFilters((prev) => prev.filter((f) => !toRemove.find((r) => isEqual(f, r))))
  }

  const isLoadingData = Object.values(isLoading).some(Boolean)

  return {
    data,
    error,
    isLoading,
    refetch,
    isRefetching,
    filters,
    addFilter,
    removeFilters,
    isLoadingData,
  }
}
