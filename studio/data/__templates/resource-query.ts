import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get, isResponseOk } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { resourceKeys } from './keys'

export type ResourceVariables = {
  projectRef?: string
  id?: string
}

export type ResourceResponse = {
  id: string
}

export async function getResource({ projectRef, id }: ResourceVariables, signal?: AbortSignal) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  if (!id) {
    throw new Error('id is required')
  }

  const response = await get<ResourceResponse>(
    `${API_URL}/projects/${projectRef}/resources/${id}`,
    {
      signal,
    }
  )
  if (!isResponseOk(response)) {
    throw response.error
  }

  return response
}

export type ResourceData = Awaited<ReturnType<typeof getResource>>
export type ResourceError = unknown

export const useResourceQuery = <TData = ResourceData>(
  { projectRef, id }: ResourceVariables,
  { enabled = true, ...options }: UseQueryOptions<ResourceData, ResourceError, TData> = {}
) =>
  useQuery<ResourceData, ResourceError, TData>(
    resourceKeys.resource(projectRef, id),
    ({ signal }) => getResource({ projectRef, id }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
      ...options,
    }
  )

/**
 * useResourcePrefetch is used for prefetching data. For example, starting a query loading before a page is navigated to.
 *
 * @example
 * const prefetch = useResourcePrefetch({ projectRef, id })
 *
 * return (
 *   <Link onMouseEnter={() => prefetch()}>
 *     Start loading on hover
 *   </Link>
 * )
 */
export const useResourcePrefetch = ({ projectRef, id }: ResourceVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef && id) {
      client.prefetchQuery(resourceKeys.resource(projectRef, id), ({ signal }) =>
        getResource({ projectRef, id }, signal)
      )
    }
  }, [projectRef, id])
}
