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
import {
  isHistoryTraverseNavigation,
  settleHistoryTraverseNavigation,
} from '@/lib/history-traverse'
import { getLastTableRedirect } from '@/lib/table-editor-redirect'
import { useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const TableEditorPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef, schema: explicitSchema } = useParams()
  const tabStore = useTabsStateSnapshot()
  const { selectedSchema } = useQuerySchemaState()
  const { history, isHistoryLoaded } = useDashboardHistory()
  const decisionRef = useRef<{
    projectRef: string | null
    isHistoryTraverse: boolean
    hasDecided: boolean
  } | null>(null)
  const decision = decisionRef.current
  const hasProjectChanged = Boolean(
    projectRef && decision?.projectRef && decision.projectRef !== projectRef
  )
  const isLateRef = Boolean(projectRef && decision && decision.projectRef === null)

  if (decision === null) {
    decisionRef.current = {
      projectRef: projectRef ?? null,
      isHistoryTraverse: isHistoryTraverseNavigation(),
      hasDecided: false,
    }
  } else if (hasProjectChanged && projectRef) {
    // recapture only when the project changes, so a late ref does not read a settled flag
    decisionRef.current = {
      projectRef,
      isHistoryTraverse: isHistoryTraverseNavigation(),
      hasDecided: false,
    }
  } else if (isLateRef && projectRef) {
    decision.projectRef = projectRef
  }

  const onTableCreated = (table: { id: number }) => {
    router.push(
      `/project/${projectRef}/editor/${table.id}${!!selectedSchema ? `?schema=${selectedSchema}` : ''}`
    )
  }

  useEffect(() => {
    const decision = decisionRef.current
    if (!decision || !isHistoryLoaded || !projectRef || !router.isReady) {
      return
    }

    if (decision.hasDecided && decision.projectRef === projectRef) {
      return
    }

    // decide once per project. a later schema change on the list must not reopen a table.
    decision.projectRef = projectRef
    decision.hasDecided = true
    settleHistoryTraverseNavigation()

    const redirect = getLastTableRedirect({
      historyEditor: history.editor,
      openTabs: tabStore.openTabs,
      tabsMap: tabStore.tabsMap,
      explicitSchema,
    })

    if (!redirect || decision.isHistoryTraverse) {
      return
    }

    // Replace so Back skips this index rather than landing on it and redirecting again.
    router.replace(
      buildTableEditorUrl({
        projectRef,
        tableId: redirect.tableId,
        schema: redirect.schema,
      })
    )
    // explicitSchema and history.editor are inert once the visit is decided.
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
