import { useParams } from 'common'
import { useEffect } from 'react'

import { useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export const NotebookEditor = () => {
  const { id } = useParams()
  const tabs = useTabsStateSnapshot()
  const snap = useNotebooksStateSnapshot()
  const stateNotebook = id ? snap.notebooks[id] : undefined

  useEffect(() => {
    if (!id) return
    tabs.addTab({
      id: createTabId('notebook', { id }),
      type: 'notebook',
      label: stateNotebook?.notebook.name ?? 'New Notebook',
      metadata: { notebookId: id },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, stateNotebook?.notebook.name])

  return <div>This is a notebook</div>
}
