import { useParams } from 'common'
import { useFeaturePreviewContext } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import EmptyState from 'components/interfaces/TableGridEditor/EmptyState'
import SidePanelEditor from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import TableEditorMenu from 'components/layouts/TableEditorLayout/TableEditorMenu'
import { NewTab } from 'components/layouts/Tabs/NewTab'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useRouter } from 'next/router'
import { editorEntityTypes, getTabsStore } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const router = useRouter()

  const onTableCreated = (table: { id: number }) => {
    router.push(`/project/${projectRef}/editor/${table.id}`)
  }

  // tabs preview logic
  // handle redirect to last table tab
  const tabStore = getTabsStore(projectRef)
  const { flags } = useFeaturePreviewContext()
  const isTableEditorTabsEnabled = flags[LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS]
  if (isTableEditorTabsEnabled) {
    const lastTabId = tabStore.openTabs
      .filter((id) => editorEntityTypes.table.includes(tabStore.tabsMap[id]?.type))
      .pop()
    if (lastTabId) {
      const lastTab = tabStore.tabsMap[lastTabId]
      if (lastTab) {
        router.push(`/project/${projectRef}/editor/${lastTab.metadata?.tableId}`)
      }
    }
  }
  // end of tabs preview logic

  return (
    <>
      {isTableEditorTabsEnabled ? <NewTab /> : <EmptyState />}

      <SidePanelEditor onTableCreated={onTableCreated} />
    </>
  )
}

TableEditorPage.getLayout = (page) => (
  <DefaultLayout>
    <EditorBaseLayout productMenu={<TableEditorMenu />} product="Table Editor">
      <TableEditorLayout>{page}</TableEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default TableEditorPage
