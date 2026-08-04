import { useQuery } from '@tanstack/react-query'
import type { components } from 'api-types'

import { platformAppKeys } from './keys'
import { constructHeaders, fetchHandler, handleError } from '@/data/fetchers'
import { API_URL } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type PlatformAppVariables = {
  slug?: string
  id?: string
}

export type PlatformAppDetail = components['schemas']['GetPlatformAppResponse']

export async function getPlatformApp({ slug, id }: PlatformAppVariables, signal?: AbortSignal) {
  if (!slug) throw new Error('slug is required')
  if (!id) throw new Error('id is required')

  const baseUrl = API_URL?.replace('/platform', '')
  const url = `${baseUrl}/platform/organizations/${slug}/apps/${id}`
  const headers = await constructHeaders()
  const res = await fetchHandler(url, { method: 'GET', headers, signal })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    handleError(body)
  }

  return res.json() as Promise<PlatformAppDetail>
}

export type PlatformAppData = Awaited<ReturnType<typeof getPlatformApp>>
export type PlatformAppError = ResponseError

export const usePlatformAppQuery = <TData = PlatformAppData>(
  { slug, id }: PlatformAppVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<PlatformAppData, PlatformAppError, TData> = {}
) =>
  useQuery<PlatformAppData, PlatformAppError, TData>({
    queryKey: platformAppKeys.detail(slug, id),
    queryFn: ({ signal }) => getPlatformApp({ slug, id }, signal),
    enabled: enabled && typeof slug !== 'undefined' && typeof id !== 'undefined',
    ...options,
  })
