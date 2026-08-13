import { useParams } from 'common'
import { useContext, useEffect } from 'react'

import { explorerQueryState } from '@/state/explorer-query'
import { TabsStateContext } from '@/state/tabs'

/**
 * Owns local query-draft cleanup and close confirmation for every Explorer page,
 * including Explorer home where no individual query editor is mounted.
 */
export const ExplorerQueryTabCoordinator = () => {
  const { ref } = useParams()
  const tabs = useContext(TabsStateContext)

  useEffect(() => {
    return tabs.registerTabTypeHandler('query', {
      confirmClose: (queryTabs) => {
        const populatedDraftCount = queryTabs.filter((tab) => {
          const queryId = tab.metadata?.queryId
          if (!ref || !queryId) return false

          explorerQueryState.restoreDraft({ id: queryId, projectRef: ref })

          return explorerQueryState.drafts[queryId]?.uncheckedSql.trim().length > 0
        }).length

        if (populatedDraftCount === 0) return null

        return {
          title: populatedDraftCount === 1 ? 'Discard query?' : 'Discard queries?',
          description:
            populatedDraftCount === 1
              ? 'This ad-hoc query is stored only in this browser. Closing the tab will discard it.'
              : `These ${populatedDraftCount} ad-hoc queries are stored only in this browser. Closing their tabs will discard them.`,
        }
      },
      onClose: (tab) => {
        const queryId = tab.metadata?.queryId
        if (ref && queryId) explorerQueryState.removeDraft({ id: queryId, projectRef: ref })
      },
    })
  }, [ref, tabs])

  return null
}
