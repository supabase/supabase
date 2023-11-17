import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_ADMIN_URL, IS_PLATFORM } from 'lib/constants'
import { useCallback } from 'react'
import { edgeFunctionsKeys } from './keys'
import { ResponseError } from 'types'

export type EdgeFunctionsVariables = { projectRef?: string }

export type EdgeFunctionsResponse = {
  id: string
  name: string
  slug: string
  status: string
  version: number
  created_at: number
  updated_at: number
  verify_jwt: boolean
  import_map: boolean
}

export async function getEdgeFunctions(
  { projectRef }: EdgeFunctionsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await get(`${API_ADMIN_URL}/projects/${projectRef}/functions`, {
    signal,
  })
  if (response.error) throw response.error
  return response as EdgeFunctionsResponse[]
}

export type EdgeFunctionsData = Awaited<ReturnType<typeof getEdgeFunctions>>
export type EdgeFunctionsError = ResponseError

export const useEdgeFunctionsQuery = <TData = EdgeFunctionsData>(
  { projectRef }: EdgeFunctionsVariables,
  { enabled = true, ...options }: UseQueryOptions<EdgeFunctionsData, EdgeFunctionsError, TData> = {}
) =>
  useQuery<EdgeFunctionsData, EdgeFunctionsError, TData>(
    edgeFunctionsKeys.list(projectRef),
    ({ signal }) => getEdgeFunctions({ projectRef }, signal),
    { enabled: IS_PLATFORM && enabled && typeof projectRef !== 'undefined', ...options }
  )

export const useEdgeFunctionsPrefetch = ({ projectRef }: EdgeFunctionsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(edgeFunctionsKeys.list(projectRef), ({ signal }) =>
        getEdgeFunctions({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
