import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

type Filter = 'verified' | 'unverified' | 'anonymous'

export type UsersVariables = {
  projectRef?: string
  connectionString?: string
  page?: number
  keywords?: string
  filter?: Filter
}

export const USERS_PAGE_LIMIT = 10
export type User = components['schemas']['UserBody']

export async function getUsers(
  { projectRef, page = 1, keywords = '', filter }: UsersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const limit = USERS_PAGE_LIMIT
  const offset = (page - 1) * 10
  const query: {
    limit: string
    offset: string
    keywords: string
    verified?: Filter
  } = {
    limit: limit.toString(),
    offset: offset.toString(),
    keywords,
  }

  if (filter) {
    query.verified = filter
  }

  const { data, error } = await get(`/platform/auth/{ref}/users`, {
    params: {
      path: { ref: projectRef },
      query: query as any,
    },
    signal,
  })

  if (error) handleError(error)
  return data
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
