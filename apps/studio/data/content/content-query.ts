import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { Dashboards, LogSqlSnippets, SqlSnippets } from 'types'
import { contentKeys } from './keys'

export type ContentBase = components['schemas']['GetUserContentResponse']['data'][number]

export type Content = Omit<ContentBase, 'content' | 'type'> &
  (
    | {
        type: 'sql'
        content: SqlSnippets.Content
      }
    | {
        type: 'report'
        content: Dashboards.Content
      }
    | {
        type: 'log_sql'
        content: LogSqlSnippets.Content
      }
  )

export type ContentType = Content['type']

interface GetContentVariables {
  projectRef?: string
  type: ContentType
  name?: string
  limit?: number
}

export async function getContent(
  { projectRef, type, name, limit = 10 }: GetContentVariables,
  signal?: AbortSignal
) {
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getContent')
  }

  const { data, error } = await get('/platform/projects/{ref}/content', {
    params: { path: { ref: projectRef }, query: { type, name, limit: limit.toString() } },
    signal,
  })

  if (error) handleError(error)

  return {
    cursor: data.cursor,
    content: data.data as unknown as Content[],
  }
}

export type ContentData = Awaited<ReturnType<typeof getContent>>
export type ContentError = unknown

/** @deprecated Use useContentInfiniteQuery from content-infinite-query instead */
export const useContentQuery = <TData = ContentData>(
  { projectRef, type, name, limit }: GetContentVariables,
  { enabled = true, ...options }: UseQueryOptions<ContentData, ContentError, TData> = {}
) =>
  useQuery<ContentData, ContentError, TData>(
    contentKeys.list(projectRef, { type, name, limit }),
    ({ signal }) => getContent({ projectRef, type, name, limit }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
