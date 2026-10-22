import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'

import { buildTableEditorUrl } from '@/components/grid/SupabaseGrid.utils'
import { SidePanelEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { EditorBaseLayout } from '@/components/layouts/editors/EditorBaseLayout'
import { TableEditorLayout } from '@/components/layouts/TableEditorLayout/TableEditorLayout'
import { TableEditorMenu } from '@/components/layouts/TableEditorLayout/TableEditorMenu'
import { NewTab } from '@/components/layouts/Tabs/NewTab'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { isHistoryTraverseNavigation } from '@/lib/history-traverse'
import { editorEntityTypes, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const TableEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef, schema: explicitSchema } = useParams()
  const tabStore = useTabsStateSnapshot()
  const { selectedSchema } = useQuerySchemaState()
  const { history, isHistoryLoaded } = useDashboardHistory()
  const capturedForRef = useRef<string | null>(null)
  const decidedProjectRef = useRef<string | null>(null)
  const isHistoryTraverseRef = useRef<boolean | null>(null)
  if (isHistoryTraverseRef.current === null) {
    isHistoryTraverseRef.current = isHistoryTraverseNavigation()
  }
  // the ref can show up after the first render. recapture only when it changes
  // from one project to another, so that late ref does not read a settled flag.
  if (projectRef && capturedForRef.current && capturedForRef.current !== projectRef) {
    decidedProjectRef.current = null
    isHistoryTraverseRef.current = isHistoryTraverseNavigation()
  }
  if (projectRef) {
    capturedForRef.current = projectRef
  }

  const onTableCreated = (table: { id: number }) => {
    router.push(
      `/project/${projectRef}/editor/${table.id}${!!selectedSchema ? `?schema=${selectedSchema}` : ''}`
    )
  }

  useEffect(() => {
    if (!isHistoryLoaded || !projectRef || !router.isReady) {
      return
    }

    if (decidedProjectRef.current === projectRef) {
      return
    }

    // decide once per project. a later schema change on the list must not reopen a table.
    decidedProjectRef.current = projectRef

    const lastOpenedTableId = Number(history.editor)
    const hasHistoryTable = Number.isInteger(lastOpenedTableId)
    const lastTableTabId = tabStore.openTabs.find((id) =>
      editorEntityTypes.table.includes(tabStore.tabsMap[id]?.type)
    )
    const lastTableTab = lastTableTabId ? tabStore.tabsMap[lastTableTabId] : undefined
    const lastTabId = lastTableTab?.metadata?.tableId
    // Tabs are keyed by a prefixed id (e.g. "r-293522"), but history only stores
    // the bare table id, so look up the tab by its metadata instead of by key.
    const historyTable = hasHistoryTable
      ? Object.values(tabStore.tabsMap).find(
          (tab) =>
            editorEntityTypes.table.includes(tab.type) &&
            tab.metadata?.tableId === lastOpenedTableId
        )
      : undefined
    const lastTable = hasHistoryTable
      ? { tableId: lastOpenedTableId, schema: historyTable?.metadata?.schema }
      : { tableId: lastTabId, schema: lastTableTab?.metadata?.schema }

    if (lastTable.tableId === undefined) {
      return
    }

    if (isHistoryTraverseRef.current) {
      return
    }

    // Replace so Back skips this index rather than landing on it and redirecting again.
    router.replace(
      buildTableEditorUrl({
        projectRef,
        tableId: lastTable.tableId,
        schema: explicitSchema || lastTable.schema,
      })
    )
    // router and tabStore are intentionally excluded: in the TanStack build useRouter()
    // returns a new object on every navigation-related render, and including it here
    // caused this effect to re-fire mid-navigation and push the same redirect repeatedly,
    // freezing the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explicitSchema, history.editor, isHistoryLoaded, projectRef, router.isReady])

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
