import { getUsersCountSQL } from '@supabase/pg-meta/src/sql/studio/get-users-count'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { executeSql, type ExecuteSqlError } from 'data/sql/execute-sql-query'
import { authKeys } from './keys'
import { type Filter } from './users-infinite-query'

type UsersCountVariables = {
  projectRef?: string
  connectionString?: string | null
  keywords?: string
  filter?: Filter
  providers?: string[]
  forceExactCount?: boolean
}

export async function getUsersCount(
  {
    projectRef,
    connectionString,
    keywords,
    filter,
    providers,
    forceExactCount,
  }: UsersCountVariables,
  signal?: AbortSignal
) {
  const sql = getUsersCountSQL({ filter, keywords, providers, forceExactCount })

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
  }: UsersCountVariables,
  { enabled = true, ...options }: UseQueryOptions<UsersCountData, UsersCountError, TData> = {}
) =>
  useQuery<UsersCountData, UsersCountError, TData>(
    authKeys.usersCount(projectRef, {
      keywords,
      filter,
      providers,
      forceExactCount,
    }),
    ({ signal }) =>
      getUsersCount(
        {
          projectRef,
          connectionString,
          keywords,
          filter,
          providers,
          forceExactCount,
        },
        signal
      ),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
