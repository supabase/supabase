import { useNavigate } from '@tanstack/react-router'
import { useParams } from 'common'

import type { Entity } from '@/data/table-editor/table-editor-types'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { splitInternalUrl } from '@/lib/internal-url'
import { createTabId, useTabsStateSnapshot, type TabRouter } from '@/state/tabs'

/**
 * Closes the tab of a table, view or materialized view that has just been deleted. The tab store
 * only navigates away when the closed tab is the one in focus, so deleting a table that isn't open
 * leaves the current page alone.
 */
export const useCloseDeletedTableTab = () => {
  const navigate = useNavigate()
  const { ref, id: routeTableId } = useParams()
  const { selectedSchema } = useQuerySchemaState()
  const tabs = useTabsStateSnapshot()
  const { setLastVisitedTable } = useDashboardHistory()

  const closeDeletedTableTab = (table: Entity) => {
    let hasNavigated = false
    const router: TabRouter = {
      push: (url) => {
        hasNavigated = true
        const { to, search } = splitInternalUrl(url)
        return navigate({ to, search })
      },
      query: { ref, schema: selectedSchema },
    }

    tabs.handleTabClose({
      id: createTabId(table.entity_type, { id: table.id }),
      router,
      editor: 'table',
      onClearDashboardHistory: () => setLastVisitedTable(undefined),
    })

    const isDeletedTableOpen = routeTableId === String(table.id)
    if (isDeletedTableOpen && !hasNavigated) {
      setLastVisitedTable(undefined)
      void navigate({ to: '/project/$ref/editor', params: { ref: ref ?? '' } })
    }
  }

  return { closeDeletedTableTab }
}
