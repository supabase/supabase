import { useParams } from 'common/hooks'
import { useFeaturePreviewContext } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { TableGridEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import TableEditorMenu from 'components/layouts/TableEditorLayout/TableEditorMenu'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { addTab, createTabId, getTabsStore } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const { id: _id, ref: projectRef } = useParams()
  const id = _id ? Number(_id) : undefined
  const store = getTabsStore(projectRef)

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
  const { flags } = useFeaturePreviewContext()
  const isTableEditorTabsEnabled = flags[LOCAL_STORAGE_KEYS.UI_TABLE_EDITOR_TABS]
  useEffect(() => {
    // tabs preview flag logic
    if (isTableEditorTabsEnabled) {
      // end of tabs preview flag logic
      if (selectedTable && projectRef) {
        const tabId = createTabId(selectedTable.entity_type, {
          schema: selectedTable.schema,
          name: selectedTable.name,
        })

        if (!store.tabsMap[tabId]) {
          addTab(projectRef, {
            id: tabId,
            type: selectedTable.entity_type,
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
    }
  }, [selectedTable, id, projectRef, isTableEditorTabsEnabled])

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
  <DefaultLayout>
    <EditorBaseLayout productMenu={<TableEditorMenu />} product="Table Editor">
      <TableEditorLayout>{page}</TableEditorLayout>
    </EditorBaseLayout>
  </DefaultLayout>
)

export default TableEditorPage
