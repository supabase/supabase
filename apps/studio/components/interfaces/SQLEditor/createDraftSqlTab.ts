import type { NextRouter } from 'next/router'

import {
  persistDraftSqlTab,
  readPersistedDraftSqlTab,
  removePersistedDraftSqlTab,
} from './draftSqlTabStorage.utils'
import { generateSnippetTitle } from './SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from './SQLEditor.utils'
import { generateUuid } from '@/lib/api/snippets.browser'
import type { QueryExecutionSource } from '@/state/query-execution-source'
import type { SnippetWithContent } from '@/state/sql-editor-v2'
import { createTabId } from '@/state/tabs'

type SqlEditorV2Actions = {
  addSnippet: (args: { projectRef: string; snippet: SnippetWithContent }) => void
}

type TabsActions = {
  addTab: (tab: {
    id: string
    type: 'sql'
    label?: string
    metadata?: {
      sqlId?: string
      name?: string
      isDraft?: boolean
    }
    isPreview?: boolean
  }) => void
}

export type CreateDraftSqlTabParams = {
  projectRef: string
  projectId: number
  ownerId: number
  snapV2: SqlEditorV2Actions
  tabs: TabsActions
  router?: NextRouter
  initialSql?: string
  querySource?: QueryExecutionSource
  /** When true, only registers state without changing the route */
  skipNavigation?: boolean
}

export function createDraftSqlTab({
  projectRef,
  projectId,
  ownerId,
  snapV2,
  tabs,
  router,
  initialSql = '',
  querySource = 'database',
  skipNavigation = false,
}: CreateDraftSqlTabParams): string {
  const name = generateSnippetTitle()
  const draftId = generateUuid([`${name}.sql`, Date.now().toString()])

  const snippet = createSqlSnippetSkeletonV2({
    idOverride: draftId,
    name,
    sql: initialSql,
    owner_id: ownerId,
    project_id: projectId,
    querySource,
  })

  snippet.isDraftTab = true

  snapV2.addSnippet({ projectRef, snippet })

  persistDraftSqlTab(projectRef, draftId, {
    sql: initialSql,
    name,
    querySource,
  })

  tabs.addTab({
    id: createTabId('sql', { id: draftId }),
    type: 'sql',
    label: name,
    metadata: {
      sqlId: draftId,
      name,
      isDraft: true,
    },
  })

  if (!skipNavigation && router) {
    void router.push(`/project/${projectRef}/sql/${draftId}`)
  }

  return draftId
}

export function restoreDraftSqlTab({
  draftId,
  projectRef,
  projectId,
  ownerId,
  snapV2,
  name = generateSnippetTitle(),
  initialSql = '',
  querySource = 'database',
}: Omit<CreateDraftSqlTabParams, 'tabs' | 'router' | 'skipNavigation'> & {
  draftId: string
  name?: string
  initialSql?: string
}) {
  const persisted = readPersistedDraftSqlTab(projectRef, draftId)
  const resolvedName = persisted?.name ?? name
  const resolvedSql = persisted?.sql ?? initialSql
  const resolvedQuerySource = persisted?.querySource ?? querySource

  const snippet = createSqlSnippetSkeletonV2({
    idOverride: draftId,
    name: resolvedName,
    sql: resolvedSql,
    owner_id: ownerId,
    project_id: projectId,
    querySource: resolvedQuerySource,
  })

  snippet.isDraftTab = true
  snapV2.addSnippet({ projectRef, snippet })
}

export function clearPersistedDraftSqlTab(projectRef: string, draftId: string) {
  removePersistedDraftSqlTab(projectRef, draftId)
}

export function restoreOpenDraftSqlTabs({
  projectRef,
  projectId,
  ownerId,
  snapV2,
  openTabs,
  tabsMap,
  existingSnippetIds,
}: {
  projectRef: string
  projectId: number
  ownerId: number
  snapV2: SqlEditorV2Actions
  openTabs: string[]
  tabsMap: Record<string, { type: string; metadata?: { sqlId?: string; isDraft?: boolean } }>
  existingSnippetIds: Set<string>
}) {
  const openDraftIds: string[] = []

  for (const tabId of openTabs) {
    const tab = tabsMap[tabId]
    if (tab?.type !== 'sql' || !tab.metadata?.isDraft || !tab.metadata.sqlId) {
      continue
    }

    openDraftIds.push(tab.metadata.sqlId)

    if (existingSnippetIds.has(tab.metadata.sqlId)) {
      continue
    }

    restoreDraftSqlTab({
      draftId: tab.metadata.sqlId,
      projectRef,
      projectId,
      ownerId,
      snapV2,
      name: tab.metadata.name,
    })
  }

  return openDraftIds
}

export function isDraftSqlSnippet(
  snippet: Pick<SnippetWithContent, 'isDraftTab' | 'isNotSavedInDatabaseYet'> | undefined
) {
  return snippet?.isDraftTab === true
}

export function getOpenDraftSqlTabIds(
  openTabs: string[],
  tabsMap: Record<string, { type?: string; metadata?: { sqlId?: string; isDraft?: boolean } }>
) {
  const ids = new Set<string>()

  for (const tabId of openTabs) {
    const tab = tabsMap[tabId]
    if (tab?.type === 'sql' && tab.metadata?.isDraft && tab.metadata.sqlId) {
      ids.add(tab.metadata.sqlId)
    }
  }

  return ids
}

export function shouldHideDraftSqlTabFromNav(
  snippetId: string,
  openDraftIds: Set<string>,
  snippet?: Pick<SnippetWithContent, 'isDraftTab' | 'isNotSavedInDatabaseYet'>
) {
  if (openDraftIds.has(snippetId)) return true
  if (isDraftSqlSnippet(snippet)) return true
  if (snippet?.isNotSavedInDatabaseYet) return true
  return false
}
