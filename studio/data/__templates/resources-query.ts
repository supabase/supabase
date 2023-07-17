import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { resourceKeys } from './keys'

export type ResourcesVariables = {
  projectRef?: string
}

export type ResourcesResponse = {
  id: string
}

export async function getResources({ projectRef }: ResourcesVariables, signal?: AbortSignal) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const response = await get<ResourcesResponse[]>(`${API_URL}/projects/${projectRef}/resources`, {
    signal,
  })

  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

export type ResourcesData = Awaited<ReturnType<typeof getResources>>
export type ResourcesError = unknown

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
