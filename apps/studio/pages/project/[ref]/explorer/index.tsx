import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect, useEffectEvent } from 'react'

import {
  ExplorerHomeLoading,
  ExplorerHomeTab,
} from '@/components/interfaces/Explorer/ExplorerHomeTab'
import { useLoadNotebook } from '@/components/interfaces/Explorer/hooks'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import { ExplorerLayout } from '@/components/layouts/ExplorerLayout/ExplorerLayout'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { explorerQueryState } from '@/state/explorer-query'
import { EXPLORER_HOME_TAB, useTabsStateSnapshot } from '@/state/tabs'
import type { NextPageWithLayout } from '@/types'

const ProjectExplorerPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const tabs = useTabsStateSnapshot()
  const aiAssistant = useAiAssistantStateSnapshot()
  const { history, isHistoryLoaded, setLastVisitedExplorerTab } = useDashboardHistory()

  const lastVisited = history.explorer
  const lastVisitedNotebookId = lastVisited?.type === 'notebook' ? lastVisited.id : undefined
  const { isNotFound: isNotebookNotFound, isLoading: isNotebookLoading } = useLoadNotebook({
    id: lastVisitedNotebookId,
    projectRef,
  })

  const activateHomeTab = useEffectEvent(() => {
    tabs.activatePinnedTab(EXPLORER_HOME_TAB)
  })

  // Redirects to the last opened Explorer tab if it still exists, otherwise falls
  // back to (and stays on) the Home tab. Existence is checked per tab type: query
  // drafts and chats are local and resolve synchronously, notebooks require the
  // server round trip in `useLoadNotebook` above to resolve first.
  const goToLastVisitedTab = useEffectEvent(() => {
    if (!projectRef) return

    if (!lastVisited) {
      activateHomeTab()
      return
    }

    if (lastVisited.type === 'query') {
      const exists = explorerQueryState.restoreDraft({ id: lastVisited.id, projectRef })
      if (exists) {
        router.replace(`/project/${projectRef}/explorer/query/${lastVisited.id}`)
      } else {
        setLastVisitedExplorerTab(undefined)
        activateHomeTab()
      }
      return
    }

    if (lastVisited.type === 'chat') {
      if (!aiAssistant.isInitialized) return

      if (aiAssistant.chats[lastVisited.id]) {
        router.replace(`/project/${projectRef}/explorer/chat/${lastVisited.id}`)
      } else {
        setLastVisitedExplorerTab(undefined)
        activateHomeTab()
      }
      return
    }

    // notebook
    if (isNotebookLoading) return

    if (isNotebookNotFound) {
      setLastVisitedExplorerTab(undefined)
      activateHomeTab()
    } else {
      router.replace(`/project/${projectRef}/explorer/notebook/${lastVisited.id}`)
    }
  })

  useEffect(() => {
    if (isHistoryLoaded) goToLastVisitedTab()
  }, [
    isHistoryLoaded,
    projectRef,
    lastVisited?.type,
    lastVisited?.id,
    aiAssistant.isInitialized,
    isNotebookLoading,
    isNotebookNotFound,
  ])

  const isCheckingLastTab =
    !projectRef ||
    !isHistoryLoaded ||
    (lastVisited?.type === 'chat' && !aiAssistant.isInitialized) ||
    (lastVisited?.type === 'notebook' && isNotebookLoading)

  if (isCheckingLastTab) return <ExplorerHomeLoading />
  return <ExplorerHomeTab />
}

ProjectExplorerPage.getLayout = (page) => (
  <DefaultLayout>
    <ExplorerLayout>{page}</ExplorerLayout>
  </DefaultLayout>
)

export default ProjectExplorerPage
