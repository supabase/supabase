import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import { buildTableEditorUrl } from 'components/grid/SupabaseGrid.utils'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { DefaultLayout } from 'components/layouts/DefaultLayout'
import { EditorBaseLayout } from 'components/layouts/editors/EditorBaseLayout'
import { TableEditorLayout } from 'components/layouts/TableEditorLayout/TableEditorLayout'
import { TableEditorMenu } from 'components/layouts/TableEditorLayout/TableEditorMenu'
import { NewTab } from 'components/layouts/Tabs/NewTab'
import { useDashboardHistory } from 'hooks/misc/useDashboardHistory'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { editorEntityTypes, Tab, useTabsStateSnapshot } from 'state/tabs'
import type { NextPageWithLayout } from 'types'

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
    if (isHistoryLoaded) {
      const lastOpenedTable = history.editor
      const lastTabId = tabStore.openTabs.find((id) =>
        editorEntityTypes.table.includes(tabStore.tabsMap[id]?.type)
      )

      let lastOpenedTableData: Tab | undefined
      if (lastOpenedTable !== undefined) {
        lastOpenedTableData = tabStore.tabsMap[lastOpenedTable]
      }

      // Handle redirect to last opened table tab, or last table tab
      if (lastOpenedTableData) {
        router.push(buildTableEditorUrl(projectRef!, lastOpenedTableData.metadata?.tableId!))
      } else if (lastTabId) {
        const lastTab = tabStore.tabsMap[lastTabId]
        if (lastTab) router.push(buildTableEditorUrl(projectRef!, lastTab.metadata?.tableId!))
      }
    }
  }, [isHistoryLoaded])

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
