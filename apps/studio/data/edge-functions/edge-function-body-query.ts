import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { constructHeaders, handleError } from 'data/fetchers'
import { BASE_PATH, IS_PLATFORM } from 'lib/constants'
import { ResponseError } from 'types'
import { edgeFunctionsKeys } from './keys'

export type EdgeFunctionBodyVariables = {
  projectRef?: string
  slug?: string
}

export type EdgeFunctionFile = {
  name: string
  content: string
}

export type EdgeFunctionBodyResponse = {
  files: EdgeFunctionFile[]
}

export async function getEdgeFunctionBody(
  { projectRef, slug }: EdgeFunctionBodyVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')

  try {
    // Get authorization headers
    const headers = await constructHeaders({
      'Content-Type': 'application/json',
    })

    // Send to our API for processing (the API will handle the fetch from v1 endpoint)
    const parseResponse = await fetch(`${BASE_PATH}/api/edge-functions/body`, {
      method: 'POST',
      body: JSON.stringify({ projectRef, slug }),
      headers,
      credentials: 'include',
      signal,
    })

    if (!parseResponse.ok) {
      const error = await parseResponse.json()
      handleError(error)
    }

    const { files } = await parseResponse.json()
    return files as EdgeFunctionFile[]
  } catch (error) {
    console.error('Failed to parse edge function code:', error)
    throw new Error(
      'Failed to parse function code. The file may be corrupted or in an invalid format.'
    )
  }
}

export type EdgeFunctionBodyData = Awaited<ReturnType<typeof getEdgeFunctionBody>>
export type EdgeFunctionBodyError = ResponseError

export const useEdgeFunctionBodyQuery = <TData = EdgeFunctionBodyData>(
  { projectRef, slug }: EdgeFunctionBodyVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<EdgeFunctionBodyData, EdgeFunctionBodyError, TData> = {}
) =>
  useQuery<EdgeFunctionBodyData, EdgeFunctionBodyError, TData>(
    edgeFunctionsKeys.body(projectRef, slug),
    ({ signal }) => getEdgeFunctionBody({ projectRef, slug }, signal),
    {
      enabled:
        IS_PLATFORM && enabled && typeof projectRef !== 'undefined' && typeof slug !== 'undefined',
      ...options,
    }
  )
