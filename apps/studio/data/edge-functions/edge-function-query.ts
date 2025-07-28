import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import { ResponseError } from 'types'
import { edgeFunctionsKeys } from './keys'

export type EdgeFunctionVariables = {
  projectRef?: string
  slug?: string
}

export type EdgeFunction = components['schemas']['FunctionSlugResponse']

export async function getEdgeFunction(
  { projectRef, slug }: EdgeFunctionVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get(`/v1/projects/{ref}/functions/{function_slug}`, {
    params: { path: { ref: projectRef, function_slug: slug } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type EdgeFunctionData = Awaited<ReturnType<typeof getEdgeFunction>>
export type EdgeFunctionError = ResponseError

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
