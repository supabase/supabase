import { getPaginatedUsersSQL } from '@supabase/pg-meta/src/sql/studio/get-users-paginated'
import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'

import { OptimizedSearchColumns } from '@supabase/pg-meta/src/sql/studio/get-users-types'
import type { components } from 'data/api'
import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { UseCustomInfiniteQueryOptions } from 'types'
import { authKeys } from './keys'

const USERS_PAGE_LIMIT = 50
type UsersData = { result: User[] }
type UsersError = ExecuteSqlError
type UsersVariables = {
  projectRef?: string
  connectionString?: string | null
  page?: number
  keywords?: string
  filter?: Filter
  providers?: string[]
  sort?: 'id' | 'created_at' | 'email' | 'phone' | 'last_sign_in_at'
  order?: 'asc' | 'desc'
  /** If set, uses optimized prefix search for the specified column */
  column?: OptimizedSearchColumns
  startAt?: string
}

export type Filter = 'verified' | 'unverified' | 'anonymous'
export type User = components['schemas']['UserBody'] & { providers: readonly string[] }

export const useUsersInfiniteQuery = <TData = UsersData>(
  {
    projectRef,
    connectionString,
    keywords,
    filter,
    providers,
    sort,
    order,
    column,
  }: UsersVariables,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    UsersData,
    UsersError,
    InfiniteData<TData>,
    readonly unknown[],
    string | number | undefined
  > = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useInfiniteQuery({
    queryKey: authKeys.usersInfinite(projectRef, {
      keywords,
      filter,
      providers,
      sort,
      order,
      column,
    }),
    queryFn: ({ signal, pageParam }) => {
      return executeSql(
        {
          projectRef,
          connectionString,
          sql: getPaginatedUsersSQL({
            page: column ? undefined : (pageParam as number),
            verified: filter,
            keywords,
            providers,
            sort: sort ?? 'id',
            order: order ?? 'asc',
            limit: USERS_PAGE_LIMIT,
            column,
            startAt: column ? (pageParam as string) : undefined,
          }),
        },
        signal
      )
    },
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    initialPageParam: undefined,
    getNextPageParam(lastPage, pages) {
      const hasNextPage = lastPage.result.length >= USERS_PAGE_LIMIT
      if (column) {
        const lastItem = lastPage.result[lastPage.result.length - 1]
        if (hasNextPage && lastItem) return lastItem[column]
        return undefined
      } else {
        const page = pages.length
        if (!hasNextPage) return undefined
        return page
      }
    },
    ...options,
  })
}
