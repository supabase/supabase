import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { IS_PLATFORM } from 'common'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { usageKeys } from './keys'

export async function getResourceWarnings(signal?: AbortSignal) {
  // const { data, error } = await get(`/platform/projects-resource-warnings`, { signal })
  // if (error) handleError(error)
  const data = [
    {
      "project": "projxxxxxxxxxxx",
      "is_readonly_mode_enabled": false,
      "need_pitr": null,
      "disk_io_exhaustion": null,
      "disk_space_exhaustion": null,
      "cpu_exhaustion": null,
      "memory_and_swap_exhaustion": null,
      "auth_rate_limit_exhaustion": null,
      "auth_restricted_email_sending": "warning",
      "auth_email_offender": null
    }
  ]
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
      enabled: IS_PLATFORM && enabled,
      staleTime: 1000 * 60 * 60, // default 60 minutes
      ...options,
    }
  )
