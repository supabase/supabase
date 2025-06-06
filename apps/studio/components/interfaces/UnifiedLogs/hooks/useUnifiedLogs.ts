// apps/studio/components/interfaces/logs-new/hooks/useUnifiedLogs.ts

import { useInfiniteQuery } from '@tanstack/react-query'
import SuperJSON from 'superjson'
import { useMemo } from 'react'
import { useQueryStates } from 'nuqs'
import { searchParamsParser } from '../search-params'
import {
  ARRAY_DELIMITER,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
  SORT_DELIMITER,
} from 'components/interfaces/DataTableDemo/lib/delimiters'
import { useParams } from 'next/navigation'
import { InfiniteQueryResponse } from '../query-options'

// Define your unified logs schema type here
export type UnifiedLogSchema = {
  id: string
  timestamp: Date
  log_type:
    | 'edge'
    | 'postgres'
    | 'function logs'
    | 'edge function'
    | 'auth'
    | 'supavisor'
    | 'postgres upgrade'
  code: string
  level: string
  path: string | null
  event_message: string
  method: string
  api_role: string
  auth_user: string | null
}

export type UnifiedLogsMeta = {
  // Add any specific metadata for unified logs
  logTypeCounts: Record<UnifiedLogSchema['log_type'], number>
}

// Define PageParam type for TypeScript clarity
type PageParam = { cursor: number; direction: 'next' | 'prev' }

export function useUnifiedLogs() {
  // Get project ref from URL params
  const { ref: projectRef } = useParams<{ ref: string }>()

  // Use your existing search params
  const [search, setSearch] = useQueryStates(searchParamsParser)

  // Add log_type to search params if needed
  const queryParams = useMemo(() => {
    return {
      ...search,
      // Add any unified logs specific params
    }
  }, [search])

  // Create the query
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

// Helper function to create API query string - complete implementation
function createApiQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue

    if (key === 'date' && Array.isArray(value) && value.length === 2) {
      queryParams.set('dateStart', value[0].getTime().toString())
      queryParams.set('dateEnd', value[1].getTime().toString())
    } else if (
      [
        'latency',
        'timing.dns',
        'timing.connection',
        'timing.tls',
        'timing.ttfb',
        'timing.transfer',
        'status',
      ].includes(key) &&
      Array.isArray(value) &&
      value.length > 0
    ) {
      if (value.length >= 2) {
        queryParams.set(`${key}Start`, value[0].toString())
        queryParams.set(`${key}End`, value[value.length - 1].toString())
      }
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        queryParams.set(key, value.join(ARRAY_DELIMITER))
      }
    } else if (key === 'sort' && typeof value === 'object' && value !== null) {
      queryParams.set(key, `${value.id}${SORT_DELIMITER}${value.desc ? 'desc' : 'asc'}`)
    } else if (value instanceof Date) {
      queryParams.set(key, value.getTime().toString())
    } else {
      queryParams.set(key, String(value))
    }
  }

  const queryString = queryParams.toString()
  return queryString ? `?${queryString}` : ''
}
