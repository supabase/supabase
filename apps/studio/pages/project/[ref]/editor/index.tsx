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
import { editorEntityTypes, useTabsStateSnapshot } from 'state/tabs'
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
    if (isHistoryLoaded && projectRef && router) {
      const lastOpenedTableId = Number(history.editor)
      const lastTabId = Number(
        tabStore.openTabs.find((id) => editorEntityTypes.table.includes(tabStore.tabsMap[id]?.type))
      )

      // Handle redirect to last opened table tab, or last table tab
      if (Number.isInteger(lastOpenedTableId)) {
        const lastOpenedTableData = tabStore.tabsMap[lastOpenedTableId]
        router.push(
          buildTableEditorUrl({
            projectRef,
            tableId: lastOpenedTableId,
            schema: lastOpenedTableData?.metadata?.schema,
          })
        )
      } else if (Number.isInteger(lastTabId)) {
        const lastOpenedTableData = tabStore.tabsMap[lastTabId]
        router.push(
          buildTableEditorUrl({
            projectRef,
            tableId: lastTabId,
            schema: lastOpenedTableData?.metadata?.schema,
          })
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryLoaded, projectRef, router])

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
