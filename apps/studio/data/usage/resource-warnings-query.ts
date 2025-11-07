import { useQuery } from '@tanstack/react-query'

import { IS_PLATFORM } from 'common'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { usageKeys } from './keys'

export type ResourceWarningsVariables = {
  ref?: string
  slug?: string
}

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

  return data
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
    staleTime: 1000 * 60 * 60,
    ...options,
  })
