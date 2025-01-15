import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get } from 'data/fetchers'
import type { Dashboards, LogSqlSnippets, SqlSnippets } from 'types'
import { contentKeys } from './keys'
import { createTabId, getTabsStore, removeTabs } from 'state/tabs'
import { getRecentItemsByType, removeRecentItems } from 'state/recent-items'

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

  // handle recent items

  // these are tabs that are static content
  // these canot be removed from localstorage based on this query request
  const IGNORED_TAB_IDS = ['sql-templates', 'sql-quickstarts']

  // get current content ids
  const currentContentIds = [
    ...response.data
      .filter((content: Content) => content.type === 'sql')
      .map((content: Content) => createTabId('sql', { id: content.id })),
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

export const useContentQuery = <TData = ContentData>(
  { projectRef, type }: GetContentVariables,
  { enabled = true, ...options }: UseQueryOptions<ContentData, ContentError, TData> = {}
) =>
  useQuery<ContentData, ContentError, TData>(
    contentKeys.list(projectRef, type),
    ({ signal }) => getContent({ projectRef, type }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
