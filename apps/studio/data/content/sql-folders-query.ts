import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { contentKeys } from './keys'

export type SnippetFolderResponse = components['schemas']['GetUserContentFolderResponse']['data']
export type SnippetFolder =
  components['schemas']['GetUserContentFolderResponse']['data']['folders'][number]
export type Snippet =
  components['schemas']['GetUserContentFolderResponse']['data']['contents'][number]

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
  }: UseInfiniteQueryOptions<SQLSnippetFoldersData, SQLSnippetFoldersError, TData> = {}
) =>
  useInfiniteQuery<SQLSnippetFoldersData, SQLSnippetFoldersError, TData>(
    contentKeys.folders(projectRef, { name, sort }),
    ({ signal, pageParam }) =>
      getSQLSnippetFolders({ projectRef, cursor: pageParam, name, sort }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      getNextPageParam(lastPage) {
        return lastPage.cursor
      },
      ...options,
    }
  )
