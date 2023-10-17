import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { usageKeys } from './keys'
import { ResponseError } from 'types'
import { components } from 'data/api'

export async function getResourceWarnings(signal?: AbortSignal) {
  const { data, error } = await get(`/platform/projects-resource-warnings`, { signal })
  if (error) throw error

  return data
}

export type ResourceWarning = components['schemas']['ProjectResourceWarningsResponse']
export type ResourceWarningsData = Awaited<ReturnType<typeof getResourceWarnings>>
export type ResourceWarningsError = ResponseError

export const useResourceWarningsQuery = <TData = ResourceWarningsData>({
  enabled = true,
  ...options
}: UseQueryOptions<ResourceWarningsData, ResourceWarningsError, TData> = {}) =>
  useQuery<ResourceWarningsData, ResourceWarningsError, TData>(
    usageKeys.resourceWarnings(),
    ({ signal }) => getResourceWarnings(signal),
    {
      enabled,
      staleTime: 1000 * 60 * 30, // default 30 minutes
      ...options,
    }
  )
