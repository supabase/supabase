import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { contentKeys } from './keys'
import { components } from 'api-types'

export type SnippetFolderResponse = components['schemas']['GetUserContentFolderResponse']['data']
export type SnippetFolder = components['schemas']['UserContentFolder']
export type Snippet = components['schemas']['UserContentObjectMeta']
export type SnippetDetail = components['schemas']['UserContentObjectV2']

export async function getSQLSnippetFolders(
  { projectRef, folderId }: { projectRef?: string; folderId?: string },
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')

  if (folderId) {
    const { data, error } = await get('/platform/projects/{ref}/content/folders/{id}', {
      params: { path: { ref: projectRef, id: folderId } },
      signal,
    })

    if (error) throw handleError(error)
    return data.data
  } else {
    const { data, error } = await get('/platform/projects/{ref}/content/folders', {
      params: { path: { ref: projectRef }, query: { type: 'sql' } },
      signal,
    })

    if (error) throw handleError(error)
    return data.data
  }
}

export type SQLSnippetFoldersData = Awaited<ReturnType<typeof getSQLSnippetFolders>>
export type SQLSnippetFoldersError = ResponseError

export const useSQLSnippetFoldersQuery = <TData = SQLSnippetFoldersData>(
  { projectRef, folderId }: { projectRef?: string; folderId?: string },
  {
    enabled = true,
    ...options
  }: UseQueryOptions<SQLSnippetFoldersData, SQLSnippetFoldersError, TData> = {}
) =>
  useQuery<SQLSnippetFoldersData, SQLSnippetFoldersError, TData>(
    contentKeys.folders(projectRef, folderId),
    ({ signal }) => getSQLSnippetFolders({ projectRef, folderId }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
