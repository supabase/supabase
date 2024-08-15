import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { organizationKeys } from './keys'

export type MemberWithFreeProjectLimit = {
  free_project_limit: number
  primary_email: string
  username: string
}

export type FreeProjectLimitCheckVariables = {
  slug?: string
}

export type FreeProjectLimitCheckResponse = MemberWithFreeProjectLimit[]

export async function getFreeProjectLimitCheck(
  { slug }: FreeProjectLimitCheckVariables,
  signal?: AbortSignal
) {
  if (!slug) {
    throw new Error('slug is required')
  }

  const response = await get(
    `${API_URL}/organizations/${slug}/members/reached-free-project-limit`,
    {
      signal,
    }
  )
  if (response.error) {
    throw response.error
  }

  return response as FreeProjectLimitCheckResponse
}

export type FreeProjectLimitCheckData = Awaited<ReturnType<typeof getFreeProjectLimitCheck>>
export type FreeProjectLimitCheckError = unknown

export const useFreeProjectLimitCheckQuery = <TData = FreeProjectLimitCheckData>(
  { slug }: FreeProjectLimitCheckVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<FreeProjectLimitCheckData, FreeProjectLimitCheckError, TData> = {}
) =>
  useQuery<FreeProjectLimitCheckData, FreeProjectLimitCheckError, TData>(
    organizationKeys.freeProjectLimitCheck(slug),
    ({ signal }) => getFreeProjectLimitCheck({ slug }, signal),
    {
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
