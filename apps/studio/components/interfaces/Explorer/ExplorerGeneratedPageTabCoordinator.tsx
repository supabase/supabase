import { useContext, useEffect } from 'react'

import { removeExplorerGeneratedPage } from '@/state/explorer-generated-page'
import { TabsStateContext } from '@/state/tabs'

/**
 * Drops a generated page's in-memory definition and its carried-over approval when its tab
 * closes, so nothing survives the tab that hosted it. Mounted for every Explorer page,
 * including Explorer home, since a tab can be closed from anywhere in the tab bar.
 */
export const ExplorerGeneratedPageTabCoordinator = () => {
  const tabs = useContext(TabsStateContext)

  useEffect(() => {
    return tabs.registerTabTypeHandler('generated-page', {
      confirmClose: () => ({
        title: 'Close this page?',
        description:
          'This generated page runs only in this browser session. Closing the tab discards it, and the Assistant will need to build it again.',
      }),
      onClose: (tab) => {
        const generatedPageId = tab.metadata?.generatedPageId
        if (generatedPageId) removeExplorerGeneratedPage(generatedPageId)
      },
    })
  }, [tabs])

  return null
}
