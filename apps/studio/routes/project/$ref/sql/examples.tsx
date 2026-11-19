import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect } from 'react'

import SQLExamples from '@/components/interfaces/SQLEditor/SQLTemplates/SQLExamples'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const Route = createFileRoute('/project/$ref/sql/examples')({
  component: SqlExamples,
})

function SqlExamples() {
  const { ref } = useParams()
  const tabs = useTabsStateSnapshot()

  useEffect(() => {
    const tabId = createTabId('sql', { id: 'examples' })
    tabs.addTab({
      id: tabId,
      type: 'sql',
      label: 'Examples',
      metadata: {
        sqlId: 'examples',
        name: 'examples',
      },
    })
  }, [ref])

  return <SQLExamples />
}
