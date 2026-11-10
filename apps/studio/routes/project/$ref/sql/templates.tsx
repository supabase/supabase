import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect } from 'react'

import SQLTemplates from '@/components/interfaces/SQLEditor/SQLTemplates/SQLTemplates'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const Route = createFileRoute('/project/$ref/sql/templates')({
  component: SqlTemplates,
})

function SqlTemplates() {
  const { ref } = useParams()
  const tabs = useTabsStateSnapshot()

  useEffect(() => {
    const tabId = createTabId('sql', { id: 'templates' })
    tabs.addTab({
      id: tabId,
      type: 'sql',
      label: 'Templates',
      metadata: {
        sqlId: 'templates',
        name: 'templates',
      },
    })
  }, [ref])

  return <SQLTemplates />
}
