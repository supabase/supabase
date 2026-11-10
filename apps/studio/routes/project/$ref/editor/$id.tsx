import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect } from 'react'

import { TableGridEditor } from '@/components/interfaces/TableGridEditor/TableGridEditor'
import { useTableEditorQuery } from '@/data/table-editor/table-editor-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const Route = createFileRoute('/project/$ref/editor/$id')({
  component: TableEditorPage,
})

function TableEditorPage() {
  const { id: _id, ref: projectRef } = useParams()
  const id = _id ? Number(_id) : undefined
  const store = useTabsStateSnapshot()

  const { data: project } = useSelectedProjectQuery()
  const { data: selectedTable, isPending: isLoading } = useTableEditorQuery({
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
      const tabId = createTabId(selectedTable.entity_type, { id: selectedTable.id })
      if (!store.tabsMap[tabId]) {
        store.addTab({
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
        store.makeTabActive(tabId)
      }
    }
  }, [selectedTable, id, projectRef])

  return <TableGridEditor isLoadingSelectedTable={isLoading} selectedTable={selectedTable} />
}
