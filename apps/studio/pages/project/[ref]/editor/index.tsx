import { useParams } from 'common'
import EmptyState from 'components/interfaces/TableGridEditor/EmptyState'
import SidePanelEditor from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { EditorBaseLayout } from 'components/layouts/editors/editor-base-layout'
import { HandleEditorLayouts } from 'components/layouts/editors/handle-editor-layouts'
import { ProjectContextFromParamsProvider } from 'components/layouts/ProjectLayout/ProjectContext'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import TableEditorMenu from 'components/layouts/TableEditorLayout/TableEditorMenu'
import { NewTab } from 'components/layouts/tabs/new-tab'
import { useRouter } from 'next/router'
import { getTabsStore } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const store = getTabsStore(projectRef)
  const router = useRouter()

  const onTableCreated = (table: { id: number }) => {
    router.push(`/project/${projectRef}/editor/${table.id}`)
  }

  // handle redirect to last table tab
  const lastTabId = store.openTabs.filter((id) => store.tabsMap[id]?.type === 'table').pop()
  if (lastTabId) {
    const lastTab = store.tabsMap[lastTabId]
    if (lastTab) {
      router.push(`/project/${projectRef}/editor/${lastTab.metadata?.tableId}`)
    }
  }

  return (
    <>
      <NewTab />
      <SidePanelEditor onTableCreated={onTableCreated} />
    </>
  )
}

TableEditorPage.getLayout = (page) => (
  <ProjectContextFromParamsProvider>
    <EditorBaseLayout productMenu={<TableEditorMenu />}>
      <TableEditorLayout>{page}</TableEditorLayout>
    </EditorBaseLayout>
  </ProjectContextFromParamsProvider>
)

export default TableEditorPage
