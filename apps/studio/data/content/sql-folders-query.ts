import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { contentKeys } from './keys'
import type { SnippetStatus } from './snippet-status'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, SqlSnippets, UseCustomInfiniteQueryOptions } from '@/types'

export type SnippetFolderResponse = components['schemas']['GetUserContentFolderResponse']['data']
export type SnippetFolder =
  components['schemas']['GetUserContentFolderResponse']['data']['folders'][number]
export type Snippet =
  components['schemas']['GetUserContentFolderResponse']['data']['contents'][number]

export interface SnippetWithContent extends Snippet {
  content?: SqlSnippets.Content
  status: SnippetStatus
}

// Attaches the 'saved' lifecycle status to a snippet as it crosses from the
// database into the app. Generic so it preserves any loaded content on the
// snippet, and types `status` as the full SnippetStatus (not the 'saved'
// literal) so the result is a regular SnippetWithContent.
export function withSavedStatus<T extends Snippet>(snippet: T): T & { status: SnippetStatus } {
  return { ...snippet, status: 'saved' }
}

export type SQLSnippetFolderVariables = {
  projectRef?: string
  cursor?: string
  name?: string
  sort?: 'name' | 'inserted_at'
}

export const SNIPPET_PAGE_LIMIT = 100

export async function getSQLSnippetFolders(
  { projectRef, cursor, sort, name }: SQLSnippetFolderVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')

  const sortOrder = sort === 'name' ? 'asc' : 'desc'

  const { data, error } = await get('/platform/projects/{ref}/content/folders', {
    params: {
      path: { ref: projectRef },
      query: {
        type: 'sql',
        cursor,
        limit: SNIPPET_PAGE_LIMIT.toString(),
        sort_by: sort,
        sort_order: sortOrder,
        name,
        // [Alaister] Hard coding visibility to 'user' as folders are only supported for user content
        visibility: 'user',
      },
    },
    signal,
  })

  if (error) handleError(error)
  return {
    ...data.data,
    contents: (data.data.contents ?? []).map(withSavedStatus),
    cursor: data.cursor,
  }
}

export type SQLSnippetFoldersData = Awaited<ReturnType<typeof getSQLSnippetFolders>>
export type SQLSnippetFoldersError = ResponseError

export const useSQLSnippetFoldersQuery = <TData = SQLSnippetFoldersData>(
  { projectRef, name, sort }: Omit<SQLSnippetFolderVariables, 'cursor'>,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    SQLSnippetFoldersData,
    SQLSnippetFoldersError,
    InfiniteData<TData>,
    readonly unknown[],
    string | undefined
  > = {}
) =>
  useInfiniteQuery({
    queryKey: contentKeys.folders(projectRef, { name, sort }),
    queryFn: ({ signal, pageParam }) =>
      getSQLSnippetFolders({ projectRef, cursor: pageParam, name, sort }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      return lastPage.cursor
    },
    ...options,
  })
