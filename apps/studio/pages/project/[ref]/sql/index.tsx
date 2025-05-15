import { useParams } from 'common'
import { useIsSQLEditorTabsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from 'components/layouts/SQLEditorLayout/SQLEditorMenu'
import { NewTab } from 'components/layouts/Tabs/NewTab'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { useTabsStateSnapshot } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const store = useTabsStateSnapshot()
  const appSnap = useAppStateSnapshot()
  const isSqlEditorTabsEnabled = useIsSQLEditorTabsEnabled()

  useEffect(() => {
    if (!isSqlEditorTabsEnabled) {
      // Redirect to /new if not using tabs
      router.push(`/project/${projectRef}/sql/new`)
    } else {
      // Handle redirect to last opened snippet tab, or last snippet tab
      const lastOpenedTab = appSnap.dashboardHistory.sql
      const lastTabId = store.openTabs.find((id) => store.tabsMap[id]?.type === 'sql')
      if (lastOpenedTab !== undefined) {
        router.push(`/project/${projectRef}/sql/${appSnap.dashboardHistory.sql}`)
      } else if (lastTabId) {
        const lastTab = store.tabsMap[lastTabId]
        if (lastTab) router.push(`/project/${projectRef}/sql/${lastTab.id.replace('sql-', '')}`)
      }
    }
  }, [isSqlEditorTabsEnabled])

  return isSqlEditorTabsEnabled ? <NewTab /> : null
}

TableEditorPage.getLayout = (page) => (
  <DefaultLayout>
    <EditorBaseLayout productMenu={<SQLEditorMenu />} product="SQL Editor">
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default TableEditorPage
