import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { organizationKeys } from './keys'
import { UseCustomQueryOptions } from 'types'

export type MemberWithFreeProjectLimit = components['schemas']['MemberWithFreeProjectLimit']

export type FreeProjectLimitCheckVariables = {
  slug?: string
}

export async function getFreeProjectLimitCheck(
  { slug }: FreeProjectLimitCheckVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/members/reached-free-project-limit',
    {
      params: { path: { slug } },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

export type FreeProjectLimitCheckData = Awaited<ReturnType<typeof getFreeProjectLimitCheck>>
export type FreeProjectLimitCheckError = unknown

export const useFreeProjectLimitCheckQuery = <TData = FreeProjectLimitCheckData>(
  { slug }: FreeProjectLimitCheckVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<FreeProjectLimitCheckData, FreeProjectLimitCheckError, TData> = {}
) =>
  useQuery<FreeProjectLimitCheckData, FreeProjectLimitCheckError, TData>({
    queryKey: organizationKeys.freeProjectLimitCheck(slug),
    queryFn: ({ signal }) => getFreeProjectLimitCheck({ slug }, signal),
    enabled: enabled && typeof slug !== 'undefined',
    ...options,
  })
