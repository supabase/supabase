import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { usageKeys } from './keys'

export type ResourceWarningResponse = {
  project: string
  is_readonly_mode_enabled: boolean
  is_disk_io_budget_below_threshold: boolean
  is_disk_space_usage_beyond_threshold: boolean
  is_cpu_load_beyond_threshold: boolean
  is_memory_and_swap_usage_beyond_threshold: boolean
}

export async function getResourceWarnings(signal?: AbortSignal) {
  const response = await get<ResourceWarningResponse[]>(`${API_URL}/projects-resource-warnings`, {
    signal,
  })
  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

export type ResourceWarningData = Awaited<ReturnType<typeof getResourceWarnings>>
export type ResourceError = unknown

export const useResourceWarningQuery = <TData = ResourceWarningData>({
  enabled = true,
  ...options
}: UseQueryOptions<ResourceWarningData, ResourceError, TData> = {}) =>
  useQuery<ResourceWarningData, ResourceError, TData>(
    usageKeys.resourceWarnings(),
    ({ signal }) => getResourceWarnings(signal),
    {
      enabled: enabled,
      ...options,
    }
  )
