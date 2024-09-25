import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { authKeys } from './keys'
import { ResponseError } from 'types'

type Filter = 'verified' | 'unverified' | 'anonymous'

export type UsersVariables = {
  projectRef?: string
  page?: number
  keywords?: string
  filter?: Filter
  providers?: string[]
  sort?: 'created_at' | 'email' | 'phone'
  order?: 'asc' | 'desc'
}

type UsersQuery = {
  limit: string
  offset: string
  keywords: string
  verified?: Filter
  providers?: string[]
  sort?: 'created_at' | 'email' | 'phone'
  order?: 'asc' | 'desc'
}

export const USERS_PAGE_LIMIT = 20
export type User = components['schemas']['UserBody']

export async function getUsers(
  {
    projectRef,
    page = 0,
    keywords = '',
    filter,
    providers = [],
    sort = 'created_at',
    order = 'desc',
  }: UsersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const limit = USERS_PAGE_LIMIT
  const offset = page * USERS_PAGE_LIMIT
  const query: UsersQuery = {
    limit: limit.toString(),
    offset: offset.toString(),
    keywords,
    sort,
    order,
  }

  if (filter) query.verified = filter
  if (providers.length > 0) query.providers = providers

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

export const useUsersInfiniteQuery = <TData = UsersData>(
  { projectRef, keywords, filter, providers, sort, order }: UsersVariables,
  { enabled = true, ...options }: UseInfiniteQueryOptions<UsersData, UsersError, TData> = {}
) =>
  useInfiniteQuery<UsersData, UsersError, TData>(
    authKeys.usersInfinite(projectRef, { keywords, filter, providers, sort, order }),
    ({ signal, pageParam }) =>
      getUsers({ projectRef, keywords, filter, providers, sort, order, page: pageParam }, signal),
    {
      staleTime: 0,
      enabled: enabled && typeof projectRef !== 'undefined',

      getNextPageParam(lastPage, pages) {
        const page = pages.length
        const currentTotalCount = page * USERS_PAGE_LIMIT
        const totalCount = lastPage.total

        if (currentTotalCount >= totalCount) {
          return undefined
        }

        return page
      },
      ...options,
    }
  )
