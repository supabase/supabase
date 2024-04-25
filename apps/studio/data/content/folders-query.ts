import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { contentKeys } from './keys'
import { components } from 'api-types'

export type SQLSnippetFolder = components['schemas']['GetUserContentFolderResponse']

export async function getSQLSnippetFolders(
  { projectRef }: { projectRef: string | undefined },
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')

  const { data, error } = await get('/platform/projects/{ref}/content/folders', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) throw handleError(error)
  return data
}

export type SQLSnippetFoldersData = Awaited<ReturnType<typeof getSQLSnippetFolders>>
export type SQLSnippetFoldersError = ResponseError

export const useSQLSnippetFoldersQuery = <TData = SQLSnippetFoldersData>(
  { projectRef }: { projectRef: string | undefined },
  {
    enabled = true,
    ...options
  }: UseQueryOptions<SQLSnippetFoldersData, SQLSnippetFoldersError, TData> = {}
) =>
  useQuery<SQLSnippetFoldersData, SQLSnippetFoldersError, TData>(
    contentKeys.folders(projectRef),
    ({ signal }) => getSQLSnippetFolders({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
