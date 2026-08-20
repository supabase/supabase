import { useParams } from 'common'
import { useEffect, useEffectEvent } from 'react'

import { ExplorerNotebookTab } from '@/components/interfaces/Explorer/ExplorerNotebookTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import { useCurrentNotebook } from '@/state/notebooks/notebooks-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const NotebookPage: NextPageWithLayout = () => {
  const { id } = useParams()
  const tabs = useTabsStateSnapshot()

  const currentNotebook = useCurrentNotebook()
  const { name } = currentNotebook?.notebook ?? {}

  const registerTab = useEffectEvent(() => {
    if (!id) return
    tabs.addTab({
      id: createTabId('notebook', { id }),
      type: 'notebook',
      label: name ?? 'New Notebook',
      metadata: { notebookId: id },
      isPreview: false,
    })
  })

  useEffect(() => registerTab(), [id])

  return <ExplorerNotebookTab />
}

NotebookPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default NotebookPage
