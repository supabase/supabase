import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import { LOAD_TAB_FROM_CACHE_PARAM } from 'components/grid/SupabaseGrid.utils'
import SidePanelEditor from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import { TableEditorMenu } from 'components/layouts/TableEditorLayout/TableEditorMenu'
import { NewTab } from 'components/layouts/Tabs/NewTab'
import { useDashboardHistory } from 'hooks/misc/useDashboardHistory'
import { editorEntityTypes, useTabsStateSnapshot } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const tabStore = useTabsStateSnapshot()
  const { history, isHistoryLoaded } = useDashboardHistory()

  const onTableCreated = (table: { id: number }) => {
    router.push(`/project/${projectRef}/editor/${table.id}`)
  }

  useEffect(() => {
    if (isHistoryLoaded) {
      const lastOpenedTable = history.editor
      const lastTabId = tabStore.openTabs.find((id) =>
        editorEntityTypes.table.includes(tabStore.tabsMap[id]?.type)
      )

      // Handle redirect to last opened table tab, or last table tab
      if (lastOpenedTable !== undefined) {
        router.push(
          `/project/${projectRef}/editor/${history.editor}?${LOAD_TAB_FROM_CACHE_PARAM}=true`
        )
      } else if (lastTabId) {
        const lastTab = tabStore.tabsMap[lastTabId]
        if (lastTab)
          router.push(
            `/project/${projectRef}/editor/${lastTab.metadata?.tableId}?${LOAD_TAB_FROM_CACHE_PARAM}=true`
          )
      }
    }
  }, [isHistoryLoaded])

  return (
    <>
      <NewTab />
      <SidePanelEditor onTableCreated={onTableCreated} />
    </>
  )
}

TableEditorPage.getLayout = (page) => (
  <DefaultLayout>
    <EditorBaseLayout
      productMenu={<TableEditorMenu />}
      product="Table Editor"
      productMenuClassName="overflow-y-hidden"
    >
      <TableEditorLayout>{page}</TableEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default TableEditorPage
