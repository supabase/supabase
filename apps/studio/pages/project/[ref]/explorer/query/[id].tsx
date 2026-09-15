import { useParams } from 'common'
import { useEffect, useEffectEvent } from 'react'

import { ExplorerQueryTab } from '@/components/interfaces/Explorer/ExplorerQueryTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import { explorerQueryState } from '@/state/explorer-query'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const QueryPage: NextPageWithLayout = () => {
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

QueryPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default QueryPage
