import { useParams } from 'common'
import { useEffect, useEffectEvent } from 'react'

import { ExplorerNotebookTab } from '@/components/interfaces/Explorer/ExplorerNotebookTab'
import { useLoadNotebook } from '@/components/interfaces/Explorer/hooks'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import { useCurrentNotebook } from '@/state/notebooks/notebooks-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const NotebookPage: NextPageWithLayout = () => {
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
      isPreview: false,
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

NotebookPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default NotebookPage
