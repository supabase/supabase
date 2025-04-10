'use client'

import { createClient } from '@/registry/default/fixtures/lib/supabase/client'
import { PostgrestQueryBuilder } from '@supabase/postgrest-js'
import { SupabaseClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'

const supabase = createClient()

// The following types are used to make the hook type-safe. It extracts the database type from the supabase client.
type SupabaseClientType = typeof supabase

// Utility type to check if the type is any
type IfAny<T, Y, N> = 0 extends 1 & T ? Y : N

// Extracts the database type from the supabase client. If the supabase client doesn't have a type, it fallback properly.
type Database =
  SupabaseClientType extends SupabaseClient<infer U>
    ? IfAny<
        U,
        {
          public: {
            Tables: Record<string, any>
            Views: Record<string, any>
            Functions: Record<string, any>
          }
        },
        U
      >
    : never

// Change this to the database schema you want to use
type DatabaseSchema = Database['public']

// Extracts the table names from the database type
type SupabaseTableName = keyof DatabaseSchema['Tables']

// Extracts the table definition from the database type
type SupabaseTableData<T extends SupabaseTableName> = DatabaseSchema['Tables'][T]['Row']

type SupabaseSelectBuilder<T extends SupabaseTableName> = ReturnType<
  PostgrestQueryBuilder<DatabaseSchema, DatabaseSchema['Tables'][T], T>['select']
>

// A function that modifies the query. Can be used to sort, filter, etc. If .range is used, it will be overwritten.
type SupabaseQueryHandler<T extends SupabaseTableName> = (
  query: SupabaseSelectBuilder<T>
) => SupabaseSelectBuilder<T>

interface UseInfiniteQueryProps<T extends SupabaseTableName, Query extends string = '*'> {
  // The table name to query
  tableName: T
  // The columns to select, defaults to `*`
  columns?: string
  // The number of items to fetch per page, defaults to `20`
  pageSize?: number
  // A function that modifies the query. Can be used to sort, filter, etc. If .range is used, it will be overwritten.
  trailingQuery?: SupabaseQueryHandler<T>
}

//
function useInfiniteQuery<
  TData extends SupabaseTableData<T>,
  T extends SupabaseTableName = SupabaseTableName,
>({ tableName, columns = '*', pageSize = 20, trailingQuery }: UseInfiniteQueryProps<T>) {
  const [data, setData] = useState<TData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [hasInitialFetch, setHasInitialFetch] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [count, setCount] = useState<number>(0)
  const [isFetching, setIsFetching] = useState(false)
  const hasMore = count && count > data.length

  const fetchPage = useCallback(
    async (skip: number) => {
      if (hasInitialFetch && (isFetching || !hasMore)) return

      setIsFetching(true)
      try {
        let query = supabase
          .from(tableName)
          .select(columns, { count: 'exact' }) as unknown as SupabaseSelectBuilder<T>

        // Apply filters if trailingQuery is provided
        if (trailingQuery) {
          query = trailingQuery(query)
        }

        const { data: newData, count } = await query.range(skip, skip + pageSize - 1).throwOnError()

        if (count) {
          setCount(count)
        }

        if (newData) {
          setData((prevData) => [...prevData, ...newData] as TData[])
        }

        setIsSuccess(true)
      } catch (error: any) {
        console.error('An unexpected error occurred:', error)
        setError(error)
      } finally {
        setIsFetching(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableName, columns, pageSize, hasMore]
  )

  const fetchNextPage = useCallback(async () => {
    fetchPage(data.length)
  }, [data.length, fetchPage])

  useEffect(() => {
    setIsSuccess(false)

    setIsLoading(true)
    // Reset state when props change significantly
    setData([])
    // Fetch initial data
    fetchNextPage()

    setIsLoading(false)
    setHasInitialFetch(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, columns, pageSize])

  return { data, isSuccess, isLoading, isFetching, error, hasMore, fetchNextPage, count }
}

export {
  useInfiniteQuery,
  type SupabaseQueryHandler,
  type SupabaseTableData,
  type SupabaseTableName,
  type UseInfiniteQueryProps,
}
