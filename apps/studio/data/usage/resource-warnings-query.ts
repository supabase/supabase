import { useQuery } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'

import { usageKeys } from './keys'
import type { components } from '@/data/api'
import { get, handleError } from '@/data/fetchers'
import { EMPTY_ARR } from '@/lib/void'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type ResourceWarningsVariables = {
  ref?: string
  slug?: string
}

/**
 * Resource warnings drive outage banners, so they need to surface a problem that starts
 * after page load rather than sitting on an hour-old cache.
 */
export const RESOURCE_WARNINGS_POLL_INTERVAL = 1000 * 60

export async function getResourceWarnings(
  variables?: ResourceWarningsVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get(`/platform/projects-resource-warnings`, {
    params: {
      query: {
        ref: variables?.ref,
        slug: variables?.slug,
      },
    },
    signal,
  })
  if (error) handleError(error)

  return Array.isArray(data) ? data : EMPTY_ARR
}

export type ResourceWarning = components['schemas']['ProjectResourceWarningsResponse']
export type ResourceWarningsData = Awaited<ReturnType<typeof getResourceWarnings>>
export type ResourceWarningsError = ResponseError

export const useResourceWarningsQuery = <TData = ResourceWarningsData>(
  variables: ResourceWarningsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ResourceWarningsData, ResourceWarningsError, TData> = {}
) =>
  useQuery<ResourceWarningsData, ResourceWarningsError, TData>({
    queryKey: usageKeys.resourceWarnings(variables.slug, variables.ref),
    queryFn: ({ signal }) => getResourceWarnings(variables, signal),
    enabled:
      IS_PLATFORM && enabled && (variables.ref !== undefined || variables.slug !== undefined),
    staleTime: RESOURCE_WARNINGS_POLL_INTERVAL,
    refetchInterval: RESOURCE_WARNINGS_POLL_INTERVAL,
    ...options,
  })
