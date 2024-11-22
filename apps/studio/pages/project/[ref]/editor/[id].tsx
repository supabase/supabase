import { useParams } from 'common/hooks'
import { TableGridEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import { EditorBaseLayout } from 'components/layouts/editors/editor-base-layout'
import { HandleEditorLayouts } from 'components/layouts/editors/handle-editor-layouts'
import {
  ProjectContextFromParamsProvider,
  useProjectContext,
} from 'components/layouts/ProjectLayout/ProjectContext'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import TableEditorMenu from 'components/layouts/TableEditorLayout/TableEditorMenu'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { addTab, getTabsStore } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const { id: _id, ref: projectRef } = useParams()
  const id = _id ? Number(_id) : undefined
  const store = getTabsStore()

  const { project } = useProjectContext()
  const { data: selectedTable, isLoading } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  /**
   * Effect: Creates or updates tab when table is loaded
   * Runs when:
   * - selectedTable changes (when a new table is loaded)
   * - id changes (when URL parameter changes)
   */
  useEffect(() => {
    if (selectedTable && projectRef) {
      const tabId = `table-${selectedTable.schema}-${selectedTable.name}`

      if (!store.tabsMap[tabId]) {
        addTab({
          id: tabId,
          type: 'table',
          label: selectedTable.name,
          metadata: {
            schema: selectedTable.schema,
            name: selectedTable.name,
            tableId: id,
          },
        })
      } else {
        // If tab already exists, just make it active
        store.activeTab = tabId
      }
    }
  }, [selectedTable, id, projectRef])

  return (
    <>
      <TableGridEditor
        isLoadingSelectedTable={isLoading}
        selectedTable={selectedTable}
        theme={resolvedTheme?.includes('dark') ? 'dark' : 'light'}
      />
      <DeleteConfirmationDialogs
        selectedTable={selectedTable}
        onAfterDeleteTable={(tables) => {
          // For simplicity for now, we just open the first table within the same schema
          if (tables.length > 0) {
            router.push(`/project/${projectRef}/editor/${tables[0].id}`)
          } else {
            router.push(`/project/${projectRef}/editor`)
          }
        }}
      />
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
