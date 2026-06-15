import { useCallback, useMemo, useState } from 'react'

import {
  clearPersistedDraftSqlTab,
  countSqlTabsRequiringCloseConfirmation,
  getDiscardSqlTabsDialogCopy,
  getDraftSqlTabSql,
} from './createDraftSqlTab'
import { getSqlEditorV2StateSnapshot, useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import type { Tab } from '@/state/tabs'

type TabsSnapshot = {
  tabsMap: Record<string, Tab | undefined>
}

type PendingClose = {
  execute: () => void
  unsavedSqlTabCount: number
}

export function useDraftSqlTabCloseConfirmation({
  projectRef,
  tabs,
}: {
  projectRef?: string
  tabs: TabsSnapshot
}) {
  const [pendingClose, setPendingClose] = useState<PendingClose | null>(null)
  const snapV2 = useSqlEditorV2StateSnapshot()

  const getTabSql = useCallback(
    (tabId: string) => {
      const tab = tabs.tabsMap[tabId]
      const sqlId = tab?.metadata?.sqlId
      if (!sqlId) return ''

      const snippetSql =
        getSqlEditorV2StateSnapshot().snippets[sqlId]?.snippet?.content?.unchecked_sql

      return getDraftSqlTabSql({ projectRef, sqlId, snippetSql })
    },
    [projectRef, tabs.tabsMap]
  )

  const getSavedSql = useCallback(
    (tabId: string) => {
      const tab = tabs.tabsMap[tabId]
      const sqlId = tab?.metadata?.sqlId
      if (!sqlId) return undefined

      return getSqlEditorV2StateSnapshot().savedSql[sqlId]
    },
    [tabs.tabsMap]
  )

  const discardUnsavedSqlChanges = useCallback(
    (tabIds: string[]) => {
      if (!projectRef) return

      for (const tabId of tabIds) {
        const tab = tabs.tabsMap[tabId]
        const sqlId = tab?.metadata?.sqlId

        if (tab?.type !== 'sql' || !sqlId) continue

        if (tab.metadata?.isDraft) {
          clearPersistedDraftSqlTab(projectRef, sqlId)
          snapV2.removeSnippet(sqlId, true)
        } else {
          const savedSql = getSqlEditorV2StateSnapshot().savedSql[sqlId]
          if (savedSql !== undefined) {
            snapV2.setSql({ id: sqlId, sql: savedSql, skipSave: true })
          }
        }
      }
    },
    [projectRef, snapV2, tabs.tabsMap]
  )

  const requestClose = useCallback(
    (tabIds: string[], execute: () => void) => {
      const unsavedSqlTabCount = countSqlTabsRequiringCloseConfirmation(
        tabIds,
        tabs.tabsMap,
        getTabSql,
        getSavedSql
      )

      if (unsavedSqlTabCount === 0) {
        discardUnsavedSqlChanges(tabIds)
        execute()
        return
      }

      setPendingClose({
        unsavedSqlTabCount,
        execute: () => {
          discardUnsavedSqlChanges(tabIds)
          execute()
        },
      })
    },
    [discardUnsavedSqlChanges, getSavedSql, getTabSql, tabs.tabsMap]
  )

  const requestCloseSingle = useCallback(
    (tabId: string, execute: () => void) => {
      requestClose([tabId], execute)
    },
    [requestClose]
  )

  const confirmClose = useCallback(() => {
    pendingClose?.execute()
    setPendingClose(null)
  }, [pendingClose])

  const cancelClose = useCallback(() => {
    setPendingClose(null)
  }, [])

  const modalProps = useMemo(
    () => ({
      visible: pendingClose !== null,
      onClose: confirmClose,
      onCancel: cancelClose,
    }),
    [cancelClose, confirmClose, pendingClose]
  )

  const dialogCopy = useMemo(
    () => getDiscardSqlTabsDialogCopy(pendingClose?.unsavedSqlTabCount ?? 0),
    [pendingClose?.unsavedSqlTabCount]
  )

  return {
    requestClose,
    requestCloseSingle,
    modalProps,
    dialogCopy,
  }
}
