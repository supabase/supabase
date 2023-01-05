import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
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

  const response = await get(`${API_URL}/projects/${projectRef}/resources/${id}`, {
    signal,
  })
  if (response.error) {
    throw response.error
  }

  return response as ResourceResponse
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

export const useResourcePrefetch = ({ projectRef, id }: ResourceVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef && id) {
      client.prefetchQuery(resourceKeys.resource(projectRef, id), ({ signal }) =>
        getResource({ projectRef, id }, signal)
      )
    }
  }, [projectRef])
}
