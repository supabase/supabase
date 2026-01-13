import type { OptimizedSearchColumns } from '@supabase/pg-meta/src/sql/studio/get-users-types'
import { getUsersCountSQL } from '@supabase/pg-meta/src/sql/studio/get-users-count'
import { useQuery } from '@tanstack/react-query'

import { executeSql, type ExecuteSqlError } from 'data/sql/execute-sql-query'
import { UseCustomQueryOptions } from 'types'
import { authKeys } from './keys'
import { type Filter } from './users-infinite-query'

type UsersCountVariables = {
  projectRef?: string
  connectionString?: string | null
  keywords?: string
  filter?: Filter
  providers?: string[]
  forceExactCount?: boolean

  /** If set, uses optimized prefix search for the specified column */
  column?: OptimizedSearchColumns
}

export async function getUsersCount(
  {
    projectRef,
    connectionString,
    keywords,
    filter,
    providers,
    forceExactCount,
    column,
  }: UsersCountVariables,
  signal?: AbortSignal
) {
  const sql = getUsersCountSQL({ filter, keywords, providers, forceExactCount, column })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['users-count'],
    },
    signal
  )

  const count = result?.[0]?.count
  const isEstimate = result?.[0]?.is_estimate

  if (typeof count !== 'number') {
    throw new Error('Error fetching users count')
  }

  return {
    count,
    is_estimate: isEstimate ?? true,
  }
}

export type UsersCountData = Awaited<ReturnType<typeof getUsersCount>>
export type UsersCountError = ExecuteSqlError

/** [Joshen] Be wary of using this as it could potentially cause a huge load on the user's DB */
export const useUsersCountQuery = <TData = UsersCountData>(
  {
    projectRef,
    connectionString,
    keywords,
    filter,
    providers,
    forceExactCount,
    column,
  }: UsersCountVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<UsersCountData, UsersCountError, TData> = {}
) =>
  useQuery<UsersCountData, UsersCountError, TData>({
    queryKey: authKeys.usersCount(projectRef, {
      keywords,
      filter,
      providers,
      forceExactCount,
      column,
    }),
    queryFn: ({ signal }) =>
      getUsersCount(
        {
          projectRef,
          connectionString,
          keywords,
          filter,
          providers,
          forceExactCount,
          column,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
