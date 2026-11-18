import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { buildTableEditorUrl } from '@/components/grid/SupabaseGrid.utils'
import { SidePanelEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { NewTab } from '@/components/layouts/Tabs/NewTab'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { splitInternalUrl } from '@/lib/internal-url'
import { editorEntityTypes, useTabsStateSnapshot } from '@/state/tabs'

export const Route = createFileRoute('/project/$ref/editor/')({
  component: TableEditorPage,
})

function TableEditorPage() {
  const navigate = useNavigate()
  const { ref: projectRef } = Route.useParams()
  const tabStore = useTabsStateSnapshot()
  const { selectedSchema } = useQuerySchemaState()
  const { history, isHistoryLoaded } = useDashboardHistory()

  const onTableCreated = (table: { id: number }) => {
    void navigate({
      to: '/project/$ref/editor/$id',
      params: { ref: projectRef, id: String(table.id) },
      search: !!selectedSchema ? { schema: selectedSchema } : undefined,
    })
  }

  // buildTableEditorUrl returns an absolute URL (origin + basePath); split it so the
  // router navigates client-side instead of treating it as a document navigation
  const navigateToTable = (url: string) => {
    const { to, search } = splitInternalUrl(url)
    void navigate({ to, search })
  }

  useEffect(() => {
    if (isHistoryLoaded && projectRef) {
      const lastOpenedTableId = Number(history.editor)
      const lastTableTabId = tabStore.openTabs.find((id) =>
        editorEntityTypes.table.includes(tabStore.tabsMap[id]?.type)
      )
      const lastTableTab = lastTableTabId ? tabStore.tabsMap[lastTableTabId] : undefined
      const lastTabId = lastTableTab?.metadata?.tableId

      // Handle redirect to last opened table tab, or last table tab
      if (Number.isInteger(lastOpenedTableId)) {
        // Tabs are keyed by a prefixed id (e.g. "r-293522"), but history only stores
        // the bare table id, so look up the tab by its metadata instead of by key.
        const lastOpenedTableData = Object.values(tabStore.tabsMap).find(
          (tab) =>
            editorEntityTypes.table.includes(tab.type) &&
            tab.metadata?.tableId === lastOpenedTableId
        )
        navigateToTable(
          buildTableEditorUrl({
            projectRef,
            tableId: lastOpenedTableId,
            schema: lastOpenedTableData?.metadata?.schema,
          })
        )
      } else if (lastTabId !== undefined) {
        navigateToTable(
          buildTableEditorUrl({
            projectRef,
            tableId: lastTabId,
            schema: lastTableTab?.metadata?.schema,
          })
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryLoaded, projectRef])

  return (
    <>
      <NewTab />
      <SidePanelEditor onTableCreated={onTableCreated} />
    </>
  )
}
