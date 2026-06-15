import type { NextRouter } from 'next/router'

import {
  persistDraftSqlTab,
  readPersistedDraftSqlTab,
  removePersistedDraftSqlTab,
} from './draftSqlTabStorage.utils'
import { generateSnippetTitle } from './SQLEditor.constants'
import { createSqlSnippetSkeletonV2 } from './SQLEditor.utils'
import { generateUuid } from '@/lib/api/snippets.browser'
import type { SnippetWithContent } from '@/state/sql-editor-v2'
import { createTabId } from '@/state/tabs'

type SqlEditorV2Actions = {
  addSnippet: (args: { projectRef: string; snippet: SnippetWithContent }) => void
  addNeedsSaving?: (id: string, options?: { saveSql?: boolean }) => void
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
  creationMode?: 'draft' | 'saved'
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
  creationMode = 'draft',
  skipNavigation = false,
}: CreateDraftSqlTabParams): string {
  const name = generateSnippetTitle()
  const snippetId = generateUuid([`${name}.sql`, Date.now().toString()])

  const snippet = createSqlSnippetSkeletonV2({
    idOverride: snippetId,
    name,
    sql: initialSql,
    owner_id: ownerId,
    project_id: projectId,
  })

  if (creationMode === 'draft') {
    snippet.isDraftTab = true
  }

  snapV2.addSnippet({ projectRef, snippet })

  if (creationMode === 'draft') {
    persistDraftSqlTab(projectRef, snippetId, {
      sql: initialSql,
      name,
    })
  } else {
    snapV2.addNeedsSaving?.(snippetId, { saveSql: true })
  }

  tabs.addTab({
    id: createTabId('sql', { id: snippetId }),
    type: 'sql',
    label: name,
    metadata: {
      sqlId: snippetId,
      name,
      ...(creationMode === 'draft' ? { isDraft: true } : {}),
    },
    // New query tabs are permanent (not preview), so opening another one never evicts an existing
    // empty one — each "new query" gets its own tab.
    isPreview: false,
  })

  if (!skipNavigation && router) {
    void router.push(`/project/${projectRef}/sql/${snippetId}`)
  }

  return snippetId
}

export function restoreDraftSqlTab({
  draftId,
  projectRef,
  projectId,
  ownerId,
  snapV2,
  name = generateSnippetTitle(),
  initialSql = '',
}: Omit<CreateDraftSqlTabParams, 'tabs' | 'router' | 'skipNavigation'> & {
  draftId: string
  name?: string
  initialSql?: string
}) {
  const persisted = readPersistedDraftSqlTab(projectRef, draftId)
  const resolvedName = persisted?.name ?? name
  const resolvedSql = persisted?.sql ?? initialSql

  const snippet = createSqlSnippetSkeletonV2({
    idOverride: draftId,
    name: resolvedName,
    sql: resolvedSql,
    owner_id: ownerId,
    project_id: projectId,
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
  openTabs: readonly string[]
  tabsMap: Record<
    string,
    { type: string; metadata?: { sqlId?: string; isDraft?: boolean; name?: string } }
  >
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

type SqlTabLike = {
  type?: string
  metadata?: {
    isDraft?: boolean
    sqlId?: string
  }
}

export function getDraftSqlTabSql({
  projectRef,
  sqlId,
  snippetSql,
}: {
  projectRef?: string
  sqlId: string
  snippetSql?: string
}) {
  if (typeof snippetSql === 'string') return snippetSql
  if (projectRef) return readPersistedDraftSqlTab(projectRef, sqlId)?.sql ?? ''
  return ''
}

export function shouldConfirmCloseSqlTab(
  tab: SqlTabLike | undefined,
  sql: string,
  savedSql?: string
) {
  if (tab?.type !== 'sql' || !tab.metadata?.sqlId) return false
  if (tab.metadata.isDraft) return sql.trim().length > 0
  if (savedSql === undefined) return false
  return sql !== savedSql
}

export function countSqlTabsRequiringCloseConfirmation(
  tabIds: string[],
  tabsMap: Record<string, SqlTabLike | undefined>,
  getTabSql: (tabId: string) => string,
  getSavedSql: (tabId: string) => string | undefined
) {
  return tabIds.filter((tabId) =>
    shouldConfirmCloseSqlTab(tabsMap[tabId], getTabSql(tabId), getSavedSql(tabId))
  ).length
}

export function getDiscardSqlTabsDialogCopy(count: number) {
  if (count <= 1) {
    return {
      title: 'Discard unsaved changes?',
      description: 'This query has unsaved changes. Closing this tab will discard them.',
      confirmLabel: 'Discard query',
    }
  }

  return {
    title: `Close ${count} tabs with unsaved changes?`,
    description: `You are about to close ${count} tabs that have unsaved changes. Their contents will be discarded.`,
    confirmLabel: `Discard ${count} queries`,
  }
}
