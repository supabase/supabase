import { getPaginatedUsersSQL } from '@supabase/pg-meta/src/sql/studio/get-users-paginated'
import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
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

  column?: 'id' | 'email' | 'phone'
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
  { enabled = true, ...options }: UseInfiniteQueryOptions<UsersData, UsersError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useInfiniteQuery<UsersData, UsersError, TData>(
    authKeys.usersInfinite(projectRef, { keywords, filter, providers, sort, order }),
    ({ signal, pageParam }) => {
      return executeSql(
        {
          projectRef,
          connectionString,
          sql: getPaginatedUsersSQL({
            page: column ? undefined : pageParam,
            verified: filter,
            keywords,
            providers,
            sort: sort ?? 'id',
            order: order ?? 'asc',
            limit: USERS_PAGE_LIMIT,
            column,
            startAt: column ? pageParam : undefined,
          }),
          queryKey: authKeys.usersInfinite(projectRef),
        },
        signal
      )
    },
    {
      enabled: enabled && typeof projectRef !== 'undefined' && isActive,
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
    }
  )
}
