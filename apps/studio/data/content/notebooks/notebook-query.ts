import { useQuery } from '@tanstack/react-query'

import { getContentById } from '../content-id-query'
import { contentKeys } from '../keys'
import { STUB_NOTEBOOKS } from './notebooks-infinite-query'
import { timeout } from '@/lib/helpers'
import { ResponseError } from '@/types'
import type { Notebooks, UseCustomQueryOptions } from '@/types'

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

/**
 * [Joshen] Temporary stub for the Explorer notebook page only, until API support for the
 * 'notebook' content type ships. Deliberately NOT used by `getNotebook` above — that's also
 * called directly by lib/ai/tools/notebook-tools.ts, which needs the real endpoint.
 */
async function getNotebookStub({ id }: NotebookVariables): Promise<NotebookData> {
  await timeout(1000)

  const notebookStub = STUB_NOTEBOOKS.find((x) => x.id === id)
  if (!notebookStub) throw new ResponseError(`Content ${id} not found`, 404)

  return notebookStub
}

export const useNotebookQuery = <TData = NotebookData>(
  { projectRef, id }: NotebookVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<NotebookData, NotebookError, TData> = {}
) =>
  useQuery<NotebookData, NotebookError, TData>({
    queryKey: contentKeys.resource(projectRef, id),
    // [Joshen] Replace with getNotebook once API support is ready
    queryFn: () => getNotebookStub({ projectRef, id }),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
    ...options,
  })
