import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'
import { useEffect, useEffectEvent } from 'react'

import { ExplorerNotebookTab } from '@/components/interfaces/Explorer/ExplorerNotebookTab'
import { useLoadNotebook } from '@/components/interfaces/Explorer/hooks'
import { useCurrentNotebook } from '@/state/notebooks/notebooks-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const Route = createFileRoute('/project/$ref/explorer/notebook/$id')({
  component: NotebookPage,
})

function NotebookPage() {
  const { ref, id } = useParams()
  const tabs = useTabsStateSnapshot()

  const currentNotebook = useCurrentNotebook()
  const { name } = currentNotebook?.notebook ?? {}
  const { isNotFound } = useLoadNotebook({ id, projectRef: ref })

  const registerTab = useEffectEvent(() => {
    if (!id || isNotFound) return
    tabs.addTab({
      id: createTabId('notebook', { id }),
      type: 'notebook',
      label: name ?? 'New Notebook',
      metadata: { notebookId: id },
      isPreview: true,
    })
  })

  const backfillTabLabel = useEffectEvent(() => {
    if (!id || !name) return
    tabs.updateTab(createTabId('notebook', { id }), { label: name })
  })

  useEffect(() => registerTab(), [id])

  useEffect(() => backfillTabLabel(), [id, name])

  return <ExplorerNotebookTab />
}
