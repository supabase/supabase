import { useQuery } from '@tanstack/react-query'

import { contentKeys } from '../keys'
import { STUB_NOTEBOOKS } from './notebooks-infinite-query'
import { timeout } from '@/lib/helpers'
import { ResponseError } from '@/types'
import type { Notebooks, UseCustomQueryOptions } from '@/types'

export type NotebookVariables = { projectRef?: string; id?: string }
export type NotebookError = ResponseError

export async function getNotebook(
  { id }: NotebookVariables,
  // @ts-ignore
  signal?: AbortSignal,
  // @ts-ignore
  headers?: HeadersInit
) {
  // [Joshen] This is a temporary stub until API support for notebooks is ready
  await timeout(1000)

  const notebookStub = STUB_NOTEBOOKS.find((x) => x.id === id)
  if (!notebookStub) throw new ResponseError(`Content ${id} not found`, 404)

  return notebookStub as Omit<typeof notebookStub, 'type' | 'content'> & {
    type: 'notebook'
    content: Notebooks.Content
  }

  // [Joshen] Once API support is ready - then we can uncomment the bottom and remove the stub
  // const data = await getContentById({ projectRef, id }, signal, headers)
  // if ((data.type as string) !== 'notebook') {
  //   throw new Error(`Content ${id} is not a notebook (got type: ${data.type})`)
  // }
  // return data as unknown as Omit<typeof data, 'type' | 'content'> & {
  //   type: 'notebook'
  //   content: Notebooks.Content
  // }
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
