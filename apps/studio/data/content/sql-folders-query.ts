import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { contentKeys } from './keys'

export type SnippetFolderResponse = components['schemas']['GetUserContentFolderResponse']['data']
export type SnippetFolder = components['schemas']['UserContentFolder']
export type Snippet = components['schemas']['UserContentObjectMeta']

export async function getSQLSnippetFolders(
  {
    projectRef,
    folderId,
    cursor,
    sort,
    name,
  }: {
    projectRef?: string
    folderId?: string
    cursor?: string
    name?: string
    sort?: 'name' | 'inserted_at'
  },
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')

  const sortOrder = sort === 'name' ? 'asc' : 'desc'

  if (folderId) {
    const { data, error } = await get('/platform/projects/{ref}/content/folders/{id}', {
      params: {
        path: { ref: projectRef, id: folderId },
        query: { cursor, limit: '3', sort_by: sort, sort_order: sortOrder },
      },
      signal,
    })

    if (error) throw handleError(error)
    return {
      ...data.data,
      cursor: data.cursor,
    }
  } else {
    const { data, error } = await get('/platform/projects/{ref}/content/folders', {
      params: {
        path: { ref: projectRef },
        query: { type: 'sql', cursor, limit: '3', sort_by: sort, sort_order: sortOrder, name },
      },
      signal,
    })

    if (error) throw handleError(error)
    return {
      ...data.data,
      cursor: data.cursor,
    }
  }
}

export type SQLSnippetFoldersData = Awaited<ReturnType<typeof getSQLSnippetFolders>>
export type SQLSnippetFoldersError = ResponseError

export const useSQLSnippetFoldersQuery = <TData = SQLSnippetFoldersData>(
  { projectRef, folderId }: { projectRef?: string; folderId?: string },
  {
    enabled = true,
    ...options
  }: UseInfiniteQueryOptions<SQLSnippetFoldersData, SQLSnippetFoldersError, TData> = {}
) =>
  useInfiniteQuery<SQLSnippetFoldersData, SQLSnippetFoldersError, TData>(
    contentKeys.folders(projectRef, folderId),
    ({ signal, pageParam }) =>
      getSQLSnippetFolders({ projectRef, folderId, cursor: pageParam }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      getNextPageParam(lastPage) {
        return lastPage.cursor
      },
      ...options,
    }
  )
