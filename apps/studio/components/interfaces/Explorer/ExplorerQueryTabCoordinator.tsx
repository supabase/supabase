import { useParams } from 'common'
import { useContext, useEffect } from 'react'

import { explorerQueryState, hasDiscardableContent } from '@/state/explorer-query'
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
        for (const tab of queryTabs) {
          const queryId = tab.metadata?.queryId
          if (ref && queryId) explorerQueryState.restoreDraft({ id: queryId, projectRef: ref })
        }

        const populatedDraftCount = queryTabs.filter((tab) => {
          const queryId = tab.metadata?.queryId
          if (!queryId) return false
          const draft = explorerQueryState.drafts[queryId]
          return draft !== undefined && hasDiscardableContent(draft)
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

  useEffect(() => {
    if (!ref) return

    const flushProjectDrafts = () => explorerQueryState.flushPendingPersistence({ projectRef: ref })
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushProjectDrafts()
    }

    window.addEventListener('pagehide', flushProjectDrafts)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', flushProjectDrafts)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [ref])

  return null
}
