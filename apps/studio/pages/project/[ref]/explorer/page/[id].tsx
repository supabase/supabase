import { useParams } from 'common'
import { useEffect, useEffectEvent } from 'react'

import { ExplorerGeneratedPageTab } from '@/components/interfaces/Explorer/ExplorerGeneratedPageTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import { getExplorerGeneratedPage } from '@/state/explorer-generated-page'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const GeneratedPagePage: NextPageWithLayout = () => {
  const { id, ref } = useParams()
  const tabs = useTabsStateSnapshot()

  const registerTab = useEffectEvent(() => {
    const entry = getExplorerGeneratedPage({ id, projectRef: ref })
    if (!id || !entry) return

    tabs.addTab({
      id: createTabId('generated-page', { id }),
      type: 'generated-page',
      label: entry.page.title,
      metadata: { generatedPageId: id },
      isPreview: false,
    })
  })

  useEffect(() => registerTab(), [id, ref])

  return <ExplorerGeneratedPageTab />
}

GeneratedPagePage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default GeneratedPagePage
