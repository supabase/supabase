import { useRouter } from 'next/router'

import type { Entity } from '@/data/table-editor/table-editor-types'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

/**
 * Closes the tab of a table, view or materialized view that has just been deleted. The tab store
 * only navigates away when the closed tab is the one in focus, so deleting a table that isn't open
 * leaves the current page alone.
 */
export const useCloseDeletedTableTab = () => {
  // `tabs.handleTabClose` still takes a Next-shaped router
  const router = useRouter()
  const tabs = useTabsStateSnapshot()
  const { setLastVisitedTable } = useDashboardHistory()

  const closeDeletedTableTab = (table: Entity) => {
    tabs.handleTabClose({
      id: createTabId(table.entity_type, { id: table.id }),
      router,
      editor: 'table',
      onClearDashboardHistory: () => setLastVisitedTable(undefined),
    })
  }

  return { closeDeletedTableTab }
}
