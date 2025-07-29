import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { contentKeys } from './keys'
import { SNIPPET_PAGE_LIMIT } from './sql-folders-query'

export type SQLSnippetFolderContentsVariables = {
  projectRef?: string
  folderId?: string
  cursor?: string
  name?: string
  sort?: 'name' | 'inserted_at'
}

export async function getSQLSnippetFolderContents(
  { projectRef, folderId, cursor, sort, name }: SQLSnippetFolderContentsVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')
  if (typeof folderId === 'undefined') throw new Error('folderId is required')

  const sortOrder = sort === 'name' ? 'asc' : 'desc'

  const { data, error } = await get('/platform/projects/{ref}/content/folders/{id}', {
    params: {
      path: { ref: projectRef, id: folderId },
      query: {
        cursor,
        limit: SNIPPET_PAGE_LIMIT.toString(),
        sort_by: sort,
        sort_order: sortOrder,
        name,
      },
    },
    signal,
  })

  if (error) handleError(error)
  return {
    ...data.data,
    cursor: data.cursor,
  }
}

export type SQLSnippetFolderContentsData = Awaited<ReturnType<typeof getSQLSnippetFolderContents>>
export type SQLSnippetFolderContentsError = ResponseError

export const useSQLSnippetFolderContentsQuery = <TData = SQLSnippetFolderContentsData>(
  { projectRef, folderId, name, sort }: Omit<SQLSnippetFolderContentsVariables, 'cursor'>,
  {
    enabled = true,
    ...options
  }: UseInfiniteQueryOptions<
    SQLSnippetFolderContentsData,
    SQLSnippetFolderContentsError,
    TData
  > = {}
) =>
  useInfiniteQuery<SQLSnippetFolderContentsData, SQLSnippetFolderContentsError, TData>(
    contentKeys.folderContents(projectRef, folderId, { name, sort }),
    ({ signal, pageParam }) =>
      getSQLSnippetFolderContents({ projectRef, folderId, cursor: pageParam, name, sort }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof folderId !== 'undefined',
      getNextPageParam(lastPage) {
        return lastPage.cursor
      },
      ...options,
    }
  )
