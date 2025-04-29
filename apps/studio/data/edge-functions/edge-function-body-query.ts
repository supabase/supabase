import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { getMultipartBoundary, parseMultipart } from '@mjackson/multipart-parser'
import { constructHeaders, handleError } from 'data/fetchers'
import { API_URL, BASE_PATH, IS_PLATFORM } from 'lib/constants'
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

async function streamToString(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let result = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      result += decoder.decode(value, { stream: true })
    }
    // Final decode to handle any remaining bytes
    result += decoder.decode()
    return result
  } catch (error) {
    console.error('Error reading stream:', error)
    throw error
  }
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
      //'Content-Type': 'application/json',
      Accept: 'multipart/form-data',
    })

    // Send to our API for processing (the API will handle the fetch from v1 endpoint)
    const baseUrl = API_URL?.replace('/platform', '')
    const response = await fetch(`${baseUrl}/v1/projects/${projectRef}/functions/${slug}/body`, {
      method: 'GET',
      //body: JSON.stringify({ projectRef, slug }),
      headers,
      credentials: 'include',
      signal,
    })

    if (!response.ok) {
      const { error } = await response.json()
      handleError(
        typeof error === 'object'
          ? error
          : typeof error === 'string'
            ? { message: error }
            : { message: 'Unknown error' }
      )
    }

    const boundary = getMultipartBoundary(response.headers.get('content-type'))
    const files = []

    await parseMultipart(response.body, { boundary }, async (part) => {
      if (part.isFile) {
        files.push({
          name: part.filename,
          content: await streamToString(part.body),
        })
      }
    })
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
