import { useParams } from 'common'
import { useFeaturePreviewContext } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import SidePanelEditor from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { EditorBaseLayout } from 'components/layouts/editors/editor-base-layout'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import TableEditorMenu from 'components/layouts/TableEditorLayout/TableEditorMenu'
import { NewTab } from 'components/layouts/tabs/new-tab'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useRouter } from 'next/router'
import { editorEntityTypes, getTabsStore } from 'state/tabs'
import type { NextPageWithLayout } from 'types'
import EmptyState from 'components/interfaces/TableGridEditor/EmptyState'

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
  <ProjectContextFromParamsProvider>
    <EditorBaseLayout productMenu={<TableEditorMenu />} product="Table Editor">
      <TableEditorLayout>{page}</TableEditorLayout>
    </EditorBaseLayout>
  </ProjectContextFromParamsProvider>
)

export default TableEditorPage
