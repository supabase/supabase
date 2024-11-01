import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { authKeys } from './keys'
import { getUsersSQL, User } from './users-infinite-query'

type Filter = 'verified' | 'unverified' | 'anonymous'

export type UsersVariables = {
  projectRef?: string
  connectionString?: string
  page?: number
  keywords?: string
  filter?: Filter
}

export const USERS_PAGE_LIMIT = 20

export type UsersData = { result: User[] }
export type UsersError = ResponseError

export const useUsersQuery = <TData = UsersData>(
  { projectRef, page, keywords, filter, connectionString }: UsersVariables,
  { enabled = true, ...options }: UseQueryOptions<UsersData, UsersError, TData> = {}
) =>
  useQuery<UsersData, UsersError, TData>(
    authKeys.users(projectRef, { page, keywords, filter }),
    ({ signal }) =>
      executeSql(
        {
          projectRef,
          connectionString,
          sql: getUsersSQL({
            page: page ?? 0,
            verified: filter,
            keywords,
            sort: 'created_at',
            order: 'desc',
          }),
          queryKey: authKeys.users(projectRef),
        },
        signal
      ),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
