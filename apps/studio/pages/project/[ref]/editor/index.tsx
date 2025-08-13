import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import SidePanelEditor from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import { TableEditorMenu } from 'components/layouts/TableEditorLayout/TableEditorMenu'
import { NewTab } from 'components/layouts/Tabs/NewTab'
import { useAppStateSnapshot } from 'state/app-state'
import { editorEntityTypes, useTabsStateSnapshot } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const tabStore = useTabsStateSnapshot()
  const appSnap = useAppStateSnapshot()

  const onTableCreated = (table: { id: number }) => {
    router.push(`/project/${projectRef}/editor/${table.id}`)
  }

  useEffect(() => {
    const lastOpenedTab = appSnap.dashboardHistory.editor

    const lastTabId = tabStore.openTabs.find((id) =>
      editorEntityTypes.table.includes(tabStore.tabsMap[id]?.type)
    )
    if (lastOpenedTab !== undefined) {
      router.push(`/project/${projectRef}/editor/${appSnap.dashboardHistory.editor}`)
    } else if (lastTabId) {
      // Handle redirect to last opened table tab, or last table tab
      const lastTab = tabStore.tabsMap[lastTabId]
      if (lastTab) router.push(`/project/${projectRef}/editor/${lastTab.metadata?.tableId}`)
    }
  }, [])

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
