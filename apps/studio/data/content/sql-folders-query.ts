import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { contentKeys } from './keys'
import type { SnippetStatus } from './snippet-status'
import { get, handleError } from '@/data/fetchers'
import type {
  LogSqlSnippets,
  ResponseError,
  SqlSnippets,
  UseCustomInfiniteQueryOptions,
} from '@/types'

export type SnippetFolderResponse = components['schemas']['GetUserContentFolderResponse']['data']
export type SnippetFolder =
  components['schemas']['GetUserContentFolderResponse']['data']['folders'][number]
export type Snippet =
  components['schemas']['GetUserContentFolderResponse']['data']['contents'][number]

// The SQL editor's loaded-snippet type. Discriminated on `type` so database SQL
// (`SqlSnippets.Content`, Postgres brand) and logs SQL (`LogSqlSnippets.Content`,
// logs brand) can never cross execution paths: reading `snippet.content.unchecked_sql`
// on the union yields the widened brand, forcing callers that need one specific
// brand to narrow on `type` first. The shared field names (`content_id`,
// `unchecked_sql`, `schema_version`) keep the many read sites that only need the
// SQL text compiling unchanged.
//
// `report` is included because the content endpoints' wire type carries it, but
// it deliberately has NO SQL content (`content?: never`): report bodies are
// `Dashboards.Content` and are loaded through the separate `Content` union
// (data/content/content-query.ts), never with SQL here. Modelling it as `never`
// (rather than reusing `SqlSnippets.Content`) keeps that honest while letting the
// broadly-typed rows the content/folder queries return assign without a cast.
export type SnippetWithContent = Omit<Snippet, 'type'> & { status: SnippetStatus } & (
    | { type: 'sql'; content?: SqlSnippets.Content }
    | { type: 'log_sql'; content?: LogSqlSnippets.Content }
    | { type: 'report'; content?: never }
  )

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
