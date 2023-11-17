import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_ADMIN_URL, IS_PLATFORM } from 'lib/constants'
import { useCallback } from 'react'
import { edgeFunctionsKeys } from './keys'

export type EdgeFunctionVariables = {
  projectRef?: string
  slug?: string
}

export type EdgeFunctionResponse = {
  id: string
  slug: string
  name: string
  status: string
  created_at: number
  updated_at: number
  verify_jwt: boolean
  import_map: boolean
  version: number
  import_map_path: string
}

export async function getEdgeFunction(
  { projectRef, slug }: EdgeFunctionVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')

  const response = await get(`${API_ADMIN_URL}/projects/${projectRef}/functions/${slug}`, {
    signal,
  })
  if (response.error) throw response.error
  return response as EdgeFunctionResponse
}

export type EdgeFunctionData = Awaited<ReturnType<typeof getEdgeFunction>>
export type EdgeFunctionError = unknown

export const useEdgeFunctionQuery = <TData = EdgeFunctionData>(
  { projectRef, slug }: EdgeFunctionVariables,
  { enabled = true, ...options }: UseQueryOptions<EdgeFunctionData, EdgeFunctionError, TData> = {}
) =>
  useQuery<EdgeFunctionData, EdgeFunctionError, TData>(
    edgeFunctionsKeys.detail(projectRef, slug),
    ({ signal }) => getEdgeFunction({ projectRef, slug }, signal),
    {
      enabled:
        IS_PLATFORM && enabled && typeof projectRef !== 'undefined' && typeof slug !== 'undefined',
      ...options,
    }
  )

export const useResourcePrefetch = ({ projectRef, slug }: EdgeFunctionVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef && slug) {
      client.prefetchQuery(edgeFunctionsKeys.detail(projectRef, slug), ({ signal }) =>
        getEdgeFunction({ projectRef, slug }, signal)
      )
    }
  }, [projectRef, slug])
}
