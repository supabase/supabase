import { useQuery } from '@tanstack/react-query'
import type { components } from 'api-types'

import { platformAppKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type PlatformAppsVariables = {
  slug?: string
}

export type PlatformApp = components['schemas']['ListPlatformAppsResponse']['apps'][number]

export async function getPlatformApps({ slug }: PlatformAppsVariables, signal?: AbortSignal) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/apps', {
    params: { path: { slug } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type PlatformAppsData = Awaited<ReturnType<typeof getPlatformApps>>
export type PlatformAppsError = ResponseError

export const usePlatformAppsQuery = <TData = PlatformAppsData>(
  { slug }: PlatformAppsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<PlatformAppsData, PlatformAppsError, TData> = {}
) =>
  useQuery<PlatformAppsData, PlatformAppsError, TData>({
    queryKey: platformAppKeys.list(slug),
    queryFn: ({ signal }) => getPlatformApps({ slug }, signal),
    enabled: enabled && typeof slug !== 'undefined',
    ...options,
  })
