import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { useTabsStateSnapshot } from '@/state/tabs'

export const Route = createFileRoute('/project/$ref/sql/')({
  component: SQLEditorIndexPage,
})

function SQLEditorIndexPage() {
  const navigate = useNavigate()
  const { ref: projectRef } = Route.useParams()
  const store = useTabsStateSnapshot()

  const { history, isHistoryLoaded } = useDashboardHistory()

  useEffect(() => {
    if (isHistoryLoaded) {
      // Handle redirect to last opened snippet tab, or last snippet tab
      const lastOpenedTab = history.sql
      const lastTabId = store.openTabs.find((id) => store.tabsMap[id]?.type === 'sql')
      if (lastOpenedTab !== undefined) {
        void navigate({
          to: '/project/$ref/sql/$id',
          params: { ref: projectRef, id: lastOpenedTab },
          replace: true,
        })
      } else if (lastTabId) {
        const lastTab = store.tabsMap[lastTabId]
        if (lastTab) {
          void navigate({
            to: '/project/$ref/sql/$id',
            params: { ref: projectRef, id: lastTab.id.replace('sql-', '') },
            replace: true,
          })
        }
      } else {
        void navigate({
          to: '/project/$ref/sql/$id',
          params: { ref: projectRef, id: 'new' },
          replace: true,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHistoryLoaded])

  return null
}
