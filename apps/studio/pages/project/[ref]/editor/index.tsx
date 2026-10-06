import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { buildTableEditorUrl } from '@/components/grid/SupabaseGrid.utils'
import { SidePanelEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { EditorBaseLayout } from '@/components/layouts/editors/EditorBaseLayout'
import { TableEditorLayout } from '@/components/layouts/TableEditorLayout/TableEditorLayout'
import { TableEditorMenu } from '@/components/layouts/TableEditorLayout/TableEditorMenu'
import { NewTab } from '@/components/layouts/Tabs/NewTab'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { editorEntityTypes, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const TableEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const tabStore = useTabsStateSnapshot()
  const { selectedSchema } = useQuerySchemaState()
  const { history, isHistoryLoaded } = useDashboardHistory()

  const onTableCreated = (table: { id: number }) => {
    router.push(
      `/project/${projectRef}/editor/${table.id}${!!selectedSchema ? `?schema=${selectedSchema}` : ''}`
    )
  }

  useEffect(() => {
    if (isHistoryLoaded && projectRef && router) {
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
        router.push(
          buildTableEditorUrl({
            projectRef,
            tableId: lastOpenedTableId,
            schema: lastOpenedTableData?.metadata?.schema,
          })
        )
      } else if (lastTabId !== undefined) {
        router.push(
          buildTableEditorUrl({
            projectRef,
            tableId: lastTabId,
            schema: lastTableTab?.metadata?.schema,
          })
        )
      }
    }
    // router is intentionally excluded: in the TanStack build useRouter() returns a
    // new object on every navigation-related render, and including it here caused
    // this effect to re-fire mid-navigation and push the same redirect repeatedly,
    // freezing the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryLoaded, projectRef])

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
