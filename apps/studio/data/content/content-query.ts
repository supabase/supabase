import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { getRecentItemsByType, removeRecentItems } from 'state/recent-items'
import { createTabId, getTabsStore, removeTabs } from 'state/tabs'
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

  // handle recent items

  // these are tabs that are static content
  // these canot be removed from localstorage based on this query request
  const IGNORED_TAB_IDS = ['sql-templates', 'sql-quickstarts']

  // get current content ids
  const currentContentIds = [
    ...data.data
      .filter((content) => content.type === 'sql')
      .map((content) => createTabId('sql', { id: content.id })),
    // append ignored tab IDs
    ...IGNORED_TAB_IDS,
  ]

  // handle local tabs
  // checks IDs against localstorage state
  const tabsStore = getTabsStore(projectRef)
  const tabIds = tabsStore.openTabs.filter((id: string) => !currentContentIds.includes(id))
  // attempts to remove tabs that are no longer in the response
  removeTabs(projectRef, tabIds)

  // handle recent items
  const recentItems = getRecentItemsByType(projectRef, 'sql')
  // remove recent items that are no longer in the response
  removeRecentItems(
    projectRef,
    // tabIds that are no longer in the response
    recentItems
      ? recentItems.filter((item) => !currentContentIds.includes(item.id)).map((item) => item.id)
      : []
  )

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
