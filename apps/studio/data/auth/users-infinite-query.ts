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
}

export const USERS_PAGE_LIMIT = 20
export type User = components['schemas']['UserBody']

export async function getUsers(
  { projectRef, page = 0, keywords = '', filter }: UsersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const limit = USERS_PAGE_LIMIT
  const offset = page * USERS_PAGE_LIMIT
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

export const useUsersInfiniteQuery = <TData = UsersData>(
  { projectRef, keywords, filter }: UsersVariables,
  { enabled = true, ...options }: UseInfiniteQueryOptions<UsersData, UsersError, TData> = {}
) =>
  useInfiniteQuery<UsersData, UsersError, TData>(
    authKeys.usersInfinite(projectRef, { keywords, filter }),
    ({ signal, pageParam }) => getUsers({ projectRef, keywords, filter, page: pageParam }, signal),
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
