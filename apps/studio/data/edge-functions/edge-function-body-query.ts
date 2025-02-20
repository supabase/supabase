import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { handleError } from 'data/fetchers'
import { IS_PLATFORM } from 'lib/constants'
import { ResponseError } from 'types'
import { edgeFunctionsKeys } from './keys'
import { constructHeaders } from 'data/fetchers'

export type EdgeFunctionBodyVariables = {
  projectRef?: string
  slug?: string
}

export type EdgeFunctionFile = {
  name: string
  content: string
}

export async function getEdgeFunctionBody(
  { projectRef, slug }: EdgeFunctionBodyVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!slug) throw new Error('slug is required')

  const headers = await constructHeaders()
  headers.set('Accept', 'multipart/form-data')

  // TODO: Uncomment when endpoint is ready
  // const response = await fetch(`/v1/projects/${projectRef}/functions/${slug}/body`, {
  //   headers,
  //   signal,
  // })
  //
  // if (!response.ok) {
  //   const error = await response.json()
  //   handleError(error)
  // }
  // const formData = await response.formData()

  // Mock response
  const mockFormData = new FormData()
  const mockContent = `// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const { name } = await req.json()
  const data = {
    message: \`Hello \${name}!\`,
  }

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
})`
  const mockFile = new File([mockContent], 'index.ts', { type: 'text/typescript' })
  mockFormData.append('index.ts', mockFile)

  const files: EdgeFunctionFile[] = []
  for (const [name, content] of mockFormData.entries()) {
    if (content instanceof File) {
      const text = await content.text()
      files.push({ name, content: text })
    }
  }

  return files
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
