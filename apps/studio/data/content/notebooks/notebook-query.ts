import { useQuery } from '@tanstack/react-query'

import { getContentById } from '../content-id-query'
import { contentKeys } from '../keys'
import type { Notebooks, ResponseError, UseCustomQueryOptions } from '@/types'

export type NotebookVariables = { projectRef?: string; id?: string }
export type NotebookError = ResponseError

export async function getNotebook(
  { projectRef, id }: NotebookVariables,
  signal?: AbortSignal,
  headers?: HeadersInit
) {
  const data = await getContentById({ projectRef, id }, signal, headers)

  // api-types doesn't have 'notebook' in GetUserContentByIdResponse['type'] yet — same gap
  // tracked by the ContentBase TODO in content-query.ts — so this narrowing can't be static.
  if ((data.type as string) !== 'notebook') {
    throw new Error(`Content ${id} is not a notebook (got type: ${data.type})`)
  }

  return data as unknown as Omit<typeof data, 'type' | 'content'> & {
    type: 'notebook'
    content: Notebooks.Content
  }
}

export type NotebookData = Awaited<ReturnType<typeof getNotebook>>

export const useNotebookQuery = <TData = NotebookData>(
  { projectRef, id }: NotebookVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<NotebookData, NotebookError, TData> = {}
) =>
  useQuery<NotebookData, NotebookError, TData>({
    queryKey: contentKeys.resource(projectRef, id),
    queryFn: ({ signal }) => getNotebook({ projectRef, id }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
    ...options,
  })
