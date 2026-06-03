import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import DefaultLayout from '@/components/layouts/DefaultLayout'
import { EditorBaseLayout } from '@/components/layouts/editors/EditorBaseLayout'
import SQLEditorLayout from '@/components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from '@/components/layouts/SQLEditorLayout/SQLEditorMenu'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { isSqlEditorTab, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const SQLEditorIndexPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const store = useTabsStateSnapshot()

  const { history, isHistoryLoaded } = useDashboardHistory()

  useEffect(() => {
    if (isHistoryLoaded) {
      // Handle redirect to last opened snippet tab, or last snippet tab
      const lastOpenedTab = history.sql
      const activeTab = store.activeTab ? store.tabsMap[store.activeTab] : undefined
      const lastTabId = store.openTabs.find((id) => isSqlEditorTab(id, store.tabsMap))
      if (activeTab?.type === 'chat' && activeTab.metadata?.chatId) {
        router.replace(`/project/${projectRef}/sql/chats/${activeTab.metadata.chatId}`)
      } else if (lastOpenedTab !== undefined) {
        router.replace(`/project/${projectRef}/sql/${history.sql}`)
      } else if (lastTabId) {
        const lastTab = store.tabsMap[lastTabId]
        if (lastTab?.type === 'notebook' && lastTab.metadata?.notebookId) {
          router.replace(`/project/${projectRef}/sql/notebooks/${lastTab.metadata.notebookId}`)
        } else if (lastTab?.type === 'chat' && lastTab.metadata?.chatId) {
          router.replace(`/project/${projectRef}/sql/chats/${lastTab.metadata.chatId}`)
        } else if (lastTab?.metadata?.sqlId) {
          router.replace(`/project/${projectRef}/sql/${lastTab.metadata.sqlId}`)
        }
      } else {
        router.replace(`/project/${projectRef}/sql/new?skip=true`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryLoaded])

  return null
}

SQLEditorIndexPage.getLayout = (page) => (
  <DefaultLayout>
    <EditorBaseLayout productMenu={<SQLEditorMenu />}>
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default SQLEditorIndexPage
