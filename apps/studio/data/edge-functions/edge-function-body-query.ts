import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { handleError, constructHeaders } from 'data/fetchers'
import { IS_PLATFORM, API_URL, BASE_PATH } from 'lib/constants'
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

  // Fetch the eszip data
  const headers = await constructHeaders()
  headers.set('Accept', 'application/octet-stream')

  const baseUrl = API_URL?.replace('/platform', '')
  const url = `${baseUrl}/v1/projects/${projectRef}/functions/${slug}/body`

  const response = await fetch(url, {
    method: 'GET',
    headers,
    signal,
    credentials: 'include',
    referrerPolicy: 'no-referrer-when-downgrade',
  })

  if (!response.ok) {
    const error = await response.json()
    handleError(error)
  }

  // Verify content type is binary/eszip
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/octet-stream')) {
    throw new Error(
      'Invalid response: Expected eszip file but received ' + (contentType || 'unknown format')
    )
  }

  // Get the eszip data as ArrayBuffer
  const eszip = await response.arrayBuffer()

  if (eszip.byteLength === 0) {
    throw new Error('Invalid eszip: File is empty')
  }

  // Send to our API for processing
  try {
    const parseResponse = await fetch(`${BASE_PATH}/api/edge-functions/parse-body`, {
      method: 'POST',
      body: eszip,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    })

    if (!parseResponse.ok) {
      const error = await parseResponse.json()
      handleError(error)
    }

    const { files } = await parseResponse.json()
    return files
  } catch (error) {
    console.error('Failed to parse eszip file:', error)
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
