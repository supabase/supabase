import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get } from 'data/fetchers'
import type { Dashboards, LogSqlSnippets, SqlSnippets } from 'types'
import { contentKeys } from './keys'

export type ContentBase = components['schemas']['GetUserContentObject']

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
}

export async function getContent({ projectRef, type }: GetContentVariables, signal?: AbortSignal) {
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getContent')
  }

  const { data, error } = await get('/platform/projects/{ref}/content', {
    params: { path: { ref: projectRef }, query: { type } },
    signal,
  })

  if (error) {
    throw error
  }

  return {
    cursor: data.cursor,
    content: data.data as unknown as Content[],
  }
}

export type ContentData = Awaited<ReturnType<typeof getContent>>
export type ContentError = unknown

export const useContentQuery = <TData = ContentData>(
  { projectRef, type }: GetContentVariables,
  { enabled = true, ...options }: UseQueryOptions<ContentData, ContentError, TData> = {}
) =>
  useQuery<ContentData, ContentError, TData>(
    contentKeys.list(projectRef, type),
    ({ signal }) => getContent({ projectRef, type }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
