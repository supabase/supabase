import { useQuery } from '@tanstack/react-query'
import type { components } from 'api-types'

import { platformAppKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type PlatformAppInstallation =
  components['schemas']['ListPlatformAppInstallationsResponse']['installations'][number]

export async function getPlatformAppInstallations(
  { slug }: { slug?: string },
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/apps/installations', {
    params: { path: { slug } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type PlatformAppInstallationsData = Awaited<ReturnType<typeof getPlatformAppInstallations>>
export type PlatformAppInstallationsError = ResponseError

export const usePlatformAppInstallationsQuery = <TData = PlatformAppInstallationsData>(
  { slug }: { slug?: string },
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<PlatformAppInstallationsData, PlatformAppInstallationsError, TData> = {}
) =>
  useQuery<PlatformAppInstallationsData, PlatformAppInstallationsError, TData>({
    queryKey: platformAppKeys.installations(slug),
    queryFn: ({ signal }) => getPlatformAppInstallations({ slug }, signal),
    enabled: enabled && typeof slug !== 'undefined',
    ...options,
  })
