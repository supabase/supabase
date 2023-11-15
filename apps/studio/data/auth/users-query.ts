import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { authKeys } from './keys'
import { components } from 'data/api'

export type UsersVariables = {
  projectRef?: string
  page?: number
  keywords?: string
  verified?: 'verified' | 'unverified'
}

export const USERS_PAGE_LIMIT = 10
export type User = components['schemas']['UserBody']

export async function getUsers(
  { projectRef, page = 1, keywords = '', verified }: UsersVariables,
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
  if (verified) query.verified = verified

  const { data, error } = await get(`/platform/auth/{ref}/users`, {
    params: {
      path: { ref: projectRef },
      query: query as any,
    },
    signal,
  })

  if (error) throw error
  return data
}

export type UsersData = Awaited<ReturnType<typeof getUsers>>
export type UsersError = ResponseError

export const useUsersQuery = <TData = UsersData>(
  { projectRef, page, keywords, verified }: UsersVariables,
  { enabled = true, ...options }: UseQueryOptions<UsersData, UsersError, TData> = {}
) =>
  useQuery<UsersData, UsersError, TData>(
    authKeys.users(projectRef, { page, keywords, verified }),
    ({ signal }) => getUsers({ projectRef, page, keywords, verified }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
