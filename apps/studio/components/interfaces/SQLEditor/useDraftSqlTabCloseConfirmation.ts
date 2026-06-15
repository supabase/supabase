import { useCallback, useMemo, useState } from 'react'

import {
  clearPersistedDraftSqlTab,
  countDraftSqlTabsRequiringCloseConfirmation,
  getDiscardDraftSqlTabsDialogCopy,
  getDraftSqlTabSql,
} from './createDraftSqlTab'
import { getSqlEditorV2StateSnapshot, useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import type { Tab } from '@/state/tabs'

type TabsSnapshot = {
  tabsMap: Record<string, Tab | undefined>
}

type PendingClose = {
  execute: () => void
  unsavedDraftTabCount: number
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

  const cleanupDraftTabs = useCallback(
    (tabIds: string[]) => {
      if (!projectRef) return

      for (const tabId of tabIds) {
        const tab = tabs.tabsMap[tabId]
        const sqlId = tab?.metadata?.sqlId

        if (tab?.type !== 'sql' || !tab.metadata?.isDraft || !sqlId) continue

        clearPersistedDraftSqlTab(projectRef, sqlId)
        snapV2.removeSnippet(sqlId, true)
      }
    },
    [projectRef, snapV2, tabs.tabsMap]
  )

  const requestClose = useCallback(
    (tabIds: string[], execute: () => void) => {
      const unsavedDraftTabCount = countDraftSqlTabsRequiringCloseConfirmation(
        tabIds,
        tabs.tabsMap,
        getTabSql
      )

      if (unsavedDraftTabCount === 0) {
        cleanupDraftTabs(tabIds)
        execute()
        return
      }

      setPendingClose({
        unsavedDraftTabCount,
        execute: () => {
          cleanupDraftTabs(tabIds)
          execute()
        },
      })
    },
    [cleanupDraftTabs, getTabSql, tabs.tabsMap]
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
    () => getDiscardDraftSqlTabsDialogCopy(pendingClose?.unsavedDraftTabCount ?? 0),
    [pendingClose?.unsavedDraftTabCount]
  )

  return {
    requestClose,
    requestCloseSingle,
    modalProps,
    dialogCopy,
  }
}
