import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useCallback } from 'react'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { resourceKeys } from './keys'

export type ResourceVariables = {
  projectRef?: string
  id?: string
}

export type ResourceResponse = {
  id: string
}

export async function getResource({ projectRef, id }: ResourceVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  // @ts-ignore Just a sample here, TS lint will validate if the endpoint is valid
  const { data, error } = await get(`/platform/projects/{ref}/resources/{id}`, {
    params: { path: { ref: projectRef, id } },
    signal,
  })
  if (error) throw error

  return data
}

export type ResourceData = Awaited<ReturnType<typeof getResource>>
export type ResourceError = ResponseError

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
 * Feel free to omit if not required
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
