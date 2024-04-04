import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

export type UsersVariables = {
  projectRef?: string
  connectionString?: string
  page?: number
  keywords?: string
  filter?: 'verified' | 'unverified' | 'anonymous'
}

export const USERS_PAGE_LIMIT = 10
export type User = components['schemas']['UserBody']

export async function getUsers(
  { projectRef, page = 1, keywords = '', filter, connectionString }: UsersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const limit = USERS_PAGE_LIMIT
  const offset = (page - 1) * 10
  const query: { limit: string; offset: string; keywords: string; verified?: string } = {
    limit: limit.toString(),
    offset: offset.toString(),
    keywords,
  }

  if (filter === 'anonymous') {
    const data = await getAnonUsers({ projectRef, page, signal, connectionString })
    return data
  }

  if (filter === 'verified') query.verified = 'verified'

  const { data, error } = await get(`/platform/auth/{ref}/users`, {
    params: {
      path: { ref: projectRef },
      query: query as any,
    },
    signal,
  })

  if (error) throw handleError(error)
  return data
}

export async function getAnonUsers({
  projectRef,
  connectionString,
  page = 1,
}: {
  projectRef: string
  connectionString?: string
  page?: number
  signal?: AbortSignal
}) {
  const limit = USERS_PAGE_LIMIT
  const offset = (page - 1) * 10

  const res = await executeSql({
    projectRef,
    connectionString,
    sql: `SELECT * FROM auth.users WHERE is_anonymous IS true LIMIT ${limit} OFFSET ${offset}`,
  })

  return {
    total: res.result.length,
    users: res.result as components['schemas']['UserBody'][],
  }
}

export type UsersData = Awaited<ReturnType<typeof getUsers>>
export type UsersError = ResponseError

export const useUsersQuery = <TData = UsersData>(
  { projectRef, page, keywords, filter, connectionString }: UsersVariables,
  { enabled = true, ...options }: UseQueryOptions<UsersData, UsersError, TData> = {}
) =>
  useQuery<UsersData, UsersError, TData>(
    authKeys.users(projectRef, { page, keywords, filter }),
    ({ signal }) =>
      getUsers(
        {
          projectRef,
          page,
          keywords,
          filter,
          connectionString,
        },
        signal
      ),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
