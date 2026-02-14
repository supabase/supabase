import { getMultipartBoundary, parseMultipartStream } from '@mjackson/multipart-parser'
import { useQuery } from '@tanstack/react-query'

import { FileData } from '@/components/ui/FileExplorerAndEditor/FileExplorerAndEditor.types'
import { get, handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { edgeFunctionsKeys } from './keys'

type EdgeFunctionBodyVariables = {
  projectRef?: string
  slug?: string
}

export async function getEdgeFunctionBody(
  { projectRef, slug }: EdgeFunctionBodyVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')

  const { data, response, error } = await get('/v1/projects/{ref}/functions/{function_slug}/body', {
    params: { path: { ref: projectRef, function_slug: slug } },
    headers: { Accept: 'multipart/form-data' },
    parseAs: 'stream',
    signal,
  })

  if (error) handleError(error)

  const contentTypeHeader = response.headers.get('content-type') ?? ''
  const boundary = getMultipartBoundary(contentTypeHeader)
  const files = []

  if (!data || !boundary) return { files: [] }

  let metadata: {
    deno2_entrypoint_path?: string | null
  } = {}

  for await (let part of parseMultipartStream(data, {
    boundary,
    maxFileSize: 20 * 1024 * 1024,
  })) {
    if (part.isFile) {
      files.push({
        name: part.filename,
        content: part.text,
      })
    } else {
      // treat it as metadata
      metadata = JSON.parse(part.text)
    }
  }

  return {
    metadata,
    files: files as Omit<FileData, 'id' | 'selected' | 'state'>[],
  }
}

export type EdgeFunctionBodyData = Awaited<ReturnType<typeof getEdgeFunctionBody>>
export type EdgeFunctionBodyError = ResponseError

export const useEdgeFunctionBodyQuery = <TData = EdgeFunctionBodyData>(
  { projectRef, slug }: EdgeFunctionBodyVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<EdgeFunctionBodyData, EdgeFunctionBodyError, TData> = {}
) =>
  useQuery<EdgeFunctionBodyData, EdgeFunctionBodyError, TData>({
    queryKey: edgeFunctionsKeys.body(projectRef, slug),
    queryFn: ({ signal }) => getEdgeFunctionBody({ projectRef, slug }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof slug !== 'undefined',
    ...options,
  })
