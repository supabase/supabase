import type { Percentile } from 'components/interfaces/DataTableDemo/lib/request/percentile'
// Removed keepPreviousData import as it causes persistent lint errors
// import { keepPreviousData } from '@tanstack/react-query'
import SuperJSON from 'superjson'
import type { BaseChartSchema, ColumnSchema, FacetMetadataSchema } from './UnifiedLogs.schema'
// Removed: import { searchParamsSerializer } from './search-params'
import { ARRAY_DELIMITER, SORT_DELIMITER } from 'components/interfaces/DataTableDemo/lib/delimiters'
import { SearchParamsType } from './UnifiedLogs.types'

// Restore the helper function to create query params string
const createApiQueryString = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue

    // Using logic similar to the original light version
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
      // Assuming slider or range gives min/max
      // Use the correct delimiters if necessary based on how backend expects ranges
      if (value.length === 1) {
        // Handle single value if needed, maybe just set the key?
        // queryParams.set(key, value[0].toString());
      } else if (value.length >= 2) {
        queryParams.set(`${key}Start`, value[0].toString())
        queryParams.set(`${key}End`, value[value.length - 1].toString())
      }
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        // Use comma (ARRAY_DELIMITER) separation for arrays
        queryParams.set(key, value.join(ARRAY_DELIMITER))
      }
    } else if (key === 'sort' && typeof value === 'object' && value !== null) {
      queryParams.set(
        key,
        `${(value as { id: string; desc: boolean }).id}${SORT_DELIMITER}${(value as { id: string; desc: boolean }).desc ? 'desc' : 'asc'}`
      )
    } else if (value instanceof Date) {
      queryParams.set(key, value.getTime().toString())
    } else {
      queryParams.set(key, String(value))
    }
  }
  const queryString = queryParams.toString()
  return queryString ? `?${queryString}` : ''
}

export type LogsMeta = {
  currentPercentiles: Record<Percentile, number>
}

export type InfiniteQueryMeta<TMeta = Record<string, unknown>> = {
  totalRowCount: number
  filterRowCount: number
  chartData: BaseChartSchema[]
  facets: Record<string, FacetMetadataSchema>
  metadata?: TMeta
}

export type InfiniteQueryResponse<TData, TMeta = unknown> = {
  data: TData
  meta: InfiniteQueryMeta<TMeta>
  prevCursor: number | null
  nextCursor: number | null
}

// Define pageParam type
type PageParam = { cursor: number; direction: 'next' | 'prev' }

export const dataOptions = (search: SearchParamsType) => {
  // Create a stable query key object by removing nulls/undefined, uuid, and live
  const queryKeyParams = Object.entries(search).reduce(
    (acc, [key, value]) => {
      if (!['uuid', 'live'].includes(key) && value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, any>
  )

  // Simply return the options object
  return {
    queryKey: [
      'data-table',
      // Use JSON.stringify for a stable key representation
      JSON.stringify(queryKeyParams),
    ],
    queryFn: async ({ pageParam }: { pageParam: PageParam }) => {
      // Added type for pageParam
      const cursor = pageParam?.cursor ? new Date(pageParam.cursor) : undefined
      const direction = pageParam?.direction

      // Construct params for API call, removing uuid and live
      const apiParams = {
        ...search,
        uuid: null, // Explicitly remove for API call
        live: null, // Explicitly remove for API call
        ...(cursor && { cursor }), // Add cursor if present
        ...(direction && { direction }), // Add direction if present
      }

      // Assuming the API route is /api/data-table/infinite
      const response = await fetch(`/api/data-table/infinite${createApiQueryString(apiParams)}`)

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const jsonString = await response.text()
      return SuperJSON.parse<InfiniteQueryResponse<ColumnSchema[], LogsMeta>>(jsonString)
    },
    initialPageParam: { cursor: new Date().getTime(), direction: 'next' } as PageParam,
    getPreviousPageParam: (
      firstPage: InfiniteQueryResponse<ColumnSchema[], LogsMeta>,
      _pages: InfiniteQueryResponse<ColumnSchema[], LogsMeta>[] // Added types
    ) => {
      if (!firstPage.prevCursor) return null
      return { cursor: firstPage.prevCursor, direction: 'prev' } as PageParam
    },
    getNextPageParam: (
      lastPage: InfiniteQueryResponse<ColumnSchema[], LogsMeta>,
      _pages: InfiniteQueryResponse<ColumnSchema[], LogsMeta>[] // Added types
    ) => {
      if (!lastPage.nextCursor) return null
      return { cursor: lastPage.nextCursor, direction: 'next' } as PageParam
    },
    refetchOnWindowFocus: false,
    // Removed placeholderData due to persistent lint/resolution issues
    // placeholderData: keepPreviousData,
  }
}
