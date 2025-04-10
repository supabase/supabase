import { useRouter } from 'next/router'
import { useCallback, useEffect } from 'react'

import { useParams } from 'common'
import { useIsTableEditorTabsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { TableGridEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import TableEditorLayout from 'components/layouts/TableEditorLayout/TableEditorLayout'
import TableEditorMenu from 'components/layouts/TableEditorLayout/TableEditorMenu'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { TablesData } from 'data/tables/tables-query'
import { addTab, createTabId, getTabsStore } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

const TableEditorPage: NextPageWithLayout = () => {
  const { id: _id, ref: projectRef } = useParams()
  const id = _id ? Number(_id) : undefined
  const store = getTabsStore(projectRef)

  const { project } = useProjectContext()
  const { data: selectedTable, isLoading } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    id,
  })

  const router = useRouter()
  const onAfterDeleteTable = useCallback(
    (tables: TablesData) => {
      // For simplicity for now, we just open the first table within the same schema
      if (tables.length > 0) {
        router.push(`/project/${projectRef}/editor/${tables[0].id}`)
      } else {
        router.push(`/project/${projectRef}/editor`)
      }
    },
    [router, projectRef]
  )

  /**
   * Effect: Creates or updates tab when table is loaded
   * Runs when:
   * - selectedTable changes (when a new table is loaded)
   * - id changes (when URL parameter changes)
   */
  const isTableEditorTabsEnabled = useIsTableEditorTabsEnabled()

  useEffect(() => {
    // tabs preview flag logic
    if (isTableEditorTabsEnabled && selectedTable && projectRef) {
      const tabId = createTabId(selectedTable.entity_type, { id: selectedTable.id })
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
  }, [selectedTable, id, projectRef, isTableEditorTabsEnabled])

  return (
    <>
      <TableGridEditor isLoadingSelectedTable={isLoading} selectedTable={selectedTable} />
      <DeleteConfirmationDialogs
        selectedTable={selectedTable}
        onAfterDeleteTable={onAfterDeleteTable}
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
