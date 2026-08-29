import { RegistryContext, useAtom, useAtomValue } from '@effect/atom-react'
import { Match, Option } from 'effect'
import { AsyncResult } from 'effect/unstable/reactivity'
import { Plus, X } from 'lucide-react'
import { useContext } from 'react'
import { Button } from 'ui'

import type { NotebookId } from '../notebooks/notebook.schema'
import { NotebookCacheKey, notebooksAtoms } from '../notebooks/notebooks.atoms'
import { explorerTabs, type ExplorerTab } from './explorer.tabs'
import { withProjectRef } from '@/domain/project/withProjectRef'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'

const LOADING_LABEL = 'Loading…'

const useChatTabLabel = (chatId: string) =>
  useAiAssistantStateSnapshot().chats[chatId]?.name ?? LOADING_LABEL

const TabLabel = ({ tab, projectRef }: { tab: ExplorerTab; projectRef: string }) => {
  return Match.value(tab).pipe(
    Match.tagsExhaustive({
      QueryTab: () => 'Query',
      NotebookTab: (data) => (
        <NotebookTabLabel notebookId={data.notebookId} projectRef={projectRef} />
      ),
      ChatTab: (data) => <ChatTabLabel chatId={data.chatId} />,
    })
  )
}

const NotebookTabLabel = ({
  notebookId,
  projectRef,
}: {
  notebookId: NotebookId
  projectRef: string
}) => {
  const result = useAtomValue(
    notebooksAtoms.notebookAtom(new NotebookCacheKey({ projectRef, id: notebookId }))
  )

  return (
    <>
      {AsyncResult.match(result, {
        onInitial: () => LOADING_LABEL,
        onFailure: () => 'Failed to load',
        onSuccess: (success) => success.value.name,
      })}
    </>
  )
}

const ChatTabLabel = ({ chatId }: { chatId: string }) => <>{useChatTabLabel(chatId)}</>

const ExplorerTabsInner = ({ projectRef }: { projectRef: string }) => {
  const tabs = useAtomValue(explorerTabs.tabsAtom)
  const [currentTabId, setCurrentTabId] = useAtom(explorerTabs.currentTabAtom)
  const registry = useContext(RegistryContext)

  return (
    <div role="tablist" aria-label="Explorer tabs" className="flex items-center border-b">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={Option.contains(currentTabId, tab.id)}
          className="flex items-center gap-1 border-r px-3 py-1.5 text-sm text-foreground-light aria-selected:bg-surface-300 aria-selected:text-foreground"
          onClick={() => setCurrentTabId(tab.id)}
          onDoubleClick={() => explorerTabs.persistTab(registry, tab.id)}
        >
          <TabLabel tab={tab.data} projectRef={projectRef} />
          <Button
            variant="text"
            size="tiny"
            icon={<X size={12} />}
            aria-label="Close tab"
            onClick={(e) => {
              e.stopPropagation()
              explorerTabs.closeTab(registry, tab.id)
            }}
          />
        </div>
      ))}
      <Button
        variant="text"
        size="tiny"
        icon={<Plus size={14} />}
        aria-label="New tab"
        onClick={() => explorerTabs.addTab(registry, { _tag: 'QueryTab' })}
      />
    </div>
  )
}

export const ExplorerTabs = withProjectRef(ExplorerTabsInner, null)
