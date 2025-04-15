import type { InfiniteQueryResponse } from '../infinite/query-options'
// Removed keepPreviousData import as it causes persistent lint errors
// import { keepPreviousData } from '@tanstack/react-query'
import SuperJSON from 'superjson'
import type { ColumnType } from './columns'
import type { SearchParamsType } from './search-params'
import {
  ARRAY_DELIMITER,
  RANGE_DELIMITER,
  SLIDER_DELIMITER,
  SORT_DELIMITER,
} from 'components/interfaces/DataTableDemo/lib/delimiters'

const createApiQueryString = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue

    if (key === 'timestamp' && Array.isArray(value) && value.length === 2) {
      queryParams.set('timestampStart', value[0].getTime().toString())
      queryParams.set('timestampEnd', value[1].getTime().toString())
    } else if (key === 'latency' && Array.isArray(value) && value.length > 0) {
      queryParams.set('latencyStart', value[0].toString())
      queryParams.set('latencyEnd', value[value.length - 1].toString())
    } else if (key === 'status' && Array.isArray(value) && value.length > 0) {
      queryParams.set('statusStart', value[0].toString())
      queryParams.set('statusEnd', value[value.length - 1].toString())
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        queryParams.set(key, value.join(','))
      }
    } else if (key === 'sort' && typeof value === 'object' && value !== null) {
      queryParams.set(
        key,
        `${(value as { id: string; desc: boolean }).id}.${(value as { id: string; desc: boolean }).desc ? 'desc' : 'asc'}`
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

export const dataOptions = (search: SearchParamsType) => {
  const queryKeyParams = Object.entries(search).reduce(
    (acc, [key, value]) => {
      if (key !== 'uuid' && value !== null && value !== undefined) {
        acc[key] = value
      }
      return acc
    },
    {} as Record<string, any>
  )

  type PageParam = { cursor: number; direction: 'next' | 'prev' }

  return {
    queryKey: ['data-table-light', JSON.stringify(queryKeyParams)],
    queryFn: async ({ pageParam }: { pageParam: PageParam }) => {
      const cursor = pageParam?.cursor ? new Date(pageParam.cursor) : undefined
      const direction = pageParam?.direction

      const apiParams = {
        ...search,
        ...(cursor && { cursor }),
        ...(direction && { direction }),
      }

      const queryString = createApiQueryString(apiParams)
      const response = await fetch(`/api/data-table/light${queryString}`)

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const responseText = await response.text()

      try {
        const parsedData = SuperJSON.parse<InfiniteQueryResponse<ColumnType[]>>(responseText)
        // console.log('Parsed data returned from queryFn:', parsedData)
        return parsedData
      } catch (e) {
        console.error('SuperJSON parsing failed:', e)
        console.error('Received text:', responseText)
        throw new Error('Failed to parse API response')
      }
    },
    initialPageParam: { cursor: new Date().getTime(), direction: 'next' } as PageParam,
    getNextPageParam: (
      lastPage: InfiniteQueryResponse<ColumnType[]>,
      _pages: InfiniteQueryResponse<ColumnType[]>[]
    ) => {
      if (!lastPage.nextCursor) return null
      return { cursor: lastPage.nextCursor, direction: 'next' } as PageParam
    },
    refetchOnWindowFocus: false,
    // Removed placeholderData due to persistent lint/resolution issues
    // placeholderData: keepPreviousData,
  }
}
