import { useParams } from 'common'
import { useEffect, useEffectEvent } from 'react'

import { QueryTab } from '@/components/interfaces/Explorer/QueryTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const QueryPage: NextPageWithLayout = () => {
  const { id } = useParams()
  const tabs = useTabsStateSnapshot()

  const registerTab = useEffectEvent(() => {
    if (!id) return
    tabs.addTab({
      id: createTabId('query', { id }),
      type: 'query',
      label: 'Untitled query',
      metadata: { queryId: id },
      isPreview: false,
    })
  })

  useEffect(() => registerTab(), [id])

  return <QueryTab />
}

QueryPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default QueryPage
