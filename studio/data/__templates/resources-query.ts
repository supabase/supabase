import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useCallback } from 'react'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { resourceKeys } from './keys'

export type ResourcesVariables = {
  projectRef?: string
}

export async function getResources({ projectRef }: ResourcesVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  // Use any of the API endpoints as the parameter here, TS will check if its valid - "branches" here is just an example
  const { data, error } = await get(`/v1/projects/{ref}/branches`, {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) throw error

  return data
}

export type ResourcesData = Awaited<ReturnType<typeof getResources>>
export type ResourcesError = ResponseError

export const useResourcesQuery = <TData = ResourcesData>(
  { projectRef }: ResourcesVariables,
  { enabled = true, ...options }: UseQueryOptions<ResourcesData, ResourcesError, TData> = {}
) =>
  useQuery<ResourcesData, ResourcesError, TData>(
    resourceKeys.list(projectRef),
    ({ signal }) => getResources({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

/**
 * useResourcesPrefetch is used for prefetching data. For example, starting a query loading before a page is navigated to.
 * Feel free to omit if not required
 *
 * @example
 * const prefetch = useResourcesPrefetch({ projectRef })
 *
 * return (
 *   <Link onMouseEnter={() => prefetch()}>
 *     Start loading on hover
 *   </Link>
 * )
 */
export const useResourcesPrefetch = ({ projectRef }: ResourcesVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(resourceKeys.list(projectRef), ({ signal }) =>
        getResources({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
