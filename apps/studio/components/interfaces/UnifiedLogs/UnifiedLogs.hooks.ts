import { useInfiniteQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useQueryState, useQueryStates } from 'nuqs'
import { useEffect, useMemo, useRef } from 'react'
import SuperJSON from 'superjson'

import { useHotKey } from 'hooks/ui/useHotKey'
import { createApiQueryString } from './QueryOptions'
import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import {
  InfiniteQueryResponse,
  PageParam,
  UnifiedLogSchema,
  UnifiedLogsMeta,
} from './UnifiedLogs.types'

export const useResetFocus = () => {
  useHotKey(() => {
    // FIXME: some dedicated div[tabindex="0"] do not auto-unblur (e.g. the DataTableFilterResetButton)
    // REMINDER: we cannot just document.activeElement?.blur(); as the next tab will focus the next element in line,
    // which is not what we want. We want to reset entirely.
    document.body.setAttribute('tabindex', '0')
    document.body.focus()
    document.body.removeAttribute('tabindex')
  }, '.')
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

// [Joshen] This isn't currently being used - check if can deprecate
export function useUnifiedLogs() {
  // Get project ref from URL params
  const { ref: projectRef } = useParams<{ ref: string }>()

  // Use your existing search params
  const [search, setSearch] = useQueryStates(SEARCH_PARAMS_PARSER)

  // Add log_type to search params if needed
  const queryParams = useMemo(() => {
    return {
      ...search,
      // Add any unified logs specific params
    }
  }, [search])

  // Create the query
  // @ts-ignore
  const result = useInfiniteQuery({
    queryKey: ['unified-logs', projectRef, JSON.stringify(queryParams)],
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam?.cursor ? new Date(pageParam.cursor) : undefined
      const direction = pageParam?.direction

      // Construct API params
      const apiParams = {
        ...queryParams,
        uuid: null, // Explicitly remove for API call
        live: null, // Explicitly remove for API call
        ...(cursor && { cursor }),
        ...(direction && { direction }),
      }

      // Define endpoint for unified logs
      const endpoint = `/api/projects/${projectRef}/logs/unified`
      const queryString = createApiQueryString(apiParams)

      const response = await fetch(`${endpoint}${queryString}`)

      if (!response.ok) {
        throw new Error('Failed to fetch unified logs')
      }

      const jsonString = await response.text()
      return SuperJSON.parse<InfiniteQueryResponse<UnifiedLogSchema[], UnifiedLogsMeta>>(jsonString)
    },
    initialPageParam: { cursor: new Date().getTime(), direction: 'next' } as PageParam,
    getPreviousPageParam: (firstPage) => {
      if (!firstPage.prevCursor) return null
      return { cursor: firstPage.prevCursor, direction: 'prev' } as PageParam
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.nextCursor) return null
      return { cursor: lastPage.nextCursor, direction: 'next' } as PageParam
    },
    refetchOnWindowFocus: false,
  })

  // Helper functions for the unified logs
  const addLogTypeFilter = (logType: UnifiedLogSchema['log_type']) => {
    const currentLogTypes = search.log_type || []
    setSearch({
      log_type: [...currentLogTypes, logType],
    })
  }

  const removeLogTypeFilter = (logType: UnifiedLogSchema['log_type']) => {
    const currentLogTypes = search.log_type || []
    setSearch({
      log_type: currentLogTypes.filter((type) => type !== logType),
    })
  }

  // Return query results and helper functions
  return {
    ...result,
    addLogTypeFilter,
    removeLogTypeFilter,
  }
}
