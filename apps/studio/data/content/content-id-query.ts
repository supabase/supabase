import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import type { Content } from './content-query'
import { remapSqlContentField } from './content-remap'
import { contentKeys } from './keys'
import type { SnippetWithContent } from './sql-folders-query'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type GetUserContentByIdResponse = Omit<
  components['schemas']['GetUserContentByIdResponse'],
  'content'
> & {
  content: Content['content']
}

export async function getContentById(
  { projectRef, id }: { projectRef?: string; id?: string },
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')
  if (typeof id === 'undefined') throw new Error('Content ID is required')

  const { data, error } = await get('/platform/projects/{ref}/content/item/{id}', {
    params: { path: { ref: projectRef, id } },
    signal,
  })

  if (error) throw handleError(error)
  return remapSqlContentField(data as unknown as GetUserContentByIdResponse)
}

export type ContentIdData = Awaited<ReturnType<typeof getContentById>>
export type ContentIdError = ResponseError

// SQL-editor-specific fetch: the editor only ever loads SQL snippets, so the
// content body is typed as SQL content and the result is a SnippetWithContent
// (status 'saved') ready to drop into the store — no narrowing/casting at the
// call site. Reports etc. keep using the generic getContentById above.
export async function getSqlSnippetById(
  { projectRef, id }: { projectRef?: string; id?: string },
  signal?: AbortSignal
): Promise<SnippetWithContent> {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')
  if (typeof id === 'undefined') throw new Error('Content ID is required')

  const { data, error } = await get('/platform/projects/{ref}/content/item/{id}', {
    params: { path: { ref: projectRef, id } },
    signal,
  })

  if (error) throw handleError(error)
  const snippet = remapSqlContentField(data as unknown as Omit<SnippetWithContent, 'status'>)
  return { ...snippet, status: 'saved' }
}

export type SqlSnippetByIdData = Awaited<ReturnType<typeof getSqlSnippetById>>

export const useSqlSnippetByIdQuery = <TData = SqlSnippetByIdData>(
  { projectRef, id }: { projectRef?: string; id?: string },
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<SqlSnippetByIdData, ContentIdError, TData> = {}
) =>
  useQuery<SqlSnippetByIdData, ContentIdError, TData>({
    queryKey: contentKeys.resource(projectRef, id),
    queryFn: ({ signal }) => getSqlSnippetById({ projectRef, id }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
    ...options,
  })

export const useContentIdQuery = <TData = ContentIdData>(
  { projectRef, id }: { projectRef?: string; id?: string },
  { enabled = true, ...options }: UseCustomQueryOptions<ContentIdData, ContentIdError, TData> = {}
) =>
  useQuery<ContentIdData, ContentIdError, TData>({
    queryKey: contentKeys.resource(projectRef, id),
    queryFn: ({ signal }) => getContentById({ projectRef, id }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
    ...options,
  })
