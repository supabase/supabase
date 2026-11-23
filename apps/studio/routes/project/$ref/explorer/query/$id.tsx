import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect, useEffectEvent } from 'react'

import { ExplorerQueryTab } from '@/components/interfaces/Explorer/ExplorerQueryTab'
import { explorerQueryState } from '@/state/explorer-query'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const Route = createFileRoute('/project/$ref/explorer/query/$id')({
  component: QueryPage,
})

function QueryPage() {
  const { id, ref } = useParams()
  const tabs = useTabsStateSnapshot()

  const registerTab = useEffectEvent(() => {
    if (!id || !ref) return

    const restored = explorerQueryState.restoreDraft({ id, projectRef: ref })
    const draft = explorerQueryState.drafts[id]
    if (restored && draft) {
      tabs.addTab({
        id: createTabId('query', { id }),
        type: 'query',
        label: draft.name,
        metadata: { queryId: id },
        isPreview: true,
      })
    }
  })

  useEffect(() => registerTab(), [id, ref])

  return <ExplorerQueryTab />
}
