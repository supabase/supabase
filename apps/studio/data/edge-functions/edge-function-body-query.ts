import { getMultipartBoundary, parseMultipartStream } from '@mjackson/multipart-parser'
import * as Sentry from '@sentry/react'
import { useQuery } from '@tanstack/react-query'

import { edgeFunctionsKeys } from './keys'
import { FileData } from '@/components/ui/FileExplorerAndEditor/FileExplorerAndEditor.types'
import { get, handleError, unguarded } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

type EdgeFunctionBodyVariables = {
  projectRef?: string
  slug?: string
}

export function isFunctionBodyMaxSizeError(error?: { code?: number } | null) {
  return error?.code === 507
}

async function fetchFunctionBody(
  { projectRef, slug }: EdgeFunctionBodyVariables,
  {
    multipart = true,
    signal,
    reportImmediately = false,
  }: { multipart: boolean; signal?: AbortSignal; reportImmediately?: boolean }
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')

  const { data, response, error } = await get('/v1/projects/{ref}/functions/{function_slug}/body', {
    params: { path: { ref: projectRef, function_slug: slug } },
    // Without the multipart Accept header the API returns the raw eszip bundle,
    // which isn't subject to the max size limit that the multipart response has
    headers: multipart ? { Accept: 'multipart/form-data' } : undefined,
    parseAs: 'stream',
    signal,
    grant: unguarded.migrating,
  })

  if (error) handleError(error, { reportImmediately })
  return { data, response }
}

export async function getEdgeFunctionBodyEszip(variables: EdgeFunctionBodyVariables) {
  const { data } = await fetchFunctionBody(variables, { multipart: false, reportImmediately: true })
  if (!data) throw new Error('Failed to retrieve edge function bundle')
  return new Uint8Array(await new Response(data).arrayBuffer())
}

export async function getEdgeFunctionBody(
  variables: EdgeFunctionBodyVariables,
  signal?: AbortSignal
) {
  const { data, response } = await fetchFunctionBody(variables, { multipart: true, signal })

  const contentTypeHeader = response.headers.get('content-type') ?? ''
  const boundary = getMultipartBoundary(contentTypeHeader)
  const files = []

  if (!data || !boundary) return { files: [] }

  let metadata: {
    deno2_entrypoint_path?: string | null
  } = {}

  try {
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
  } catch (error) {
    if (error instanceof Error) {
      Sentry.captureException(error, {
        extra: { error, data, response, boundary },
      })
    }
    throw error
  }
}

export type EdgeFunctionBodyData = Awaited<ReturnType<typeof getEdgeFunctionBody>>
type EdgeFunctionBodyError = StudioError

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
