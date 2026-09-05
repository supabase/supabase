import { useEffect, useEffectEvent } from 'react'

import { ExplorerHomeTab } from '@/components/interfaces/Explorer/ExplorerHomeTab'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import { EXPLORER_HOME_TAB, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const ProjectExplorerPage: NextPageWithLayout = () => {
  const tabs = useTabsStateSnapshot()

  const activateHomeTab = useEffectEvent(() => {
    tabs.activatePinnedTab(EXPLORER_HOME_TAB)
  })

  useEffect(() => activateHomeTab(), [])

  return <ExplorerHomeTab />
}

ProjectExplorerPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default ProjectExplorerPage
