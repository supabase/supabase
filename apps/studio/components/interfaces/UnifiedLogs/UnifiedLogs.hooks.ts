import type { ColumnFiltersState } from '@tanstack/react-table'
import { useDebounce } from 'common'
import { useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef } from 'react'

import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import type { QuerySearchParamsType } from './UnifiedLogs.types'
import { useUnifiedLogsChartQuery } from '@/data/logs/unified-logs-chart-query'
import { useUnifiedLogsCountQuery } from '@/data/logs/unified-logs-count-query'
import { useUnifiedLogsInfiniteQuery } from '@/data/logs/unified-logs-infinite-query'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

/**
 * The three queries every unified-logs surface needs (rows, sidebar counts,
 * timeline chart) plus the flattened + de-duplicated row list. Shared by the
 * Logs page and the embedded, worker-scoped logs tab.
 */
export const useUnifiedLogsData = ({
  projectRef,
  search,
}: {
  projectRef?: string
  search: QuerySearchParamsType
}) => {
  const logs = useUnifiedLogsInfiniteQuery({ projectRef, search })
  const counts = useUnifiedLogsCountQuery({ projectRef, search })
  const chart = useUnifiedLogsChartQuery({ projectRef, search })

  const rawFlatData = useMemo(() => {
    return logs.data?.pages?.flatMap((page) => page.data ?? []) ?? []
  }, [logs.data?.pages])
  // [Joshen] Refer to unified-logs-infinite-query on why the need to dedupe
  const flatData = useMemo(() => {
    return rawFlatData.filter((value, idx) => {
      return idx === rawFlatData.findIndex((x) => x.id === value.id)
    })
  }, [rawFlatData])

  const refetchAll = () => {
    logs.refetch()
    counts.refetch()
    chart.refetch()
  }

  return {
    flatData,
    error: logs.error,
    isError: logs.isError,
    isLoading: logs.isLoading,
    isFetching: logs.isFetching,
    isFetchingNextPage: logs.isFetchingNextPage,
    isFetchingPreviousPage: logs.isFetchingPreviousPage,
    hasNextPage: logs.hasNextPage,
    fetchNextPage: logs.fetchNextPage,
    fetchPreviousPage: logs.fetchPreviousPage,
    totalRowCount: counts.data?.totalRowCount,
    facets: counts.data?.facets,
    isLoadingCounts: counts.isPending,
    chartData: chart.data ?? [],
    isFetchingChart: chart.isFetching,
    refetchAll,
    isRefetching: logs.isFetching || counts.isFetching || chart.isFetching,
  }
}

export const useFilterSearchSync = ({
  applyFilterSearch,
  columnFilters,
  enabled,
}: {
  applyFilterSearch: () => void
  columnFilters: ColumnFiltersState
  enabled: boolean
}) => {
  const debouncedApplyFilterSearch = useDebounce(applyFilterSearch, 250)

  useEffect(() => {
    if (!enabled) return

    debouncedApplyFilterSearch()
    return () => debouncedApplyFilterSearch.cancel()
  }, [columnFilters, debouncedApplyFilterSearch, enabled])
}

export const useResetFocus = () => {
  useShortcut(SHORTCUT_IDS.UNIFIED_LOGS_RESET_FOCUS, () => {
    // FIXME: some dedicated div[tabindex="0"] do not auto-unblur (e.g. the DataTableFilterResetButton)
    // REMINDER: we cannot just document.activeElement?.blur(); as the next tab will focus the next element in line,
    // which is not what we want. We want to reset entirely.
    document.body.setAttribute('tabindex', '0')
    document.body.focus()
    document.body.removeAttribute('tabindex')
  })
}

export const useLiveMode = <TData extends { date: Date }>(data: TData[]) => {
  const [live] = useQueryState('live', SEARCH_PARAMS_PARSER.live)
  // REMINDER: used to capture the live mode on timestamp
  const liveTimestamp = useRef<number | undefined>(live ? new Date().getTime() : undefined)

  useEffect(() => {
    if (live) liveTimestamp.current = new Date().getTime()
    else liveTimestamp.current = undefined
  }, [live])

  const anchorRow = useMemo(() => {
    if (!live) return undefined

    const item = data.find((item) => {
      // return first item that is there if not liveTimestamp
      if (!liveTimestamp.current) return true
      // return first item that is after the liveTimestamp
      if (item.date.getTime() > liveTimestamp.current) return false
      return true
      // return first item if no liveTimestamp
    })

    return item
  }, [live, data])

  return { row: anchorRow, timestamp: liveTimestamp.current }
}
