import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError } from 'types'
import { edgeFunctionsKeys } from './keys'

export type EdgeFunctionsVariables = { projectRef?: string }

export type EdgeFunctionsResponse = components['schemas']['FunctionResponse']

export async function getEdgeFunctions(
  { projectRef }: EdgeFunctionsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/v1/projects/{ref}/functions`, {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
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
