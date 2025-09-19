import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { getMultipartBoundary, parseMultipartStream } from '@mjackson/multipart-parser'
import { constructHeaders, fetchHandler, get, handleError } from 'data/fetchers'
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
  files: EdgFunctionFile[]
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

  const { data, response, error } = await get(`/v1/projects/{ref}/functions/{slug}/body`, {
    params: { path: { ref: projectRef, slug: slug } },
    headers: { Accept: 'multipart/form-data' },
    parseAs: 'stream',
    signal,
  })

  if (error) handleError(error)

  const boundary = getMultipartBoundary(response.headers.get('content-type'))
  const files = []

  for await (let part of parseMultipartStream(data, { boundary })) {
    if (part.isFile) {
      files.push({
        name: part.filename,
        content: part.text,
      })
    }
  }

  return { files: files as EdgeFunctionFile[] }
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
  useQuery<EdgeFunctionBodyData, EdgeFunctionBodyError, TData>({
    queryKey: edgeFunctionsKeys.body(projectRef, slug),
    queryFn: ({ signal }) => getEdgeFunctionBody({ projectRef, slug }, signal),
    enabled:
      IS_PLATFORM && enabled && typeof projectRef !== 'undefined' && typeof slug !== 'undefined',
    ...options,
  })
