'use client'

import { createClient } from '@/registry/default/clients/nextjs/lib/supabase/client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { type PostgrestFilterBuilder as PFB } from '@supabase/postgrest-js'

// Create a more flexible type alias that works with multiple versions
export type SupabaseFilterBuilder = PFB<any, any, any, any, any> | PFB<any, any, any>

interface UseInfiniteQueryProps<TData> {
  tableName: string
  selectQuery?: string
  pageSize?: number
  filterBuilder?: (query: SupabaseFilterBuilder) => SupabaseFilterBuilder
}

export function useInfiniteQuery<TData>({
  tableName,
  selectQuery = '*',
  pageSize = 10,
  filterBuilder,
}: UseInfiniteQueryProps<TData>) {
  const supabase = createClient()
  const [data, setData] = useState<TData[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const isFetching = useRef(false)

  const fetchNextPage = useCallback(async () => {
    if (isFetching.current || !hasMore) return

    isFetching.current = true
    setLoading(true)

    try {
      let query = supabase.from(tableName).select(selectQuery, { count: 'exact' })

      // Apply filters if filterBuilder is provided
      if (filterBuilder) {
        query = filterBuilder(query as unknown as SupabaseFilterBuilder) as any
      }

      const { data: newData, error, count } = await query.range(offset, offset + pageSize - 1)

      if (error) {
        console.error('Error fetching data:', error)
        setHasMore(false) // Stop fetching on error
        return
      }

      if (newData) {
        // The Supabase client might return an error object within the data array on failure for specific rows,
        // filter those out and ensure the resulting array matches TData[].
        const validData = newData.filter(
          (item) => typeof item === 'object' && item !== null && !('error' in item)
        ) as TData[]
        setData((prevData) => [...prevData, ...validData] as TData[])
        const currentTotalFetched = offset + validData.length // Use validData length
        setOffset(currentTotalFetched)
        // Check if the *fetched* batch size was less than requested, indicating the end
        setHasMore(validData.length === pageSize)
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error)
      setHasMore(false) // Stop fetching on unexpected errors
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }, [tableName, selectQuery, pageSize, offset, hasMore, supabase, filterBuilder])

  // Initial fetch
  useEffect(() => {
    // Reset state when props change significantly
    setData([])
    setOffset(0)
    setHasMore(true)
    // Fetch initial data
    fetchNextPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, selectQuery, pageSize, filterBuilder]) // Re-fetch when core props change

  return { data, loading, hasMore, fetchNextPage }
}
