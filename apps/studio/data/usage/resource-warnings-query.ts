import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { IS_PLATFORM } from 'common'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { usageKeys } from './keys'

export async function getResourceWarnings(signal?: AbortSignal) {
  const { data, error } = await get(`/platform/projects-resource-warnings`, { signal })
  if (error) handleError(error)
  // for testing purposes, return a hardcoded array of resource warnings
  return [
    {
      project: 'aclodpjssdgdxbvmybdv', //replace with your ref to get an example warning
      is_readonly_mode_enabled: false,
      disk_io_exhaustion: null,
      disk_space_exhaustion: null,
      cpu_exhaustion: 'critical',
      memory_and_swap_exhaustion: null,
    },
  ] as ResourceWarning[]
  //return data
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
      enabled: IS_PLATFORM && enabled,
      staleTime: 1000 * 60 * 30, // default 30 minutes
      ...options,
    }
  )
