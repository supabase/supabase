import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import SQLEditorLayout from 'components/layouts/SQLEditorLayout/SQLEditorLayout'
import { SQLEditorMenu } from 'components/layouts/SQLEditorLayout/SQLEditorMenu'
import { useDashboardHistory } from 'hooks/misc/useDashboardHistory'
import { useTabsStateSnapshot } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const SQLEditorIndexPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const store = useTabsStateSnapshot()

  const { history, isHistoryLoaded } = useDashboardHistory()

  useEffect(() => {
    if (isHistoryLoaded) {
      // Handle redirect to last opened snippet tab, or last snippet tab
      const lastOpenedTab = history.sql
      const lastTabId = store.openTabs.find((id) => store.tabsMap[id]?.type === 'sql')
      if (lastOpenedTab !== undefined) {
        router.replace(`/project/${projectRef}/sql/${history.sql}`)
      } else if (lastTabId) {
        const lastTab = store.tabsMap[lastTabId]
        if (lastTab) {
          router.replace(`/project/${projectRef}/sql/${lastTab.id.replace('sql-', '')}`)
        }
      } else {
        router.replace(`/project/${projectRef}/sql/new`)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryLoaded])

  return null
}

SQLEditorIndexPage.getLayout = (page) => (
  <DefaultLayout>
    <EditorBaseLayout productMenu={<SQLEditorMenu />} product="SQL Editor">
      <SQLEditorLayout>{page}</SQLEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default SQLEditorIndexPage
